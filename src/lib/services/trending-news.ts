/**
 * Trending News Service
 * Fetches headlines from Google News RSS feed
 */

export interface TrendingHeadline {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

// Google News RSS endpoints
const GOOGLE_NEWS_RSS = 'https://news.google.com/rss';
const GOOGLE_NEWS_TOP = 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB'; // Top stories

// Cache for headlines (refresh once per hour)
let headlinesCache: TrendingHeadline[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Parse Google News RSS XML into headlines
 */
function parseRSSXML(xml: string): TrendingHeadline[] {
  const headlines: TrendingHeadline[] = [];

  // Simple regex-based XML parsing (avoid heavy dependencies)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
  const linkRegex = /<link>(.*?)<\/link>/;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
  const sourceRegex = /<source[^>]*>(.*?)<\/source>/;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const titleMatch = titleRegex.exec(item);
    const linkMatch = linkRegex.exec(item);
    const pubDateMatch = pubDateRegex.exec(item);
    const sourceMatch = sourceRegex.exec(item);

    const rawTitle = titleMatch?.[1] || titleMatch?.[2] || '';
    // Google News titles often include " - Source Name", extract the claim part
    const titleParts = rawTitle.split(' - ');
    const title = titleParts.length > 1 ? titleParts.slice(0, -1).join(' - ') : rawTitle;
    const sourceFromTitle = titleParts.length > 1 ? titleParts[titleParts.length - 1] : '';

    if (title) {
      headlines.push({
        title: title.trim(),
        source: sourceMatch?.[1] || sourceFromTitle || 'Unknown',
        url: linkMatch?.[1] || '',
        publishedAt: pubDateMatch?.[1] || new Date().toISOString(),
      });
    }
  }

  return headlines;
}

/**
 * Fetch trending headlines from Google News
 */
export async function fetchTrendingHeadlines(): Promise<TrendingHeadline[]> {
  const now = Date.now();

  // Return cache if still valid
  if (headlinesCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return headlinesCache;
  }

  try {
    const response = await fetch(GOOGLE_NEWS_RSS, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Verity/1.0)',
      },
      next: { revalidate: 3600 }, // Next.js cache for 1 hour
    });

    if (!response.ok) {
      console.error('[Verity] Google News RSS failed:', response.status);
      return headlinesCache; // Return stale cache if available
    }

    const xml = await response.text();
    const headlines = parseRSSXML(xml);

    // Filter to headlines that look like verifiable claims
    const filteredHeadlines = headlines
      .filter(h => {
        // Skip very short headlines
        if (h.title.length < 20) return false;
        // Skip questions (we want statements to verify)
        if (h.title.endsWith('?')) return false;
        // Skip listicles and how-tos
        if (/^\d+\s/.test(h.title) || h.title.toLowerCase().startsWith('how to')) return false;
        return true;
      })
      .slice(0, 50); // Keep top 50 for more variety

    headlinesCache = filteredHeadlines;
    lastFetchTime = now;

    return filteredHeadlines;
  } catch (error) {
    console.error('[Verity] Failed to fetch trending headlines:', error);
    return headlinesCache; // Return stale cache on error
  }
}

/**
 * Get a single trending headline for display
 * Rotates based on the hour to provide variety
 */
export async function getTrendingHeadline(): Promise<TrendingHeadline | null> {
  const headlines = await fetchTrendingHeadlines();

  if (headlines.length === 0) {
    return null;
  }

  // Rotate based on current hour
  const hour = new Date().getUTCHours();
  const index = hour % headlines.length;

  return headlines[index];
}

/**
 * Score a headline for how well it demonstrates Verity's capabilities
 * Higher scores = better for showcasing the platform
 *
 * GOAL: Find headlines with concrete, verifiable facts - not meta-commentary
 */
