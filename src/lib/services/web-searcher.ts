/**
 * Web Search Service for Verity
 * Uses Google Custom Search API for finding corroborating sources
 */

import { fetchWithTimeout } from '@/lib/utils/api-helpers';

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  snippet?: string;
  displayUrl?: string;
}

export interface WebSearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

const GOOGLE_SEARCH_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';

/**
 * Search the web using Google Custom Search API
 */
export async function searchWeb(
  query: string,
  count: number = 10
): Promise<WebSearchResponse> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_CX;

  if (!apiKey || !searchEngineId) {
    throw new Error('Google Search API is not configured. Please add GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_CX to your environment variables.');
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query,
      num: Math.min(count, 10).toString(), // Google limits to 10 per request
    });

    const response = await fetchWithTimeout(
      `${GOOGLE_SEARCH_ENDPOINT}?${params}`,
      { method: 'GET' },
      10000
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Search API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    const results: SearchResult[] = (data.items || []).map((item: any) => ({
      title: item.title || '',
      url: item.link || '',
      description: item.snippet || '',
      snippet: item.snippet || '',
      displayUrl: item.displayLink || '',
    }));

    return {
      query,
      results,
      total: parseInt(data.searchInformation?.totalResults || '0', 10),
    };
  } catch (error) {
    console.error('[Verity] Google Search failed:', error);
    throw error;
  }
}

/**
 * Search specifically for news articles
 */
export async function searchNews(
  query: string,
  count: number = 5
): Promise<WebSearchResponse> {
  // Add news-specific terms to query
  const newsQuery = `${query} site:reuters.com OR site:apnews.com OR site:bbc.com OR site:nytimes.com`;
  return searchWeb(newsQuery, count);
}

/**
 * Search for academic/scientific sources
 */
export async function searchAcademic(
  query: string,
  count: number = 5
): Promise<WebSearchResponse> {
  const academicQuery = `${query} site:edu OR site:nih.gov OR site:nature.com OR site:science.org`;
  return searchWeb(academicQuery, count);
}

/**
 * Search for government sources
 */
export async function searchGovernment(
  query: string,
  count: number = 5
): Promise<WebSearchResponse> {
  const govQuery = `${query} site:gov`;
  return searchWeb(govQuery, count);
}

