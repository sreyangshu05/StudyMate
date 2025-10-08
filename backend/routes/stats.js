import express from 'express';
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

// Get user statistics
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get basic stats
    const quizCount = await db.get(
      'SELECT COUNT(*) as count FROM quizzes WHERE user_id = ?',
      [userId]
    );

    const attemptCount = await db.get(
      'SELECT COUNT(*) as count FROM attempts WHERE user_id = ?',
      [userId]
    );

    const avgScore = await db.get(
      'SELECT AVG(score) as average FROM attempts WHERE user_id = ?',
      [userId]
    );

    // Get recent attempts
    const recentAttempts = await db.all(
      `SELECT a.*, q.name as quiz_name 
       FROM attempts a 
       JOIN quizzes q ON a.quiz_id = q.id 
       WHERE a.user_id = ? 
       ORDER BY a.finished_at DESC 
       LIMIT 10`,
      [userId]
    );

    // Get topic strengths/weaknesses (simplified)
    const topicStats = await db.all(
      `SELECT q.metadata, AVG(a.score) as avg_score, COUNT(a.id) as attempt_count
       FROM quizzes q
       LEFT JOIN attempts a ON q.id = a.quiz_id
       WHERE q.user_id = ?
       GROUP BY q.id
       ORDER BY avg_score DESC`,
      [userId]
    );

    const strengths = topicStats.filter(t => t.avg_score >= 80).slice(0, 5);
    const weaknesses = topicStats.filter(t => t.avg_score < 60).slice(0, 5);

    // Get progress over time (last 30 days)
    const progressData = await db.all(
      `SELECT DATE(finished_at) as date, AVG(score) as avg_score, COUNT(*) as attempts
       FROM attempts 
       WHERE user_id = ? AND finished_at >= datetime('now', '-30 days')
       GROUP BY DATE(finished_at)
       ORDER BY date`,
      [userId]
    );

    res.json({
      quizzesTaken: quizCount.count,
      totalAttempts: attemptCount.count,
      avgScore: Math.round(avgScore.average || 0),
      recentAttempts,
      topicStrengths: strengths.map(s => ({
        topic: s.metadata ? JSON.parse(s.metadata).distribution : 'General',
        avgScore: Math.round(s.avg_score || 0),
        attempts: s.attempt_count
      })),
      topicWeaknesses: weaknesses.map(w => ({
        topic: w.metadata ? JSON.parse(w.metadata).distribution : 'General',
        avgScore: Math.round(w.avg_score || 0),
        attempts: w.attempt_count
      })),
      progressHistory: progressData.map(p => ({
        date: p.date,
        avgScore: Math.round(p.avg_score || 0),
        attempts: p.attempts
      }))
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get recent activity
    const recentActivity = await db.all(
      `SELECT 'quiz' as type, q.name as title, q.created_at as date
       FROM quizzes q
       WHERE q.user_id = ?
       UNION ALL
       SELECT 'attempt' as type, q.name as title, a.finished_at as date
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       WHERE a.user_id = ?
       ORDER BY date DESC
       LIMIT 10`,
      [userId, userId]
    );

    // Get performance metrics
    const performance = await db.get(
      `SELECT 
         COUNT(DISTINCT q.id) as total_quizzes,
         COUNT(a.id) as total_attempts,
         AVG(a.score) as avg_score,
         MAX(a.score) as best_score,
         MIN(a.score) as worst_score
       FROM quizzes q
       LEFT JOIN attempts a ON q.id = a.quiz_id
       WHERE q.user_id = ?`,
      [userId]
    );

    res.json({
      recentActivity,
      performance: {
        totalQuizzes: performance.total_quizzes || 0,
        totalAttempts: performance.total_attempts || 0,
        avgScore: Math.round(performance.avg_score || 0),
        bestScore: performance.best_score || 0,
        worstScore: performance.worst_score || 0
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
