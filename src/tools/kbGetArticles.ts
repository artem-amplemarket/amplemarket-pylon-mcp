import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { PylonAPI } from '../pylon.js';

export const kbGetArticlesTool: Tool = {
  name: 'amplemarket_get_all_articles',
  description: 'Get all articles from the Amplemarket knowledge base, separated by publish status. Returns metadata for published and unpublished articles (titles, IDs, slugs, publish status). Use amplemarket_get_article to get full content of specific articles.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false
  }
};

export async function handleKbGetArticles(pylonClient: PylonAPI, args: unknown) {
  try {
    const articles = await pylonClient.getAmplemarketArticles();
    
    // Separate published and unpublished articles
    const publishedArticles = articles.filter(article => article.is_published);
    const unpublishedArticles = articles.filter(article => !article.is_published);
    
    // Return only essential metadata to avoid response size limits
    const mapArticle = (article: any) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      identifier: article.identifier,
      is_published: article.is_published,
      last_published_at: article.last_published_at,
      // Exclude the large current_published_content_html field
    });
    
    const publishedData = publishedArticles.map(mapArticle);
    const unpublishedData = unpublishedArticles.map(mapArticle);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            summary: {
              total: articles.length,
              published_count: publishedArticles.length,
              unpublished_count: unpublishedArticles.length,
              knowledge_base: 'Amplemarket Knowledge Base'
            },
            published_articles: publishedData,
            unpublished_articles: unpublishedData,
            note: 'Full article content not included - use amplemarket_get_article for specific article content'
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting Amplemarket articles: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}