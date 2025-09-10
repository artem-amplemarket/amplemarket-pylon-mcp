import { request } from 'undici';
import { convert } from 'html-to-text';

export interface Article {
  id: string;
  title: string;
  slug: string;
  collectionId: string;
  html: string;
  text: string;
  updatedAt: string;
  url: string;
}

export interface ArticleSearchResult {
  id: string;
  title: string;
  slug: string;
  collectionId: string;
  url: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  articles?: ArticleSearchResult[];
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  slug: string;
  identifier: string;
  is_published: boolean;
  current_published_content_html: string;
  last_published_at: string;
}

export interface SearchParams {
  query: string;
  limit?: number;
  collectionId?: string;
}

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class PylonAPI {
  private baseURL = 'https://api.usepylon.com/';
  private apiToken: string;
  private cache = new Map<string, CacheEntry<any>>();
  private cacheTTL = 60 * 1000; // 60 seconds
  // Hardcoded Amplemarket knowledge base ID
  private readonly AMPLEMARKET_KB_ID = 'be7fc09d-d151-4ccf-bec6-b8237af8041b';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private getCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheTTL
    });
  }

  private async makeRequest(endpoint: string, params?: Record<string, any>): Promise<any> {
    // Handle endpoints that already contain query parameters
    const url = endpoint.includes('?') ? 
      new URL(endpoint, this.baseURL) : 
      new URL(endpoint, this.baseURL);
    
    if (params && !endpoint.includes('?')) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await request(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.statusCode >= 400) {
      throw new Error(`Pylon API error: ${response.statusCode}`);
    }

    return response.body.json();
  }

  async searchArticles(params: SearchParams): Promise<ArticleSearchResult[]> {
    const cacheKey = this.getCacheKey('search', params);
    const cached = this.getFromCache<ArticleSearchResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Always search within the Amplemarket knowledge base
    const articles = await this.getKnowledgeBaseArticles(this.AMPLEMARKET_KB_ID);

    // Filter articles based on search query
    const query = params.query.toLowerCase();
    const filteredArticles = articles.filter(article => {
      const title = (article.title || '').toLowerCase();
      const content = (article.current_published_content_html || '').toLowerCase();
      return title.includes(query) || content.includes(query);
    });

    // Convert to ArticleSearchResult format and limit results
    const results: ArticleSearchResult[] = filteredArticles
      .slice(0, params.limit || 10)
      .map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        collectionId: this.AMPLEMARKET_KB_ID,
        url: `https://knowledge.amplemarket.com/articles/${article.identifier}-${article.slug}`,
        updatedAt: article.last_published_at
      }));

    this.setCache(cacheKey, results);
    return results;
  }

  async getArticleById(id: string): Promise<Article> {
    const cacheKey = this.getCacheKey('article', { id });
    const cached = this.getFromCache<Article>(cacheKey);
    if (cached) {
      return cached;
    }

    // Find the article in our knowledge base articles
    const allArticles = await this.getAmplemarketArticles();
    const kbArticle = allArticles.find(article => article.id === id);
    
    if (!kbArticle) {
      throw new Error(`Article with ID "${id}" not found in Amplemarket knowledge base`);
    }

    // Use the knowledge base article data
    const result: Article = {
      id: kbArticle.id,
      title: kbArticle.title,
      slug: kbArticle.slug,
      collectionId: this.AMPLEMARKET_KB_ID,
      html: kbArticle.current_published_content_html || '',
      text: convert(kbArticle.current_published_content_html || '', {
        wordwrap: 130,
        selectors: [
          { selector: 'pre', format: 'block' },
          { selector: 'code', format: 'inline' }
        ]
      }),
      updatedAt: kbArticle.last_published_at,
      url: `https://knowledge.amplemarket.com/articles/${kbArticle.identifier}-${kbArticle.slug}`
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getArticleBySlug(slug: string): Promise<Article> {
    // Get all articles and find the one with the matching slug
    const allArticles = await this.getAmplemarketArticles();
    const match = allArticles.find(article => article.slug === slug);
    
    if (!match) {
      throw new Error(`Article with slug "${slug}" not found in Amplemarket knowledge base`);
    }

    return this.getArticleById(match.id);
  }

  async getCollection(id: string): Promise<Collection> {
    const cacheKey = this.getCacheKey('collection', { id });
    const cached = this.getFromCache<Collection>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await this.makeRequest(`collections/${id}`);
    const collection = response.collection;

    const articles = await this.searchArticles({ 
      query: '', 
      collectionId: id,
      limit: 100 
    });

    const result: Collection = {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      articles
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getKnowledgeBaseArticles(knowledgeBaseId: string): Promise<KnowledgeBaseArticle[]> {
    const cacheKey = this.getCacheKey('kb_articles', { knowledgeBaseId });
    const cached = this.getFromCache<KnowledgeBaseArticle[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use infinite pagination to get ALL articles, regardless of count
    const allArticles: KnowledgeBaseArticle[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;
    
    while (hasNextPage) {
      const endpoint = cursor 
        ? `knowledge-bases/${knowledgeBaseId}/articles?limit=999&cursor=${encodeURIComponent(cursor)}`
        : `knowledge-bases/${knowledgeBaseId}/articles?limit=999`;
      
      const response = await this.makeRequest(endpoint);
      
      const articles: KnowledgeBaseArticle[] = response.data?.map((article: any) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        identifier: article.identifier,
        is_published: article.is_published,
        current_published_content_html: article.current_published_content_html,
        last_published_at: article.last_published_at
      })) || [];

      allArticles.push(...articles);
      
      // Check if there are more pages
      if (response.pagination && response.pagination.has_next_page && response.pagination.cursor) {
        cursor = response.pagination.cursor;
        hasNextPage = true;
      } else {
        hasNextPage = false;
      }
      
      // Safety break to prevent infinite loops (should never happen)
      if (allArticles.length > 10000) {
        break;
      }
    }

    // Silent pagination - completed without console output
    this.setCache(cacheKey, allArticles);
    return allArticles;
  }

  // Convenience method to get all Amplemarket articles
  async getAmplemarketArticles(): Promise<KnowledgeBaseArticle[]> {
    return this.getKnowledgeBaseArticles(this.AMPLEMARKET_KB_ID);
  }
}

export function createPylonClient(): PylonAPI {
  const apiToken = process.env.PYLON_API_TOKEN;
  if (!apiToken) {
    throw new Error('PYLON_API_TOKEN environment variable is required');
  }
  return new PylonAPI(apiToken);
}