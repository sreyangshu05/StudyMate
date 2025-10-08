import OpenAI from 'openai';
import { getDatabase } from './database.js';

export class EmbeddingService {
  constructor() {
    this.openrouter = null; // lazy init
    this.db = null; // lazy init
  }

  ensureClient() {
    if (!this.openrouter) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is missing. Add it to your environment to enable embeddings.');
      }
      this.openrouter = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost',
          'X-Title': 'StudyMate-AI'
        }
      });
    }
  }

  getDb() {
    if (!this.db) {
      this.db = getDatabase();
    }
    return this.db;
  }

  async generateEmbedding(text) {
    try {
      this.ensureClient();
      const candidateModels = [
        process.env.OPENROUTER_EMBED_MODEL,
        'openai/text-embedding-3-small',
        'openai/text-embedding-3-large',
        'voyage/voyage-3-lite-embedding'
      ].filter(Boolean);

      let lastError;
      for (const model of candidateModels) {
        try {
          const response = await this.openrouter.embeddings.create({ model, input: text });
          const embedding = response?.data?.[0]?.embedding;
          if (embedding && Array.isArray(embedding)) {
            return embedding;
          }
        } catch (err) {
          lastError = err;
        }
      }
      if (lastError) {
        console.error('Embedding API error:', lastError?.response?.data || lastError?.message || lastError);
      }
      throw new Error('Embedding API returned no data');
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  async storeEmbeddings(chunks) {
    try {
      const db = this.getDb();
      const stmt = await db.prepare(`
        INSERT INTO passages (doc_id, page_no, text, embedding, chunk_id)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const chunk of chunks) {
        const embedding = await this.generateEmbedding(chunk.text);
        const embeddingBlob = Buffer.from(JSON.stringify(embedding));
        
        await stmt.run(
          chunk.doc_id,
          chunk.page_no,
          chunk.text,
          embeddingBlob,
          chunk.chunk_id
        );
      }

      await stmt.finalize();
      console.log(`Stored ${chunks.length} embeddings`);
    } catch (error) {
      console.error('Error storing embeddings:', error);
      throw new Error('Failed to store embeddings');
    }
  }

  async searchSimilarPassages(query, docIds = null, topK = 4) {
    try {
      const db = this.getDb();
      const queryEmbedding = await this.generateEmbedding(query);
      
      let sql = `
        SELECT p.*, d.title as doc_title, d.filename
        FROM passages p
        JOIN documents d ON p.doc_id = d.id
      `;
      
      const params = [];
      if (docIds && docIds.length > 0) {
        sql += ` WHERE p.doc_id IN (${docIds.map(() => '?').join(',')})`;
        params.push(...docIds);
      }

      const passages = await db.all(sql, params);
      
      // Calculate cosine similarity
      const similarities = passages.map(passage => {
        const storedEmbedding = JSON.parse(passage.embedding.toString());
        const similarity = this.cosineSimilarity(queryEmbedding, storedEmbedding);
        return {
          ...passage,
          similarity
        };
      });

      // Sort by similarity and return top K
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(p => ({
          id: p.id,
          docId: p.doc_id,
          docTitle: p.doc_title,
          pageNo: p.page_no,
          text: p.text,
          snippet: p.text.substring(0, 200) + '...',
          similarity: p.similarity
        }));
    } catch (error) {
      console.error('Error searching similar passages:', error);
      throw new Error('Failed to search similar passages');
    }
  }

  cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
