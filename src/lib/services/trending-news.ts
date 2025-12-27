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
      .slice(0, 20); // Keep top 20

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
 */
function scoreHeadline(headline: TrendingHeadline): number {
  const title = headline.title.toLowerCase();
  let score = 0;

  // Prefer headlines that make factual claims
  if (/says|claims|reports|announces|confirms|denies|according to/i.test(title)) {
    score += 3;
  }

  // Prefer headlines with numbers/statistics
  if (/\d+%|\$\d+|\d+ (million|billion|people|deaths|cases)/i.test(title)) {
    score += 2;
  }

  // Prefer political/policy/science topics that benefit from fact-checking
  if (/president|congress|senate|election|vaccine|climate|study|research/i.test(title)) {
    score += 2;
  }

  // Slightly penalize breaking/urgent news (may not be fully verifiable yet)
  if (/breaking|just in|developing/i.test(title)) {
    score -= 1;
  }

  // Penalize entertainment/sports (less need for fact-checking)
  if (/movie|film|album|concert|game|score|wins|loses|playoffs/i.test(title)) {
    score -= 2;
  }

  // Prefer medium-length headlines (not too short, not too long)
  if (title.length >= 40 && title.length <= 120) {
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

  // Take top headlines, but ensure variety
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
