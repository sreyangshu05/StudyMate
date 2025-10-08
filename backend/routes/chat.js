import express from 'express';
import { LLMService } from '../services/llmService.js';
import { EmbeddingService } from '../services/embeddingService.js';
import { getDatabase } from '../services/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();
let db;
router.use((req, res, next) => {
  if (!db) {
    db = getDatabase();
  }
  next();
});
const llmService = new LLMService();
const embeddingService = new EmbeddingService();

// Create new chat
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.userId;

    const result = await db.run(
      'INSERT INTO chats (user_id, title) VALUES (?, ?)',
      [userId, title || `Chat ${new Date().toLocaleDateString()}`]
    );

    res.json({
      chatId: result.lastID,
      title: title || `Chat ${new Date().toLocaleDateString()}`
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get user's chats
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const chats = await db.all(
      'SELECT id, title, created_at FROM chats WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get chat messages
router.get('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify chat ownership
    const chat = await db.get(
      'SELECT id FROM chats WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messages = await db.all(
      'SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC',
      [id]
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, docIds } = req.body;
    const userId = req.user.userId;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Verify chat ownership
    const chat = await db.get(
      'SELECT id FROM chats WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Save user message
    await db.run(
      'INSERT INTO chat_messages (chat_id, role, content) VALUES (?, ?, ?)',
      [id, 'user', message]
    );

    // Get context from documents if docIds provided
    let context = '';
    if (docIds && docIds.length > 0) {
      const passages = await embeddingService.searchSimilarPassages(message, docIds, 3);
      context = passages.map(p => `[${p.docTitle}, p.${p.pageNo}]: "${p.snippet}"`).join('\n\n');
    }

    // Generate AI response
    const aiResponse = await llmService.generateChatResponse(message, context);

    // Save AI message
    await db.run(
      'INSERT INTO chat_messages (chat_id, role, content) VALUES (?, ?, ?)',
      [id, 'assistant', aiResponse]
    );

    res.json({
      message: aiResponse,
      context: context ? 'Used document context' : 'General response'
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete chat
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify chat ownership
    const chat = await db.get(
      'SELECT id FROM chats WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Delete messages first
    await db.run('DELETE FROM chat_messages WHERE chat_id = ?', [id]);

    // Delete chat
    await db.run('DELETE FROM chats WHERE id = ?', [id]);

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

export default router;
