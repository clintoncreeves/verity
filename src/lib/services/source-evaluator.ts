/**
 * Source Evaluator for Verity
 * Evaluates the reliability of sources based on domain and characteristics
 */

import { extractDomain } from '@/lib/utils/api-helpers';

export interface SourceEvaluation {
  reliabilityScore: number;
  type: string;
  factors: string[];
}

// Domain type definitions with base reliability scores
const DOMAIN_TYPES = {
  government: { baseScore: 85, label: 'Government Source' },
  academic: { baseScore: 85, label: 'Academic/Research' },
  scientific: { baseScore: 90, label: 'Scientific Publication' },
  news_wire: { baseScore: 80, label: 'News Wire Service' },
  news_major: { baseScore: 75, label: 'Major News Outlet' },
  fact_checker: { baseScore: 85, label: 'Fact-Checking Organization' },
  nonprofit: { baseScore: 65, label: 'Nonprofit Organization' },
  news_local: { baseScore: 60, label: 'Local News' },
  commercial: { baseScore: 50, label: 'Commercial Website' },
  social_media: { baseScore: 25, label: 'Social Media' },
  unknown: { baseScore: 40, label: 'Unknown Source' },
} as const;

// Known reliable domains
const RELIABLE_DOMAINS: Record<string, keyof typeof DOMAIN_TYPES> = {
  // Government
  'gov': 'government',
  'gov.uk': 'government',
  'europa.eu': 'government',
  'who.int': 'government',
  'un.org': 'government',
  'cdc.gov': 'government',
  'nih.gov': 'government',
  'fda.gov': 'government',
  'nasa.gov': 'government',

  // Academic
  'edu': 'academic',
  'ac.uk': 'academic',
  'arxiv.org': 'academic',

  // Scientific publishers
  'nature.com': 'scientific',
  'science.org': 'scientific',
  'sciencedirect.com': 'scientific',
  'springer.com': 'scientific',
  'cell.com': 'scientific',
  'thelancet.com': 'scientific',
  'nejm.org': 'scientific',
  'bmj.com': 'scientific',
  'plos.org': 'scientific',
  'pubmed.gov': 'scientific',
  'ncbi.nlm.nih.gov': 'scientific',

  // News wires
  'reuters.com': 'news_wire',
  'apnews.com': 'news_wire',
  'afp.com': 'news_wire',

  // Major news
  'bbc.com': 'news_major',
  'bbc.co.uk': 'news_major',
  'nytimes.com': 'news_major',
  'washingtonpost.com': 'news_major',
  'theguardian.com': 'news_major',
  'wsj.com': 'news_major',
  'economist.com': 'news_major',
  'ft.com': 'news_major',
  'bloomberg.com': 'news_major',
  'npr.org': 'news_major',
  'pbs.org': 'news_major',
  'cnn.com': 'news_major',
  'nbcnews.com': 'news_major',
  'abcnews.go.com': 'news_major',
  'cbsnews.com': 'news_major',
  'axios.com': 'news_major',
  'politico.com': 'news_major',
  'theatlantic.com': 'news_major',

  // Fact-checkers
  'snopes.com': 'fact_checker',
  'politifact.com': 'fact_checker',
  'factcheck.org': 'fact_checker',
  'fullfact.org': 'fact_checker',
  'factcheck.afp.com': 'fact_checker',
  'leadstories.com': 'fact_checker',

  // Social media (low reliability for claims)
  'twitter.com': 'social_media',
  'x.com': 'social_media',
  'facebook.com': 'social_media',
  'instagram.com': 'social_media',
  'tiktok.com': 'social_media',
  'reddit.com': 'social_media',
  'youtube.com': 'social_media',
  'linkedin.com': 'social_media',
};

// Known unreliable domains
const UNRELIABLE_DOMAINS = new Set([
  'infowars.com',
  'naturalnews.com',
  'beforeitsnews.com',
  'yournewswire.com',
  'worldnewsdailyreport.com',
]);

/**
 * Evaluate the reliability of a source
 */
export function evaluateSource(url: string): SourceEvaluation {
  const domain = extractDomain(url);
  const domainLower = domain.toLowerCase();
  const factors: string[] = [];

  // Check for known unreliable sources first
  if (UNRELIABLE_DOMAINS.has(domainLower)) {
    return {
      reliabilityScore: 10,
      type: 'Known Unreliable',
      factors: ['Domain is known for publishing misinformation'],
    };
  }

  // Determine domain type
  let domainType: keyof typeof DOMAIN_TYPES = 'unknown';

  // Check exact domain matches
  for (const [pattern, type] of Object.entries(RELIABLE_DOMAINS)) {
    if (domainLower === pattern || domainLower.endsWith('.' + pattern)) {
      domainType = type;
      factors.push(`Recognized ${DOMAIN_TYPES[type].label.toLowerCase()}`);
      break;
    }
  }

  // Check TLD patterns if no exact match
  if (domainType === 'unknown') {
    if (domainLower.endsWith('.gov') || domainLower.includes('.gov.')) {
      domainType = 'government';
      factors.push('Government domain (.gov)');
    } else if (domainLower.endsWith('.edu') || domainLower.includes('.edu.')) {
      domainType = 'academic';
      factors.push('Academic institution (.edu)');
    } else if (domainLower.endsWith('.org')) {
      domainType = 'nonprofit';
      factors.push('Nonprofit organization (.org)');
    } else if (domainLower.endsWith('.com')) {
      domainType = 'commercial';
      factors.push('Commercial website (.com)');
    }
  }

  // Start with base score for domain type
  let score: number = DOMAIN_TYPES[domainType].baseScore;

  // HTTPS bonus
  if (url.startsWith('https://')) {
    score += 5;
    factors.push('Secure connection (HTTPS)');
  } else if (url.startsWith('http://')) {
    score -= 10;
    factors.push('Insecure connection (HTTP)');
  }

  // Subdomain analysis
  const parts = domainLower.split('.');
  if (parts.length > 2) {
    const subdomain = parts[0];
    if (['www', 'en', 'news', 'blog', 'm', 'mobile'].includes(subdomain)) {
      // Standard subdomains - no penalty
    } else if (['cdn', 'static', 'assets', 'img'].includes(subdomain)) {
      // Asset subdomains - slight concern
      score -= 5;
      factors.push('Asset/CDN subdomain');
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  return {
    reliabilityScore: Math.round(score),
    type: DOMAIN_TYPES[domainType].label,
    factors,
  };
}

/**
 * Batch evaluate multiple sources
 */
export function evaluateSources(urls: string[]): Map<string, SourceEvaluation> {
  const results = new Map<string, SourceEvaluation>();
  for (const url of urls) {
    results.set(url, evaluateSource(url));
  }
  return results;
}

/**
 * Get source type from URL
 */
export function getSourceType(url: string): string {
  const evaluation = evaluateSource(url);
  return evaluation.type;
}

/**
 * Check if a source is considered reliable (score >= 60)
 */
export function isReliableSource(url: string): boolean {
  const evaluation = evaluateSource(url);
  return evaluation.reliabilityScore >= 60;
}
