# Frontend - Quiz Card Practice

React-based frontend for the quiz card practice application.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Update the API URL in `.env` if needed.

4. Start development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

## Deploy to Vercel

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel
```

3. Configure environment variables in Vercel dashboard:
   - `VITE_API_URL`: Your backend API URL

## Project Structure

```
src/
├── components/        # React components
│   ├── QuizCard.jsx   # Main quiz card component
│   ├── ProgressBar.jsx # Progress tracking display
│   └── Header.jsx     # App header
├── store/            # State management (Zustand)
│   └── quizStore.js  # Quiz state and API calls
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## Key Features

- **Quiz Card**: Interactive multiple-choice questions with instant feedback
- **Progress Tracking**: Real-time score and completion percentage
- **State Management**: Zustand for lightweight, fast state updates
- **Responsive Design**: Works on all device sizes
- **Tailwind CSS**: Custom color scheme matching brand guidelines

## Color Scheme

- Primary (Forest Green): `#065F46`
- Secondary (Sand): `#E5E7EB`
- Accent (Terracotta): `#D97706`
