# Backend - Quiz Card Practice API

NestJS backend API for the quiz card practice application with Mastra AI integration.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
   - MongoDB connection string
   - Mastra API key or OpenAI API key
   - Other settings

4. Start development server:

```bash
npm run start:dev
```

The API will be available at `http://localhost:4000/api`

## API Endpoints

### Quiz Endpoints

#### Get Quiz Questions

```http
GET /api/quiz/:courseId?limit=20
```

Returns quiz questions for a specific course.

**Response:**

```json
{
  "courseId": "default-course",
  "questions": [
    {
      "id": "...",
      "question": "What is...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "...",
      "topic": "...",
      "difficulty": "medium"
    }
  ]
}
```

#### Generate Quiz from Content

```http
POST /api/quiz/generate
```

**Request Body:**

```json
{
  "courseId": "course-123",
  "content": "Your course material text...",
  "questionCount": 10,
  "difficulty": "medium"
}
```

#### Submit Answer

```http
POST /api/quiz/submit
```

**Request Body:**

```json
{
  "userId": "user-123",
  "questionId": "question-id",
  "selectedAnswer": "Option A",
  "timeSpent": 30
}
```

**Response:**

```json
{
  "isCorrect": true,
  "correctAnswer": "Option A",
  "explanation": "..."
}
```

#### Get User Progress

```http
GET /api/quiz/progress/:userId/:courseId
```

**Response:**

```json
{
  "userId": "user-123",
  "courseId": "course-123",
  "totalQuestions": 20,
  "answeredQuestions": 10,
  "correctAnswers": 8,
  "accuracy": 80,
  "progress": 50
}
```

## Database Schema

### Question Schema

```typescript
{
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  courseId: string;
  isActive: boolean;
  timestamps: true;
}
```

### User Progress Schema

```typescript
{
  userId: string;
  courseId: string;
  questionId: ObjectId;
  selectedAnswer: string;
  isCorrect: boolean;
  attemptCount: number;
  timeSpent: number;
  timestamps: true;
}
```

### Course Schema

```typescript
{
  courseId: string;
  title: string;
  description: string;
  topics: string[];
  totalQuestions: number;
  isActive: boolean;
  sourceFile: string;
  metadata: object;
  timestamps: true;
}
```

## Mastra AI Integration

The application uses Mastra AI (via Google Gemini) to generate quiz questions from course materials.

### Configuration

1. Get an API key from OpenAI or Mastra Cloud
2. Add to `.env`:

```
OPENAI_API_KEY=your_key_here
MASTRA_MODEL=gpt-4
```

### Usage

The `MastraService` handles:

- Generating questions from text content
- Parsing PDF documents
- Creating multiple-choice questions with distractors
- Validating question quality

### Example Integration

```typescript
// In your service
const questions = await this.mastraService.generateQuizQuestions(
  courseContent,
  10, // number of questions
  "medium", // difficulty
);
```

## Deployment

### Connect to Mastra Cloud

1. Sign up at Mastra Cloud
2. Create a new project
3. Get your API credentials
4. Add to environment variables
5. Deploy using your preferred platform

### Production Build

```bash
npm run build
npm run start:prod
```

## Project Structure

```
src/
├── quiz/
│   ├── schemas/           # MongoDB schemas
│   ├── dto/              # Data transfer objects
│   ├── quiz.controller.ts
│   ├── quiz.service.ts
│   └── quiz.module.ts
├── mastra/
│   ├── mastra.service.ts # Mastra AI integration
│   └── mastra.module.ts
├── app.module.ts
└── main.ts
```
