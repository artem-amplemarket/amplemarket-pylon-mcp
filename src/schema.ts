import { z } from 'zod';

export const SearchParamsSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  limit: z.number().int().min(1).max(100).optional()
});

export const GetArticleParamsSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional()
}).refine(
  (data) => data.id || data.slug,
  {
    message: "Either 'id' or 'slug' must be provided",
    path: ["id"]
  }
);

export const GetCollectionParamsSchema = z.object({
  id: z.string().min(1, "Collection ID cannot be empty")
});

export const GetKnowledgeBaseArticlesParamsSchema = z.object({
  knowledgeBaseId: z.string().min(1, "Knowledge base ID cannot be empty")
});

export const ArticleSearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  collectionId: z.string(),
  url: z.string(),
  updatedAt: z.string()
});

export const ArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  collectionId: z.string(),
  html: z.string(),
  text: z.string(),
  updatedAt: z.string(),
  url: z.string()
});

export const CollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  articles: z.array(ArticleSearchResultSchema).optional()
});

export const KnowledgeBaseArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  identifier: z.string(),
  is_published: z.boolean(),
  current_published_content_html: z.string(),
  last_published_at: z.string()
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;
export type GetArticleParams = z.infer<typeof GetArticleParamsSchema>;
export type GetCollectionParams = z.infer<typeof GetCollectionParamsSchema>;
export type GetKnowledgeBaseArticlesParams = z.infer<typeof GetKnowledgeBaseArticlesParamsSchema>;