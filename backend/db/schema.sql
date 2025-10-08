-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  hashed_password TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255),
  filename VARCHAR(255),
  pages INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Passages
CREATE TABLE passages (
  id SERIAL PRIMARY KEY,
  doc_id INTEGER REFERENCES documents(id),
  page_no INTEGER,
  text TEXT,
  embedding_vector VECTOR(384), -- or BYTEA for FAISS/Annoy
  chunk_id INTEGER
);

-- Quizzes
CREATE TABLE quizzes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  doc_id INTEGER REFERENCES documents(id),
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Questions
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id),
  type VARCHAR(10), -- MCQ/SAQ/LAQ
  prompt_text TEXT,
  choices JSONB,
  correct_answer TEXT,
  explanation TEXT,
  difficulty VARCHAR(10)
);

-- Attempts
CREATE TABLE attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  quiz_id INTEGER REFERENCES quizzes(id),
  score INTEGER,
  answers JSONB,
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);

-- User Stats
CREATE TABLE user_stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  metrics JSONB
);
