import express from 'express';
import multer from 'multer';
import { PDFService } from '../services/pdfService.js';
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
const pdfService = new PDFService();
const embeddingService = new EmbeddingService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Upload PDF
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title } = req.body;
    const userId = req.user.userId;

    // Save PDF file
    const { filename, filePath, originalName } = await pdfService.savePDF(req.file, userId);

    // Extract text and get page count
    const { text, pages } = await pdfService.extractTextFromPDF(filePath);

    // Save document record
    const result = await db.run(
      'INSERT INTO documents (user_id, title, filename, pages) VALUES (?, ?, ?, ?)',
      [userId, title || originalName, filename, pages]
    );

    const docId = result.lastID;

    res.json({
      docId,
      title: title || originalName,
      pages,
      filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

// Ingest PDF (process and create embeddings)
router.post('/ingest', authenticateToken, async (req, res) => {
  try {
    const { docId } = req.body;
    const userId = req.user.userId;

    if (!docId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    // Get document info
    const doc = await db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [docId, userId]);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if already processed
    const existingChunks = await db.get('SELECT COUNT(*) as count FROM passages WHERE doc_id = ?', [docId]);
    if (existingChunks.count > 0) {
      return res.json({ status: 'already_processed', chunks: existingChunks.count });
    }

    // Process PDF
    const filePath = `./uploads/${doc.filename}`;
    const chunks = await pdfService.processPDF(filePath, docId, doc.pages);

    // Generate and store embeddings
    await embeddingService.storeEmbeddings(chunks);

    res.json({
      status: 'ok',
      chunks: chunks.length,
      message: 'PDF processed and embeddings created successfully'
    });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

// Get user's documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const documents = await db.all(
      'SELECT id, title, filename, pages, uploaded_at FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC',
      [userId]
    );

    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get document by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const document = await db.get(
      'SELECT * FROM documents WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Delete document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get document info
    const doc = await db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [id, userId]);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete associated passages
    await db.run('DELETE FROM passages WHERE doc_id = ?', [id]);

    // Delete document
    await db.run('DELETE FROM documents WHERE id = ?', [id]);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
