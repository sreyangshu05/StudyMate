import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './services/database.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import qaRoutes from './routes/qa.js';
import quizRoutes from './routes/quiz.js';
import statsRoutes from './routes/stats.js';
import chatRoutes from './routes/chat.js';
import youtubeRoutes from './routes/youtube.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/youtube', youtubeRoutes);

// Health check
app.get('/', (req, res) => res.json({ 
  message: 'StudyMate Backend API', 
  status: 'running',
  version: '1.0.0'
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 StudyMate Backend running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
