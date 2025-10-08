import express from 'express';
import { EmbeddingService } from '../services/embeddingService.js';
import { LLMService } from '../services/llmService.js';
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
const embeddingService = new EmbeddingService();
const llmService = new LLMService();

// Generate quiz
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { docIds, numQuestions = 10, distribution = { mcq: 6, saq: 3, laq: 1 } } = req.body;
    const userId = req.user.userId;

    if (!docIds || docIds.length === 0) {
      return res.status(400).json({ error: 'Document IDs are required' });
    }

    // Get random passages from the documents
    const passages = await embeddingService.searchSimilarPassages(
      'physics concepts laws principles formulas',
      docIds,
      Math.min(20, numQuestions * 2)
    );

    if (passages.length === 0) {
      return res.status(400).json({ error: 'No passages found in the selected documents' });
    }

    // Generate questions using LLM
    const questions = await llmService.generateQuizQuestions(passages, numQuestions, distribution);

    // Create quiz record
    const quizResult = await db.run(
      'INSERT INTO quizzes (user_id, doc_id, name, metadata) VALUES (?, ?, ?, ?)',
      [userId, docIds[0], `Quiz ${new Date().toLocaleDateString()}`, JSON.stringify({ distribution, numQuestions })]
    );

    const quizId = quizResult.lastID;

    // Save questions
    const questionPromises = questions.map(async (q, index) => {
      await db.run(
        `INSERT INTO questions (quiz_id, type, prompt_text, choices, correct_answer, explanation, difficulty, source_doc, page_no)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quizId,
          q.type,
          q.stem,
          JSON.stringify(q.choices || []),
          q.choices ? q.choices[q.correct_index] : q.correct_answer,
          q.explanation,
          q.difficulty || 'medium',
          q.source_doc || 'Unknown',
          q.page_no || 1
        ]
      );
    });

    await Promise.all(questionPromises);

    // Get the created quiz with questions
    const quiz = await db.get('SELECT * FROM quizzes WHERE id = ?', [quizId]);
    const quizQuestions = await db.all('SELECT * FROM questions WHERE quiz_id = ?', [quizId]);

    res.json({
      quizId,
      quiz: {
        ...quiz,
        questions: quizQuestions.map(q => ({
          ...q,
          choices: JSON.parse(q.choices || '[]')
        }))
      }
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Get quiz by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const quiz = await db.get(
      'SELECT * FROM quizzes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = await db.all('SELECT * FROM questions WHERE quiz_id = ?', [id]);

    res.json({
      quiz: {
        ...quiz,
        questions: questions.map(q => ({
          ...q,
          choices: JSON.parse(q.choices || '[]')
        }))
      }
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Get user's quizzes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const quizzes = await db.all(
      'SELECT id, name, created_at, metadata FROM quizzes WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({ quizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Submit quiz attempt
router.post('/:id/attempt', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user.userId;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers are required' });
    }

    // Get quiz questions
    const questions = await db.all('SELECT * FROM questions WHERE quiz_id = ?', [id]);
    
    if (questions.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Calculate score
    let correctAnswers = 0;
    const results = questions.map((q, index) => {
      const userAnswer = answers[index];
      const correctAnswer = q.choices ? JSON.parse(q.choices)[q.correct_index] : q.correct_answer;
      const isCorrect = userAnswer === correctAnswer;
      
      if (isCorrect) correctAnswers++;
      
      return {
        questionId: q.id,
        userAnswer,
        correctAnswer,
        isCorrect,
        explanation: q.explanation
      };
    });

    const score = Math.round((correctAnswers / questions.length) * 100);

    // Save attempt
    const attemptResult = await db.run(
      'INSERT INTO attempts (user_id, quiz_id, score, answers, started_at) VALUES (?, ?, ?, ?, ?)',
      [userId, id, score, JSON.stringify(answers), new Date().toISOString()]
    );

    res.json({
      attemptId: attemptResult.lastID,
      score,
      totalQuestions: questions.length,
      correctAnswers,
      results
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({ error: 'Failed to submit quiz attempt' });
  }
});

// Get quiz attempts
router.get('/:id/attempts', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const attempts = await db.all(
      'SELECT * FROM attempts WHERE quiz_id = ? AND user_id = ? ORDER BY finished_at DESC',
      [id, userId]
    );

    res.json({ attempts });
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

export default router;
