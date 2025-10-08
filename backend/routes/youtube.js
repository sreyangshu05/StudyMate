import express from 'express';
import axios from 'axios';
import { authenticateToken } from './auth.js';

const router = express.Router();

// YouTube Data API v3 endpoint
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

// Get YouTube recommendations based on topic
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const { topic, maxResults = 5 } = req.query;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // For demo purposes, return mock data since YouTube API requires API key
    // In production, you would use: process.env.YOUTUBE_API_KEY
    const mockRecommendations = [
      {
        videoId: 'dQw4w9WgXcQ',
        title: `${topic} - Complete Explanation | Class 11 Physics`,
        channelTitle: 'Physics Wallah',
        publishedAt: '2023-01-15T10:00:00Z',
        duration: 'PT15M30S',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        description: `Comprehensive explanation of ${topic} concepts for Class 11 students.`,
        viewCount: '1.2M'
      },
      {
        videoId: 'abc123def456',
        title: `${topic} - Problem Solving Techniques`,
        channelTitle: 'Khan Academy',
        publishedAt: '2023-02-20T14:30:00Z',
        duration: 'PT12M45S',
        thumbnail: 'https://img.youtube.com/vi/abc123def456/maxresdefault.jpg',
        description: `Step-by-step problem solving for ${topic} with examples.`,
        viewCount: '850K'
      },
      {
        videoId: 'xyz789uvw012',
        title: `${topic} - Quick Revision | 10 Minutes`,
        channelTitle: 'Unacademy',
        publishedAt: '2023-03-10T09:15:00Z',
        duration: 'PT10M00S',
        thumbnail: 'https://img.youtube.com/vi/xyz789uvw012/maxresdefault.jpg',
        description: `Quick revision of ${topic} for exam preparation.`,
        viewCount: '650K'
      },
      {
        videoId: 'def456ghi789',
        title: `${topic} - Advanced Concepts`,
        channelTitle: 'Vedantu',
        publishedAt: '2023-04-05T16:45:00Z',
        duration: 'PT18M20S',
        thumbnail: 'https://img.youtube.com/vi/def456ghi789/maxresdefault.jpg',
        description: `Advanced level concepts of ${topic} for competitive exams.`,
        viewCount: '420K'
      },
      {
        videoId: 'ghi789jkl012',
        title: `${topic} - Practice Questions`,
        channelTitle: 'BYJU\'S',
        publishedAt: '2023-05-12T11:20:00Z',
        duration: 'PT14M10S',
        thumbnail: 'https://img.youtube.com/vi/ghi789jkl012/maxresdefault.jpg',
        description: `Practice questions and solutions for ${topic}.`,
        viewCount: '380K'
      }
    ];

    // Filter and limit results
    const recommendations = mockRecommendations.slice(0, parseInt(maxResults));

    res.json({
      topic,
      recommendations,
      totalResults: recommendations.length
    });

    /* 
    // Real YouTube API implementation (requires API key):
    const response = await axios.get(YOUTUBE_API_URL, {
      params: {
        part: 'snippet',
        q: `${topic} class 11 physics explanation`,
        type: 'video',
        maxResults: parseInt(maxResults),
        order: 'relevance',
        key: process.env.YOUTUBE_API_KEY,
        videoDuration: 'medium', // 4-20 minutes
        videoDefinition: 'high'
      }
    });

    const recommendations = response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails.high.url,
      description: item.snippet.description
    }));

    res.json({
      topic,
      recommendations,
      totalResults: response.data.pageInfo.totalResults
    });
    */
  } catch (error) {
    console.error('YouTube recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch YouTube recommendations' });
  }
});

// Get trending educational videos
router.get('/trending', authenticateToken, async (req, res) => {
  try {
    const { category = 'education', maxResults = 10 } = req.query;

    // Mock trending videos for demo
    const trendingVideos = [
      {
        videoId: 'trend1abc123',
        title: 'Complete Physics Revision - Class 11 | All Chapters',
        channelTitle: 'Physics Wallah',
        publishedAt: '2023-12-01T08:00:00Z',
        duration: 'PT2H30M',
        thumbnail: 'https://img.youtube.com/vi/trend1abc123/maxresdefault.jpg',
        description: 'Complete revision of all Class 11 Physics chapters in one video.',
        viewCount: '2.5M',
        category: 'education'
      },
      {
        videoId: 'trend2def456',
        title: 'Newton\'s Laws - Complete Explanation with Examples',
        channelTitle: 'Khan Academy',
        publishedAt: '2023-12-02T10:30:00Z',
        duration: 'PT45M15S',
        thumbnail: 'https://img.youtube.com/vi/trend2def456/maxresdefault.jpg',
        description: 'Detailed explanation of Newton\'s three laws with practical examples.',
        viewCount: '1.8M',
        category: 'education'
      },
      {
        videoId: 'trend3ghi789',
        title: 'Thermodynamics - Quick Revision | 15 Minutes',
        channelTitle: 'Unacademy',
        publishedAt: '2023-12-03T14:15:00Z',
        duration: 'PT15M00S',
        thumbnail: 'https://img.youtube.com/vi/trend3ghi789/maxresdefault.jpg',
        description: 'Quick revision of thermodynamics concepts for exam preparation.',
        viewCount: '1.2M',
        category: 'education'
      }
    ];

    res.json({
      category,
      videos: trendingVideos.slice(0, parseInt(maxResults)),
      totalResults: trendingVideos.length
    });
  } catch (error) {
    console.error('Trending videos error:', error);
    res.status(500).json({ error: 'Failed to fetch trending videos' });
  }
});

export default router;
