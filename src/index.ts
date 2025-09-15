#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';
import { createPylonClient } from './pylon.js';
import { kbGetArticleTool, handleKbGetArticle } from './tools/kbGetArticle.js';
import { kbGetCollectionTool, handleKbGetCollection } from './tools/kbGetCollection.js';
import { kbGetArticlesTool, handleKbGetArticles } from './tools/kbGetArticles.js';

const server = new Server(
  {
    name: 'mcp-amplemarket-kb',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

let pylonClient: ReturnType<typeof createPylonClient>;

try {
  pylonClient = createPylonClient();
} catch (error) {
  console.error('Failed to initialize Pylon client:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [kbGetArticleTool, kbGetCollectionTool, kbGetArticlesTool],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'amplemarket_get_article':
      return await handleKbGetArticle(pylonClient, request.params.arguments);
    case 'kb_get_collection':
      return await handleKbGetCollection(pylonClient, request.params.arguments);
    case 'amplemarket_get_all_articles':
      return await handleKbGetArticles(pylonClient, request.params.arguments);
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'pylon-article://help',
        name: 'Pylon KB Resource Help',
        description: 'Information about available Pylon KB resources',
        mimeType: 'text/plain',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  
  if (url.protocol !== 'pylon-article:') {
    throw new Error(`Unsupported protocol: ${url.protocol}`);
  }

  const identifier = url.hostname;
  
  if (identifier === 'help') {
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'text/plain',
          text: `Pylon KB MCP Server Resources

Use the pylon-article:// scheme to access articles:
- pylon-article://<article-id> - Get article by ID
- pylon-article://<article-slug> - Get article by slug

Examples:
- pylon-article://123e4567-e89b-12d3-a456-426614174000
- pylon-article://getting-started-guide

The resource will return the plain text content of the article.
Use the kb.search tool to find article IDs and slugs.`,
        },
      ],
    };
  }

  try {
    let article;
    if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      article = await pylonClient.getArticleById(identifier);
    } else {
      article = await pylonClient.getArticleBySlug(identifier);
    }

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'text/plain',
          text: article.text,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to fetch article "${identifier}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('mcp-amplemarket-kb ready');
}

runServer().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});