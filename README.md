# 🚀 AI-Powered Blog Scraper & Rewriter Platform

An intelligent content management system that scrapes articles from BeyondChats blog, enhances them using AI (LLaMA 3.1), and presents both original and AI-enhanced versions through a beautiful React interface.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://ai-powered-blog-scraper-rewriter-pl.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend-API-blue)](https://ai-powered-blog-scraper-rewriter-platform.onrender.com)

## 📋 Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Data Flow](#data-flow)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [Live Links](#live-links)

---

## ✨ Features

- **Automated Web Scraping**: Scrapes articles from BeyondChats blog with intelligent content extraction
- **AI Content Enhancement**: Rewrites articles using LLaMA 3.1 (70B/8B) for improved readability and SEO
- **Reference Integration**: Automatically searches Google and scrapes reference articles for context
- **Dual Content Display**: View original and AI-enhanced versions side-by-side
- **Modern UI**: Beautiful, responsive React interface with Tailwind CSS
- **RESTful API**: Complete CRUD operations with pagination and filtering
- **Smart Deduplication**: Prevents duplicate articles while allowing updated versions
- **Statistics Dashboard**: Track scraping and enhancement metrics

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (React + Vite + Tailwind)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS SERVER                          │
│                         (Node.js)                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │  Articles Routes │        │  Scraper Routes  │              │
│  │   (CRUD API)     │        │ (Scraping Logic) │              │
│  └────────┬─────────┘        └────────┬─────────┘              │
│           │                           │                         │
│           ▼                           ▼                         │
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │  Article Model   │        │ Scraper Service  │              │
│  │   (Mongoose)     │        │   (Cheerio)      │              │
│  └────────┬─────────┘        └────────┬─────────┘              │
└───────────┼──────────────────────────┼──────────────────────────┘
            │                          │
            ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐
│   MongoDB Atlas     │    │  BeyondChats Blog   │
│  (Article Storage)  │    │  (Source Website)   │
└─────────────────────┘    └─────────────────────┘
            ▲
            │
            │ Store Enhanced Content
            │
┌─────────────────────────────────────────────────────────────────┐
│                   AI REWRITING PIPELINE                         │
│                    (Standalone Scripts)                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Fetch Original Articles from MongoDB                       │
│  2. Search Google for Related Content (Serper API)             │
│  3. Scrape Reference Articles (Cheerio)                        │
│  4. Generate Enhanced Content (Groq/OpenAI/Together AI)        │
│  5. Save Updated Articles to MongoDB                           │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────┐    ┌─────────────────────┐
│   Groq API          │    │   Serper API        │
│ (LLaMA 3.1 70B/8B)  │    │ (Google Search)     │
└─────────────────────┘    └─────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Cheerio** - Web scraping
- **Axios** - HTTP requests

### AI & APIs
- **Groq API** - LLaMA 3.1 models (primary)
- **OpenAI API** - GPT-4 models (optional)
- **Together AI** - Alternative AI provider (optional)
- **Serper API** - Google search integration

---

## 💻 Local Setup

### Prerequisites
- Node.js 16+ and npm
- MongoDB Atlas account (or local MongoDB)
- API keys for: Groq, Serper (required), OpenAI/Together (optional)

### 1️⃣ Clone Repository
```bash
git clone "https://github.com/ANIKET-crypto828/AI-Powered-Blog-Scraper-Rewriter-Platform"
cd blog-scraper-platform
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in backend directory:
```env
# Server
PORT=5000
API_BASE_URL=http://localhost:5000/api

# Database
MONGO_URI=your_mongodb_connection_string

# AI Provider (choose one or multiple)
AI_PROVIDER=groq
AI_MODEL=llama-3.1-70b-versatile

# API Keys
GROQ_API_KEY=your_groq_api_key
SERPER_API_KEY=your_serper_api_key
OPENAI_API_KEY=your_openai_key (optional)
TOGETHER_API_KEY=your_together_key (optional)
```

Start backend server:
```bash
npm run dev
```
Backend runs on `http://localhost:5000`

### 3️⃣ Frontend Setup
```bash
cd frontend/client
npm install
```

Create `.env` file in frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

### 4️⃣ Run Scraping & Rewriting

**Step 1: Scrape Original Articles**
```bash
cd backend
npm run scrape-first
```

**Step 2: Enhance with AI**
```bash
npm run rewrite
```

---

## 🔐 Environment Variables

### Backend Required
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `GROQ_API_KEY` | Groq API key for LLaMA models | `gsk_...` |
| `SERPER_API_KEY` | Serper API for Google search | `...` |

### Backend Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `AI_PROVIDER` | AI provider (`groq`/`openai`/`together`) | `groq` |
| `AI_MODEL` | Model name | `llama-3.1-70b-versatile` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `TOGETHER_API_KEY` | Together AI API key | - |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |

---

## 📡 API Endpoints

### Articles
```
GET    /api/articles                 # Get all articles (with filters)
GET    /api/articles/:id             # Get single article
POST   /api/articles                 # Create article
PUT    /api/articles/:id             # Update article
DELETE /api/articles/:id             # Soft delete article
GET    /api/articles/stats/summary   # Get statistics
```

### Scraper
```
POST   /api/scraper/scrape-oldest    # Scrape 5 oldest articles
POST   /api/scraper/scrape-page      # Scrape specific page
POST   /api/scraper/scrape-batch     # Batch scrape multiple pages
GET    /api/scraper/test             # Test scraping
GET    /api/scraper/status           # Scraping statistics
DELETE /api/scraper/clear-scraped    # Clear all scraped articles
```

