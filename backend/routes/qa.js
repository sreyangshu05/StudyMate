import express from 'express';
import { EmbeddingService } from '../services/embeddingService.js';
import { LLMService } from '../services/llmService.js';
import { authenticateToken } from './auth.js';

const router = express.Router();
const embeddingService = new EmbeddingService();
const llmService = new LLMService();

// RAG QA endpoint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { query, docIds, topK = 4 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Search for similar passages
    const passages = await embeddingService.searchSimilarPassages(query, docIds, topK);

    if (passages.length === 0) {
      return res.json({
        answer: "I couldn't find relevant information in the provided documents. Please try rephrasing your question or check if the documents have been properly processed.",
        citations: []
      });
    }

    // Generate answer using LLM
    const answer = await llmService.generateRAGAnswer(query, passages);

    // Format citations
    const citations = passages.map(p => ({
      docId: p.docId,
      docTitle: p.docTitle,
      page: p.pageNo,
      snippet: p.snippet,
      score: p.similarity
    }));

    res.json({
      answer,
      citations
    });
  } catch (error) {
    console.error('QA error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

// Search passages
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { query, docIds, topK = 4 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const passages = await embeddingService.searchSimilarPassages(query, docIds, topK);

    res.json({ passages });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search passages' });
  }
});

export default router;
