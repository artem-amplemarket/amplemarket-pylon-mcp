# Project: MCP Server for Pylon Knowledge Base

## Goal
Build a **local** Model Context Protocol (MCP) server (`mcp-pylon-kb`) that exposes our **Pylon** knowledge base (usepylon.com) to LLM clients (Claude Desktop, Cursor, etc.) via Pylon’s REST API using a secure API token.

The KB is behind login; the MCP server will query the API directly using `PYLON_API_TOKEN` (provided via environment).

## Environment & Security
- Node.js 20+, TypeScript
- Never hardcode the token; read from `process.env.PYLON_API_TOKEN`
- Support `.env` (dev only) via `dotenv`
- `.env.example` with `PYLON_API_TOKEN=`
- No logging of secrets or sensitive query strings

## Dependencies
- `@modelcontextprotocol/sdk`
- `undici` (HTTP client)
- `dotenv` (dev)
- `zod` (validation)
- `html-to-text` (strip HTML for plain text output)

## API Client (`pylon.ts`)
- Base URL: `https://api.usepylon.com/`
- Auth: `Authorization: Bearer <PYLON_API_TOKEN>`
- Methods:
  - `searchArticles({ query, limit?, collectionId? })`
  - `getArticleById(id)`
  - `getArticleBySlug(slug)` (or search + get by id if no direct slug endpoint)
  - `getCollection(id)`
- Return both `html` and `text` for articles
- Minimal in-memory cache (TTL ~60s)

## Tools to Register
1. `kb.search`
   - Params: `{ query: string, limit?: number, collectionId?: string }`
   - Returns: Array of `{ id, title, slug, collectionId, url, updatedAt }`
2. `kb.getArticle`
   - Params: `{ id?: string, slug?: string }`
   - Returns: `{ id, title, slug, collectionId, html, text, updatedAt, url }`
3. `kb.getCollection`
   - Params: `{ id: string }`
   - Returns: Collection metadata + article list

## Resources
- Scheme: `pylon-article://<id-or-slug>`
- Returns plain text version of article

## Project Structure
mcp-pylon-kb/
package.json
tsconfig.json
.env.example
src/
index.ts
pylon.ts
schema.ts
tools/
kbSearch.ts
kbGetArticle.ts
kbGetCollection.ts
tests/
htmlToText.test.ts
searchAdapter.test.ts
README.md

## index.ts Requirements
- Create MCP `Server`
- Register tools + resource handler
- Use stdio transport
- On start, log `"mcp-pylon-kb ready"` (no secrets)

## Sample `mcp.json` for Claude Desktop
```json
{
  "mcpServers": {
    "pylon-kb": {
      "command": "node",
      "args": ["./dist/src/index.js"],
      "env": { "PYLON_API_TOKEN": "${PYLON_API_TOKEN}" }
    }
  }
}
