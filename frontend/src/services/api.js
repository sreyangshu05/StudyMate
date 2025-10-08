import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// Documents API
export const documentsAPI = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  ingest: (docId) => api.post('/documents/ingest', { docId }),
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`),
};

// QA API
export const qaAPI = {
  ask: (query, docIds, topK = 4) => api.post('/qa', { query, docIds, topK }),
  search: (query, docIds, topK = 4) => api.post('/qa/search', { query, docIds, topK }),
};

// Quiz API
export const quizAPI = {
  generate: (docIds, numQuestions = 10, distribution = { mcq: 6, saq: 3, laq: 1 }) =>
    api.post('/quiz/generate', { docIds, numQuestions, distribution }),
  getById: (id) => api.get(`/quiz/${id}`),
  getAll: () => api.get('/quiz'),
  submitAttempt: (id, answers) => api.post(`/quiz/${id}/attempt`, { answers }),
  getAttempts: (id) => api.get(`/quiz/${id}/attempts`),
};

// Stats API
export const statsAPI = {
  getStats: () => api.get('/stats'),
  getDashboard: () => api.get('/stats/dashboard'),
};

// Chat API
export const chatAPI = {
  create: (title) => api.post('/chat', { title }),
  getAll: () => api.get('/chat'),
  getMessages: (id) => api.get(`/chat/${id}/messages`),
  sendMessage: (id, message, docIds) => api.post(`/chat/${id}/messages`, { message, docIds }),
  delete: (id) => api.delete(`/chat/${id}`),
};

// YouTube API
export const youtubeAPI = {
  getRecommendations: (topic, maxResults = 5) => 
    api.get('/youtube/recommendations', { params: { topic, maxResults } }),
  getTrending: (category = 'education', maxResults = 10) =>
    api.get('/youtube/trending', { params: { category, maxResults } }),
};

export default api;
