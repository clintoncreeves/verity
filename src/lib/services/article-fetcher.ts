/**
 * Article Fetcher Service
 * Fetches and extracts article content from news URLs
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Maximum excerpt length (characters)
const MAX_EXCERPT_LENGTH = 1500;

// Request timeout
const FETCH_TIMEOUT = 10000; // 10 seconds

/**
 * Decode Google News article URL from the encoded RSS link
 * Google News URLs contain a base64-encoded payload with the actual article URL
 */
function decodeGoogleNewsUrl(googleUrl: string): string | null {
  try {
    // Extract the article ID from the URL
    const match = googleUrl.match(/\/articles\/([^?]+)/);
    if (!match) return null;

    const articleId = match[1];

    // The article ID is a base64-encoded protobuf message
    // The URL is typically embedded in the decoded data
    // Try to decode and extract URL
    const decoded = Buffer.from(articleId, 'base64').toString('utf-8');

    // Look for http(s):// pattern in decoded data
    const urlMatch = decoded.match(/https?:\/\/[^\s\x00-\x1f"<>]+/);
    if (urlMatch) {
      // Clean up the URL - remove any trailing control characters
      return urlMatch[0].replace(/[\x00-\x1f]/g, '').split('\x12')[0];
    }

    return null;
  } catch (error) {
    console.error('[Verity] Failed to decode Google News URL:', error);
    return null;
  }
}

/**
 * Resolve Google News redirect URL to the actual article URL
 * First tries to decode the URL directly, then falls back to following redirects
 */
async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  // First try to decode the URL directly (faster, no network request)
  const decodedUrl = decodeGoogleNewsUrl(googleUrl);
  if (decodedUrl) {
    console.log(`[Verity] Decoded Google News URL: ${decodedUrl.slice(0, 60)}...`);
    return decodedUrl;
  }

  // Fallback: try following redirects
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(googleUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);

    // Check if we got redirected to a different domain
    if (response.url && !response.url.includes('news.google.com')) {
      return response.url;
    }

    // If still on Google News, try to extract URL from page content
    const html = await response.text();
    const urlFromPage = html.match(/data-n-au="([^"]+)"/)?.[1] ||
                        html.match(/"url":"([^"]+)"/)?.[1];
    if (urlFromPage) {
      return urlFromPage;
    }

    return googleUrl;
  } catch (error) {
    console.error('[Verity] Failed to resolve Google News URL:', error);
    return googleUrl;
  }
}

/**
 * Fetch HTML content from a URL
 */
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Verity] Failed to fetch article: ${response.status} ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      console.error(`[Verity] Unexpected content type: ${contentType}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Verity] Article fetch timeout');
    } else {
      console.error('[Verity] Failed to fetch article:', error);
    }
    return null;
  }
}

/**
 * Extract text content from HTML using simple regex-based extraction
 * Focuses on paragraph content and removes scripts/styles
 */
function extractTextFromHtml(html: string): string {
  // Remove scripts, styles, and comments
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

  // Extract paragraphs
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(text)) !== null) {
    const pText = match[1]
      .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    // Only include substantial paragraphs (likely article content)
    if (pText.length > 50) {
      paragraphs.push(pText);
    }
  }

  return paragraphs.join('\n\n');
}

/**
 * Use Claude to extract and summarize the key claims from article text
 */
async function summarizeArticle(
  articleText: string,
  headline: string
): Promise<string> {
  // Truncate article text to avoid excessive token usage
  const truncatedText = articleText.slice(0, 8000);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Extract the key factual claims from this news article. Focus on concrete facts, statistics, quotes, and specific claims that can be verified.

Headline: ${headline}

Article content:
${truncatedText}

Provide a concise summary (3-5 sentences) of the main factual claims in the article. Focus on:
- Specific events, dates, and locations
- Statistics and numbers
- Direct quotes from sources
- Concrete claims that can be fact-checked

Summary:`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }
    return '';
  } catch (error) {
    console.error('[Verity] Failed to summarize article:', error);
    return '';
  }
}

/**
 * Fetch article content and extract key claims
 */
export async function fetchArticleContent(
  url: string,
  headline: string
): Promise<{ excerpt: string; resolvedUrl: string } | null> {
  try {
    // Resolve Google News redirect
    const resolvedUrl = url.includes('news.google.com')
      ? await resolveGoogleNewsUrl(url)
      : url;

    console.log(`[Verity] Fetching article: ${resolvedUrl.slice(0, 60)}...`);

    // Fetch HTML
    const html = await fetchHtml(resolvedUrl);
    if (!html) {
      return null;
    }

    // Extract text content
    const textContent = extractTextFromHtml(html);
    if (textContent.length < 200) {
      console.log('[Verity] Insufficient article content extracted');
      return null;
    }

    // Use Claude to summarize key claims
    const excerpt = await summarizeArticle(textContent, headline);
    if (!excerpt) {
      // Fallback: use first portion of extracted text
      const fallbackExcerpt = textContent.slice(0, MAX_EXCERPT_LENGTH);
      return { excerpt: fallbackExcerpt, resolvedUrl };
    }

    return {
      excerpt: excerpt.slice(0, MAX_EXCERPT_LENGTH),
      resolvedUrl,
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
  headlines: Array<{ title: string; url: string }>
): Promise<Map<string, { excerpt: string; resolvedUrl: string }>> {
  const results = new Map<string, { excerpt: string; resolvedUrl: string }>();

  // Process in parallel but with concurrency limit
  const CONCURRENCY = 3;
  const chunks: Array<Array<{ title: string; url: string }>> = [];

  for (let i = 0; i < headlines.length; i += CONCURRENCY) {
    chunks.push(headlines.slice(i, i + CONCURRENCY));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async ({ title, url }) => {
      const result = await fetchArticleContent(url, title);
      if (result) {
        results.set(title, result);
      }
    });

    await Promise.all(promises);

    // Small delay between batches
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}
