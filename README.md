# MCP Amplemarket Knowledge Base Server

A Model Context Protocol (MCP) server that provides seamless access to the Amplemarket Knowledge Base via Pylon's API. Designed specifically for Claude Desktop and other MCP-compatible clients.

<a href="https://glama.ai/mcp/servers/@artem-amplemarket/amplemarket-pylon-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@artem-amplemarket/amplemarket-pylon-mcp/badge" alt="Amplemarket Knowledge Base Server MCP server" />
</a>

## Features

- **🔍 Smart Search**: Search through Amplemarket articles by title and content
- **📄 Article Access**: Retrieve full article content by ID or slug  
- **📚 Complete Catalog**: Get all available Amplemarket articles at once
- **🌐 Resource Support**: Access articles via URI scheme
- **⚡ Fast Caching**: Built-in 60-second cache to reduce API calls
- **🔒 Secure**: Environment-based API token configuration
- **🎯 Focused**: Hardcoded for Amplemarket knowledge base - no configuration needed

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure your API key**:
   ```bash
   cp .env.example .env
   ```
   
   Then edit the `.env` file and add your Pylon API token:
   ```bash
   PYLON_API_TOKEN=your_actual_api_token_here
   ```
   
   > **Important**: Replace `your_actual_api_token_here` with your real Pylon API token. You can get this token from your Pylon dashboard.

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Test the server**:
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

- `PYLON_API_TOKEN`: Your Pylon API token (required)

### Claude Desktop Integration

Add to your Claude Desktop `mcp.json` configuration:

```json
{
  "mcpServers": {
    "pylon-kb": {
      "command": "node",
      "args": ["./dist/src/index.js"],
      "cwd": "/path/to/mcp-pylon-kb",
      "env": { 
        "PYLON_API_TOKEN": "your_actual_api_token_here"
      }
    }
  }
}
```

> **Note**: Replace `/path/to/mcp-pylon-kb` with the actual path to this project directory, and `your_actual_api_token_here` with your real Pylon API token.

## Tools

### `kb.search`
Search for articles in the knowledge base.

**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Maximum results (1-100, default: 10)
- `collectionId` (string, optional): Limit search to specific collection

### `kb.getArticle`
Get a specific article by ID or slug.

**Parameters:**
- `id` (string, optional): Article ID
- `slug` (string, optional): Article slug

*Note: Either `id` or `slug` must be provided.*

### `kb.getCollection`
Get collection metadata and articles.

**Parameters:**
- `id` (string, required): Collection ID

## Resources

The server supports the `pylon-article://` URI scheme:

- `pylon-article://<article-id>` - Get article by ID
- `pylon-article://<article-slug>` - Get article by slug
- `pylon-article://help` - Get resource usage help

## API Client

The Pylon API client (`src/pylon.ts`) handles:

- Authentication with Bearer token
- HTTP requests via undici
- HTML to text conversion
- In-memory caching with TTL
- Error handling

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode (build + run)
npm run dev

# Run tests
npm test
```

## Project Structure

```
mcp-pylon-kb/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── pylon.ts          # Pylon API client
│   ├── schema.ts         # Zod validation schemas
│   └── tools/            # MCP tool implementations
│       ├── kbSearch.ts
│       ├── kbGetArticle.ts
│       └── kbGetCollection.ts
└── tests/
    ├── htmlToText.test.ts
    └── searchAdapter.test.ts
```

## Security

- API tokens are never logged or exposed in responses
- All sensitive data is read from environment variables
- Input validation with Zod schemas
- Error messages don't leak sensitive information

## License

MIT