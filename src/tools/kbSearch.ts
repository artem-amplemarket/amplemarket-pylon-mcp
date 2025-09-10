import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SearchParamsSchema } from '../schema.js';
import { PylonAPI } from '../pylon.js';

export const kbSearchTool: Tool = {
  name: 'amplemarket_search',
  description: 'Search articles in the Amplemarket knowledge base. Searches through article titles and content for relevant information about Amplemarket features, troubleshooting, and best practices.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to find relevant Amplemarket articles (searches in both titles and content)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (1-100, default: 10)',
        minimum: 1,
        maximum: 100
      }
    },
    required: ['query']
  }
};

export async function handleKbSearch(pylonClient: PylonAPI, args: unknown) {
  const params = SearchParamsSchema.parse(args);
  
  try {
    const results = await pylonClient.searchArticles(params);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query: params.query,
            totalResults: results.length,
            articles: results
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error searching articles: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}