# Quiz Card Practice - CBT Exam Preparation

A full-stack web application that uses Google Gemini AI to generate interactive quiz cards from course materials for Computer-Based Test (CBT) exam preparation.

## Features

- **AI-Powered Question Generation**: Uses Google Gemini AI to extract questions from PDFs and lecture notes
- **Interactive Quiz Cards**: Multiple-choice questions with instant feedback
- **Progress Tracking**: Monitor your score and completion percentage
- **Course Coverage**: Scale across entire courses with organized topics

## Tech Stack

- **Frontend**: React + Vite, TailwindCSS
- **Backend**: NestJS
- **Database**: MongoDB
- **AI**: Google Gemini AI
- **Deployment**: Vercel (Frontend), Railway/Render (Backend)

## Color Scheme

- Primary: Forest Green (#065F46)
- Secondary: Sand (#E5E7EB)
- Accent: Terracotta (#D97706)

## Project Structure

```
├── frontend/          # React application
├── backend/           # NestJS API server
└── docs/             # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB instance
- Google Gemini API key (free at [Google AI Studio](https://makersuite.google.com/app/apikey))
  npm run dev

````

### Backend Setup

```bash
cd backend
npm install
npm run start:dev
````

## Documentation

See individual README files in `frontend/` and `backend/` directories for detailed setup instructions.

## License

MIT
