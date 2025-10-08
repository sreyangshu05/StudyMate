# Backend API Spec

## POST /api/upload
- Upload PDF (form-data: file)
- Response: `{ docId, title, pages }`

## POST /api/ingest
- Body: `{ docId }`
- Triggers chunk+embed processing
- Response: `{ status: 'ok', chunks: N }`

## POST /api/generate-quiz
- Body: `{ docIds:[], numQuestions:10, distribution:{mcq:6,saq:3,laq:1} }`
- Response: `[{ type, stem, choices, correct_index, explanation, source_doc, page_no, difficulty }]`

## POST /api/qa
- Body: `{ query, docIds, top_k }`
- Response: `{ answer, citations:[{ docId, page, snippet, score }] }`

## POST /api/attempts
- Body: `{ userId, quizId, answers, score }`
- Response: `{ attemptId, status }`

## GET /api/stats?userId=
- Response: `{ quizzesTaken, avgScore, topicStrengths, topicWeaknesses, history: [...] }`