### Query Parameters (Articles)
- `type`: Filter by `original` or `updated`
- `limit`: Results per page (default: 50)
- `page`: Page number (default: 1)
- `search`: Search query
- `sortBy`: Sort field (default: `createdAt`)
- `order`: Sort order `asc` or `desc` (default: `desc`)

---

## 🔄 Data Flow

### Scraping Flow
```
1. User clicks "Scrape Articles" → POST /api/scraper/scrape-oldest
2. Backend fetches BeyondChats blog last page
3. Cheerio extracts article links and metadata
4. For each article:
   - Scrape full content
   - Check for duplicates
   - Save to MongoDB as 'original' type
5. Return scraped articles to frontend
```

### AI Enhancement Flow
```
1. Run npm run rewrite
2. Fetch all 'original' articles from MongoDB
3. For each article:
   a. Search Google for related content (Serper API)
   b. Scrape top 2 reference articles
   c. Send to AI (Groq/OpenAI/Together):
      - Original article
      - Reference content
      - Enhancement prompt
   d. Receive enhanced article
   e. Save as 'updated' type with references
4. Display statistics
```

### Frontend Display Flow
```
1. User opens app → GET /api/articles
2. Display articles in grid with filters
3. Click article → GET /api/articles/:id
4. Show full content with:
   - Badge (Original/Updated)
   - Title & date
   - Full content
   - Reference links (if updated)
```

---

## 📖 Usage Guide

### Scraping Articles
1. Start backend and frontend servers
2. Navigate to frontend (http://localhost:5173)
3. Use Postman or curl to trigger scraping:
```bash
curl -X POST http://localhost:5000/api/scraper/scrape-oldest
```
4. Articles appear in the UI automatically

### Enhancing Articles with AI
1. Ensure original articles are scraped
2. Run enhancement script:
```bash
cd backend
npm run rewrite
```
3. Monitor console for progress
4. Refresh frontend to see updated articles

### Viewing Articles
1. Browse all articles on homepage
2. Filter by Original/Updated
3. Click any article to view full content
4. See references at the bottom of updated articles

---

## 📁 Project Structure

```
blog-scraper-platform/
├── backend/
│   ├── models/
│   │   └── Article.js              # Mongoose schema
│   ├── routes/
│   │   ├── articles.js             # Article CRUD routes
│   │   └── scraper.js              # Scraping routes
│   ├── services/
│   │   └── scraperService.js       # Scraping logic
│   ├── scripts/
│   │   ├── scrapeFirst.js          # Scraping script
│   │   └── rewriteArticles.js      # AI enhancement script
│   ├── server.js                   # Express server
│   ├── package.json
│   └── .env
│
├── frontend/client/
    ├── src/
    │   ├── components/
    │   │   ├── Header.jsx          # Navigation header
    │   │   ├── ArticleList.jsx     # Article grid view
    │   │   └── ArticleDetail.jsx   # Single article view
    │   ├── App.jsx                 # Main app component
    │   ├── main.jsx                # Entry point
    │   └── index.css               # Tailwind styles
    ├── package.json
    └── .env

   README.md
```

---

## 🌐 Live Links

### 🎨 Frontend Application
**URL**: [https://your-frontend-url.vercel.app](https://ai-powered-blog-scraper-rewriter-pl.vercel.app)

Browse and compare original vs AI-enhanced articles with a beautiful, responsive interface.

### 🔌 Backend API
**URL**: [https://ai-powered-blog-scraper-rewriter-platform.onrender.com](https://ai-powered-blog-scraper-rewriter-platform.onrender.com)

RESTful API with complete documentation available at `/health` endpoint.

### 📊 Key Features to Explore
- Filter articles by type (Original/Updated)
- View detailed article content
- See AI-generated references
- Track statistics (articles, references, conversion rate)

---

## 🎯 Key Features Explained

### Smart Scraping
- Automatically detects pagination
- Extracts clean content using multiple selectors
- Handles different website structures
- Respectful delays between requests

### AI Enhancement
- Multi-provider support (Groq, OpenAI, Together)
- Context-aware rewriting with references
- Automatic retry on rate limits
- SEO optimization

### Duplicate Prevention
- Original articles: Checks sourceUrl uniqueness
- Updated articles: Allows same sourceUrl with `#updated` suffix
- Soft delete for data integrity

### Statistics Tracking
- Total articles (original + updated)
- Conversion rate
- Reference count
- Reading time calculation

---

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Ensure port 5000 is available
- Verify all required env variables are set

### Scraping returns no articles
- Check if BeyondChats website structure changed
- Verify internet connection
- Check console logs for specific errors

### AI enhancement fails
- Verify API keys are correct
- Check rate limits on AI provider
- Ensure original articles exist in database
- Try different AI model/provider

### Frontend can't connect to backend
- Ensure backend is running on correct port
- Check VITE_API_URL in frontend .env
- Verify CORS is enabled in backend

---

## 📝 NPM Scripts

### Backend
```json
{
  "dev": "nodemon server.js",
  "scrape-first": "node scripts/scrapeFirst.js",
  "rewrite": "node scripts/rewriteArticles.js"
}
```

### Frontend
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/ANIKET-crypto828)
- LinkedIn: [Your LinkedIn](https://www.linkedin.com/in/aniket-santra-980030275/)

---

## 🙏 Acknowledgments

- BeyondChats for source content
- Groq for fast LLaMA inference
- Serper for Google search API
- Vercel & Render for hosting

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Email: aniketsantra78@gmail.com

---

**⭐ If you found this project helpful, please give it a star!**