function scoreHeadline(headline: TrendingHeadline): number {
  const title = headline.title.toLowerCase();
  let score = 0;

  // STRONGLY PENALIZE meta-commentary and analysis headlines (these verify poorly)
  // These are headlines ABOUT claims/situations, not actual claims
  if (/belie|analysis|opinion|editorial|commentary|what (it|this|we) (means|know)|explained/i.test(title)) {
    score -= 10;
  }
  if (/claims about|questions about|debate over|controversy|complex situation/i.test(title)) {
    score -= 8;
  }

  // STRONGLY PENALIZE vague/subjective headlines
  if (/could|may|might|likely|possibly|appears to|seems to/i.test(title)) {
    score -= 5;
  }

  // STRONGLY PREFER concrete event headlines with clear facts
  // Direct statements about what happened
  if (/killed|died|arrested|charged|convicted|sentenced|signed|passed|approved|rejected/i.test(title)) {
    score += 5;
  }
  if (/announces|declared|launches|releases|bans|suspends|fires|resigns/i.test(title)) {
    score += 4;
  }

  // Prefer headlines with specific numbers/statistics (concrete and verifiable)
  if (/\d+ (people|dead|killed|injured|arrested|million|billion|percent|%)/i.test(title)) {
    score += 4;
  }
  if (/\$[\d,]+|\d+%/i.test(title)) {
    score += 3;
  }

  // Prefer headlines about concrete events
  if (/earthquake|storm|fire|flood|crash|explosion|attack|bombing|strike/i.test(title)) {
    score += 3;
  }

  // Government/policy actions (usually verifiable)
  if (/president|congress|senate|court|judge|ruling|law|bill|executive order/i.test(title)) {
    score += 2;
  }

  // Penalize breaking/developing news (not fully verifiable yet)
  if (/breaking|just in|developing|live updates/i.test(title)) {
    score -= 3;
  }

  // Penalize entertainment/sports (less need for fact-checking)
  if (/movie|film|album|concert|game|score|wins|loses|playoffs|celebrity|star/i.test(title)) {
    score -= 4;
  }

  // Penalize "exclusive" and "video" headlines (often clickbait)
  if (/exclusive:|video:|watch:|photos:/i.test(title)) {
    score -= 3;
  }

  // Prefer medium-length headlines (not too short, not too long)
  if (title.length >= 30 && title.length <= 100) {
    score += 1;
  }

  return score;
}

/**
 * Get the best headlines for showcasing Verity
 * Returns 5-8 headlines sorted by how well they demonstrate fact-checking
 */
export async function getBestHeadlines(count: number = 6): Promise<TrendingHeadline[]> {
  const headlines = await fetchTrendingHeadlines();

  if (headlines.length === 0) {
    return [];
  }

  // Score and sort headlines
  const scoredHeadlines = headlines
    .map(h => ({ headline: h, score: scoreHeadline(h) }))
    .sort((a, b) => b.score - a.score);

  // Take top headlines, but ensure variety by source
  const selected: TrendingHeadline[] = [];
  const usedSources = new Set<string>();

  for (const { headline } of scoredHeadlines) {
    // Skip if we already have a headline from this source
    if (usedSources.has(headline.source)) {
      continue;
    }

    selected.push(headline);
    usedSources.add(headline.source);

    if (selected.length >= count) {
      break;
    }
  }

  // If we don't have enough, add more regardless of source
  if (selected.length < count) {
    for (const { headline } of scoredHeadlines) {
      if (!selected.includes(headline)) {
        selected.push(headline);
        if (selected.length >= count) break;
      }
    }
  }

  return selected;
}

// Verdict diversity buckets for better showcase
type VerdictBucket = 'verified' | 'mixed' | 'false';

function getVerdictBucket(category: string): VerdictBucket {
  if (['verified_fact', 'expert_consensus'].includes(category)) return 'verified';
  if (['likely_false', 'confirmed_false'].includes(category)) return 'false';
  return 'mixed'; // partially_verified, disputed, opinion, speculation
}

/**
 * Select headlines with diverse verdicts to showcase Verity's range
 * Prioritizes showing a mix of verified, mixed, and false verdicts
 */
export function selectDiverseHeadlines<T extends { cached?: { category: string } }>(
  headlines: T[],
  targetCount: number = 6
): T[] {
  // Separate by verdict bucket
  const buckets: Record<VerdictBucket, T[]> = {
    verified: [],
    mixed: [],
    false: [],
  };

  for (const headline of headlines) {
    if (headline.cached) {
      const bucket = getVerdictBucket(headline.cached.category);
      buckets[bucket].push(headline);
    } else {
      // Uncached go to mixed (neutral)
      buckets.mixed.push(headline);
    }
  }

  // Select with diversity: prioritize mixed/false results to show Verity's range
  // Ideal mix: 2-3 verified, 2-3 mixed/opinion, 1-2 false/disputed
  const selected: T[] = [];

  // First, take non-verified results (more interesting for demo)
  const nonVerified = [...buckets.mixed, ...buckets.false];
  for (const h of nonVerified) {
    if (selected.length >= Math.ceil(targetCount * 0.6)) break; // Max 60% non-verified
    selected.push(h);
  }

  // Fill rest with verified
  for (const h of buckets.verified) {
    if (selected.length >= targetCount) break;
    selected.push(h);
  }

  // If still not enough, add any remaining
  for (const h of headlines) {
    if (selected.length >= targetCount) break;
    if (!selected.includes(h)) {
      selected.push(h);
    }
  }

  return selected;
}
