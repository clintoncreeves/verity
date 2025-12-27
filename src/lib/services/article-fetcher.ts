/**
 * Article Fetcher Service
 * Uses Claude with web search to find and summarize article content
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Maximum excerpt length (characters)
const MAX_EXCERPT_LENGTH = 1500;

/**
 * Use Claude with web search to find and summarize article content
 * based on the headline and source
 */
async function searchAndSummarizeArticle(
  headline: string,
  source: string
): Promise<string | null> {
  try {
    console.log(`[Verity] Searching for article: "${headline.slice(0, 50)}..." from ${source}`);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 2,
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Search for this news article and extract the key factual claims:

Headline: "${headline}"
Source: ${source}

Use web search to find this specific article or closely related coverage. Then provide a concise summary (3-5 sentences) of the main factual claims. Focus on:
- Specific events, dates, and locations
- Statistics and numbers
- Direct quotes from named sources
- Concrete claims that can be fact-checked

If you cannot find the article, say "Article not found" and nothing else.`,
        },
      ],
    });

    console.log(`[Verity] Response stop_reason: ${response.stop_reason}, content blocks: ${response.content.length}`);

    // Extract text content from response (may include tool use blocks)
    let excerpt = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        excerpt += block.text;
      } else {
        console.log(`[Verity] Response block type: ${block.type}`);
      }
    }

    excerpt = excerpt.trim();

    // Check if article was not found
    if (excerpt.toLowerCase().includes('article not found') || excerpt.length < 50) {
      console.log(`[Verity] Could not find article content for: ${headline.slice(0, 40)}...`);
      return null;
    }

    console.log(`[Verity] Found article content (${excerpt.length} chars)`);
    return excerpt.slice(0, MAX_EXCERPT_LENGTH);
  } catch (error) {
    console.error('[Verity] Web search failed:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('[Verity] Error details:', error.message);
    }
    return null;
  }
}

/**
 * Fetch article content using web search
 */
export async function fetchArticleContent(
  url: string,
  headline: string,
  source?: string
): Promise<{ excerpt: string; resolvedUrl: string } | null> {
  try {
    const excerpt = await searchAndSummarizeArticle(headline, source || 'unknown');

    if (!excerpt) {
      return null;
    }

    return {
      excerpt,
      resolvedUrl: url, // Keep original URL for reference
    };
  } catch (error) {
    console.error('[Verity] Article fetch failed:', error);
    return null;
  }
}

/**
 * Fetch article content for multiple headlines in parallel
 */
export async function fetchArticlesForHeadlines(
  headlines: Array<{ title: string; url: string; source?: string }>
): Promise<Map<string, { excerpt: string; resolvedUrl: string }>> {
  const results = new Map<string, { excerpt: string; resolvedUrl: string }>();

  // Process in parallel but with concurrency limit
  const CONCURRENCY = 3;
  const chunks: Array<Array<{ title: string; url: string; source?: string }>> = [];

  for (let i = 0; i < headlines.length; i += CONCURRENCY) {
    chunks.push(headlines.slice(i, i + CONCURRENCY));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async ({ title, url, source }) => {
      const result = await fetchArticleContent(url, title, source);
      if (result) {
        results.set(title, result);
      }
    });

    await Promise.all(promises);

    // Small delay between batches to avoid rate limiting
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
