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

// Google News RSS endpoints - multiple categories for diversity
const GOOGLE_NEWS_RSS = 'https://news.google.com/rss';
const GOOGLE_NEWS_WORLD = 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en'; // World
const GOOGLE_NEWS_POLITICS = 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4ZERBU0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US:en'; // US Politics
const GOOGLE_NEWS_BUSINESS = 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en'; // Business
const GOOGLE_NEWS_HEALTH = 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US:en'; // Health

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
    // Fetch from multiple RSS feeds for more diverse headlines
    const feeds = [
      GOOGLE_NEWS_RSS,
      GOOGLE_NEWS_POLITICS,
      GOOGLE_NEWS_WORLD,
      GOOGLE_NEWS_BUSINESS,
      GOOGLE_NEWS_HEALTH,
    ];

    const allHeadlines: TrendingHeadline[] = [];
    const seenTitles = new Set<string>();

    await Promise.all(
      feeds.map(async (feedUrl) => {
        try {
          const response = await fetch(feedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Verity/1.0)',
            },
            next: { revalidate: 3600 },
          });

          if (response.ok) {
            const xml = await response.text();
            const feedHeadlines = parseRSSXML(xml);
            for (const h of feedHeadlines) {
              if (!seenTitles.has(h.title)) {
                seenTitles.add(h.title);
                allHeadlines.push(h);
              }
            }
          }
        } catch (e) {
          console.error(`[Verity] Failed to fetch ${feedUrl}:`, e);
        }
      })
    );

    if (allHeadlines.length === 0) {
      console.error('[Verity] All Google News RSS feeds failed');
      return headlinesCache;
    }

    const headlines = allHeadlines;

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
function scoreHeadlineForVerifiable(headline: TrendingHeadline): number {
  const title = headline.title.toLowerCase();
  let score = 0;

  // STRONGLY PENALIZE meta-commentary and analysis headlines (these verify poorly)
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
 * Score a headline for likelihood of producing mixed/nuanced verdicts
 * These are MORE interesting for showcasing Verity's analytical depth
 *
 * GOAL: Find headlines about predictions, opinions, disputed topics, or nuanced claims
 */
function scoreHeadlineForNuanced(headline: TrendingHeadline): number {
  const title = headline.title.toLowerCase();
  let score = 0;

  // PREFER future-oriented headlines (can't be fully verified)
  if (/plans to|expected to|will|set to|aims to|prepares|preparing/i.test(title)) {
    score += 5;
  }

  // PREFER hedged/qualified statements (often partially verified)
  if (/could|may|might|likely|possibly|appears to|seems to/i.test(title)) {
    score += 4;
  }

  // PREFER analysis and opinion (interesting to verify the underlying facts)
  if (/analysis|experts say|according to|study (finds|shows|suggests)/i.test(title)) {
    score += 3;
  }

  // PREFER policy/impact claims (often nuanced)
  if (/would bring|impact|effect|changes|implications|consequences/i.test(title)) {
    score += 4;
  }

  // PREFER comparative or superlative claims (often disputed)
  if (/best|worst|most|least|first|record|all-time|unprecedented/i.test(title)) {
    score += 3;
  }

  // PREFER controversial or disputed topics
  if (/debate|disputed|controversial|critics|supporters|opponents/i.test(title)) {
    score += 4;
  }

  // PREFER predictions and forecasts
  if (/predict|forecast|expect|anticipate|outlook/i.test(title)) {
    score += 4;
  }

  // Penalize simple factual reports (too easy to verify)
  if (/killed|died|arrested|charged|convicted|sentenced/i.test(title)) {
    score -= 3;
  }

  // Penalize pure entertainment (not interesting for fact-checking)
  if (/movie|film|album|concert|celebrity|star|trailer|release date/i.test(title)) {
    score -= 5;
  }

  // Penalize clickbait
  if (/exclusive:|video:|watch:|photos:|you won't believe/i.test(title)) {
    score -= 5;
  }

  // Prefer medium-length headlines
  if (title.length >= 40 && title.length <= 120) {
    score += 1;
  }

  return score;
}

/**
 * Get the best headlines for showcasing Verity
 * Uses Verity's core decomposition logic via Claude to predict verdict diversity
 */
export async function getBestHeadlines(count: number = 6): Promise<TrendingHeadline[]> {
  const { analyzeHeadlines, selectDiverseByPrediction } = await import('./headline-analyzer');

  const headlines = await fetchTrendingHeadlines();

  if (headlines.length === 0) {
    return [];
  }

  // Use regex pre-filter to get candidates (fast, no API call)
  const candidates = headlines
    .map(h => ({ headline: h, score: scoreHeadlineForNuanced(h) + scoreHeadlineForVerifiable(h) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 25) // Top 25 candidates for AI analysis
    .map(s => s.headline);

  // Use Claude to analyze claim structure and predict verdict buckets
  console.log(`[Verity] Analyzing ${candidates.length} headline candidates with Claude...`);
  const analyzed = await analyzeHeadlines(candidates);

  // Select diverse headlines based on AI predictions
  const selected = selectDiverseByPrediction(analyzed, count);
  console.log(`[Verity] Selected ${selected.length} headlines with predictions:`,
    selected.map(h => `${h.prediction}: ${h.title.substring(0, 40)}...`));

  return selected.map(({ prediction, reasoning, ...headline }) => headline);
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
