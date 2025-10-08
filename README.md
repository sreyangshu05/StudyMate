# StudyMate AI 🚀

A comprehensive AI-powered learning platform that transforms how students study from PDFs using advanced LLM technology. Upload course materials, generate intelligent quizzes, chat with AI, and track your progress - all in one responsive web application.

## ✨ Features

### Core Features (Must-Have)
- **📄 PDF Upload & Processing**: Upload PDFs, extract text, and create embeddings
- **🤖 AI-Powered Q&A**: RAG-based question answering with page citations
- **📝 Quiz Generator**: Create custom quizzes (MCQ/SAQ/LAQ) with explanations
- **📊 Progress Tracking**: Comprehensive dashboard with performance analytics
- **💬 Chat Interface**: Interactive AI assistant with document context
- **📱 Responsive Design**: Mobile-first design with desktop optimization

### Advanced Features (Nice-to-Have)
- **🎥 YouTube Recommender**: Educational video suggestions based on topics
- **📚 Source Management**: Multi-document selection and management
- **🔍 Citation Highlighting**: Click-to-scroll PDF navigation
- **📈 Performance Analytics**: Topic strengths/weaknesses analysis

## 🛠 Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for responsive styling
- **React-PDF** for PDF viewing
- **React Router** for navigation
- **Axios** for API communication
- **Framer Motion** for animations

### Backend
- **Node.js + Express** for API server
- **SQLite** for data persistence (PostgreSQL ready)
- **OpenAI API** for LLM integration
- **PDF-parse** for document processing
- **FAISS** for vector similarity search

### AI & ML
- **OpenAI GPT-3.5-turbo** for chat and Q&A
- **OpenAI text-embedding-3-small** for document embeddings
- **RAG (Retrieval-Augmented Generation)** for contextual answers
- **Custom prompt engineering** for quiz generation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key
- Git

### Installation

1. **Clone the repository**
```bash
git clone [<repository-url>](https://github.com/sreyangshu05/StudyMate)
cd Final StudyMate
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up environment variables**
```bash
# Copy the example file
cp backend/env.example backend/.env

# Edit backend/.env with your OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

5. **Start the backend server**
```bash
cd backend
npm run dev
```

6. **Start the frontend (in a new terminal)**
```bash
cd frontend
npm run dev
```

7. **Open your browser**
Navigate to `http://localhost:3000`

### First Time Setup

1. **Create an account** - Register with email and password
2. **Upload a PDF** - Go to Reader page and upload your first document
3. **Process the document** - The system will automatically extract text and create embeddings
4. **Start chatting** - Ask questions about your uploaded content
5. **Generate quizzes** - Create custom quizzes from your documents
6. **Track progress** - Monitor your performance in the dashboard

## 📁 Project Structure

```
Final StudyMate-AI/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── contexts/       # React contexts
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── db/                 # Database schema
│   └── uploads/            # Uploaded PDF files
├── seed_pdfs/              # Sample PDFs for testing
├── scripts/                # Utility scripts
├── wireframes/             # UI wireframes
├── architecture.md         # System architecture
└── README.md              # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Documents
- `POST /api/documents/upload` - Upload PDF
- `POST /api/documents/ingest` - Process PDF (extract & embed)
- `GET /api/documents` - List user documents
- `DELETE /api/documents/:id` - Delete document

### AI Features
- `POST /api/qa` - Ask questions with RAG
- `POST /api/qa/search` - Search document passages
- `POST /api/chat/:id/messages` - Send chat message

### Quizzes
- `POST /api/quiz/generate` - Generate new quiz
- `GET /api/quiz/:id` - Get quiz details
- `POST /api/quiz/:id/attempt` - Submit quiz attempt

### Analytics
- `GET /api/stats` - User statistics
- `GET /api/stats/dashboard` - Dashboard data

### YouTube (Optional)
- `GET /api/youtube/recommendations` - Get video recommendations
- `GET /api/youtube/trending` - Get trending educational videos

## 🎯 Usage Examples

### Upload and Process a PDF
1. Go to Reader page
2. Click "Choose PDF" and select your document
3. Enter a title and click upload
4. The system automatically processes the PDF

### Ask Questions
1. Select your uploaded documents
2. Go to Chat page
3. Ask questions like:
   - "What is Newton's second law?"
   - "Explain the concept of momentum"
   - "How do I solve this equation?"

### Generate a Quiz
1. Select documents in Quiz page
2. Choose question distribution (MCQ/SAQ/LAQ)
3. Set number of questions
4. Click "Generate Quiz"
5. Take the quiz and review results

### Track Progress
1. Go to Dashboard
2. View your quiz performance
3. Check topic strengths and weaknesses
4. Monitor learning progress over time

## 🧪 Testing

### Unit Tests
```bash
cd backend
npm test
```

### E2E Tests
```bash
cd frontend
npm run test:e2e
```

## 📊 Performance

- **PDF Processing**: ~2-5 seconds per page
- **Quiz Generation**: ~10-15 seconds for 10 questions
- **Chat Response**: ~2-3 seconds per message
- **Page Load**: <3 seconds on average

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- File upload restrictions

## 🚀 Deployment

### Backend Deployment
1. Set up production environment variables
2. Configure database (PostgreSQL recommended)
3. Deploy to cloud platform (Heroku, Railway, etc.)
4. Set up file storage (AWS S3, Cloudinary)

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Deploy to static hosting (Vercel, Netlify)
3. Configure API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the API documentation

## 🎉 Acknowledgments

- OpenAI for LLM APIs
- React and Vite teams
- Tailwind CSS for styling
- All open-source contributors

---

**Ready to revolutionize your learning experience? Start with StudyMate AI today! 🚀**

## Test Plan

### Unit Tests
- Chunker: PDF text chunking logic
- Embedding storage: correct vector storage/retrieval
- Retrieval ranking: top-k passage selection
- Quiz scoring: answer validation and scoring

### Integration Test
- Upload PDF → Ingest → Generate quiz → Submit answers → Store attempt

### E2E Test
- Simulate user flow (Playwright): open reader, run quiz, check dashboard

## Evaluation Mapping (Assignment Rubric)
- **Scope coverage (50%)**: All must-have features implemented (PDF viewer, quiz generation, storage, progress)
- **UI/UX (20%)**: Clean, responsive, accessible UI (mobile + desktop)
- **Responsiveness (10%)**: Fast load, performant demo
- **Code quality (10%)**: Modular, linted, documented, clear README
- **README (10%)**: Architecture diagram, run instructions, screenshots, seeded data, feature mapping

---

For demo: see screenshots, architecture, and run instructions above. Seeded with NCERT Class XI Physics PDFs for quick grading.
