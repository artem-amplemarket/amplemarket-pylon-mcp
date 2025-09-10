import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GetArticleParamsSchema } from '../schema.js';
import { PylonAPI } from '../pylon.js';

export const kbGetArticleTool: Tool = {
  name: 'amplemarket_get_article',
  description: 'Get a specific article from the Amplemarket knowledge base by ID or slug',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Article ID (provide either id or slug)'
      },
      slug: {
        type: 'string',
        description: 'Article slug (provide either id or slug)'
      }
    },
    additionalProperties: false
  }
};

export async function handleKbGetArticle(pylonClient: PylonAPI, args: unknown) {
  const params = GetArticleParamsSchema.parse(args);
  
  try {
    let article;
    
    if (params.id) {
      article = await pylonClient.getArticleById(params.id);
    } else if (params.slug) {
      article = await pylonClient.getArticleBySlug(params.slug);
    } else {
      throw new Error('Either id or slug must be provided');
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(article, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting article: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}