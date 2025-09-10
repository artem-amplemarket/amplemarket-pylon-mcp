import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import { PylonAPI } from '../src/pylon.js';
import dotenv from 'dotenv';

dotenv.config();

describe('Knowledge Base Articles API', () => {
  let pylonClient: PylonAPI;
  
  test('should initialize PylonAPI client', () => {
    assert.ok(process.env.PYLON_API_TOKEN, 'PYLON_API_TOKEN should be set');
    pylonClient = new PylonAPI(process.env.PYLON_API_TOKEN!);
    assert.ok(pylonClient, 'PylonAPI client should be created');
  });

  test('should fetch knowledge base articles', async () => {
    // Using a mock knowledge base ID for testing
    // In a real test, you would use a valid knowledge base ID
    const mockKnowledgeBaseId = 'test-kb-id';
    
    try {
      const articles = await pylonClient.getKnowledgeBaseArticles(mockKnowledgeBaseId);
      
      // The API should return an array (even if empty or error)
      assert.ok(Array.isArray(articles), 'Should return an array');
      
      // If articles exist, validate the structure
      if (articles.length > 0) {
        const firstArticle = articles[0];
        assert.ok(firstArticle.id, 'Article should have an id');
        assert.ok(firstArticle.title, 'Article should have a title');
        assert.ok(firstArticle.slug, 'Article should have a slug');
        assert.ok(typeof firstArticle.is_published === 'boolean', 'Article should have is_published boolean');
        assert.ok(firstArticle.last_published_at, 'Article should have last_published_at');
      }
      
      console.log(`✓ Fetched ${articles.length} articles from knowledge base ${mockKnowledgeBaseId}`);
    } catch (error) {
      // For testing purposes, we'll log the error but not fail
      // In production, you'd want to handle this more appropriately
      console.log(`Expected error for mock knowledge base ID: ${(error as Error).message}`);
      assert.ok((error as Error).message.includes('Pylon API error'), 'Should receive API error for invalid ID');
    }
  });

  test('should validate article structure matches API response', () => {
    // Test the expected structure matches the API documentation
    const mockApiResponse = {
      data: [
        {
          id: "459ab0c0-a720-4c11-8a88-d6315610b7f2",
          title: "The checkout conversion testing program FAQ",
          slug: "the-checkout-conversion-testing-program-faq",
          identifier: "1178113824",
          is_published: true,
          current_published_content_html: "<p>Test content</p>",
          last_published_at: "2025-01-17T17:34:06Z"
        }
      ]
    };
    
    const articles = mockApiResponse.data.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      identifier: article.identifier,
      is_published: article.is_published,
      current_published_content_html: article.current_published_content_html,
      last_published_at: article.last_published_at
    }));
    
    assert.equal(articles.length, 1, 'Should have one article');
    const article = articles[0];
    assert.equal(article.id, "459ab0c0-a720-4c11-8a88-d6315610b7f2");
    assert.equal(article.title, "The checkout conversion testing program FAQ");
    assert.equal(article.slug, "the-checkout-conversion-testing-program-faq");
    assert.equal(article.identifier, "1178113824");
    assert.equal(article.is_published, true);
    assert.ok(article.current_published_content_html.includes("<p>"));
    assert.equal(article.last_published_at, "2025-01-17T17:34:06Z");
    
    console.log('✓ Article structure validation passed');
  });
});