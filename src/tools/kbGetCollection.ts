import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GetCollectionParamsSchema } from '../schema.js';
import { PylonAPI } from '../pylon.js';

export const kbGetCollectionTool: Tool = {
  name: 'kb_get_collection',
  description: 'Get collection metadata and articles from the Pylon knowledge base',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Collection ID'
      }
    },
    required: ['id']
  }
};

export async function handleKbGetCollection(pylonClient: PylonAPI, args: unknown) {
  const params = GetCollectionParamsSchema.parse(args);
  
  try {
    const collection = await pylonClient.getCollection(params.id);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(collection, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting collection: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}