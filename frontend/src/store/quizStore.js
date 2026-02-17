import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const useQuizStore = create((set, get) => ({
  quizzes: [],
  currentIndex: 0,
  score: 0,
  answeredQuestions: new Set(),
  loading: false,
  error: null,

  fetchQuizzes: async (courseId) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/quiz/${courseId}`);
      set({
        quizzes: response.data.questions,
        currentIndex: 0,
        score: 0,
        answeredQuestions: new Set(),
        loading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to load quiz questions",
        loading: false,
      });
    }
  },

  answerQuestion: (questionId, selectedAnswer, correctAnswer) => {
    const { answeredQuestions, score } = get();

    if (!answeredQuestions.has(questionId)) {
      const newAnsweredQuestions = new Set(answeredQuestions);
      newAnsweredQuestions.add(questionId);

      const isCorrect = selectedAnswer === correctAnswer;
      const newScore = isCorrect ? score + 1 : score;

      set({
        answeredQuestions: newAnsweredQuestions,
        score: newScore,
      });

      return isCorrect;
    }
    return null;
  },

  nextQuestion: () => {
    const { currentIndex, quizzes } = get();
    if (currentIndex < quizzes.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  previousQuestion: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },

  resetQuiz: () => {
    set({
      currentIndex: 0,
      score: 0,
      answeredQuestions: new Set(),
    });
  },

  getProgress: () => {
    const { answeredQuestions, quizzes, score } = get();
    const total = quizzes.length;
    const answered = answeredQuestions.size;
    const percentage = total > 0 ? (answered / total) * 100 : 0;
    const accuracy = answered > 0 ? (score / answered) * 100 : 0;

    return {
      total,
      answered,
      percentage: Math.round(percentage),
      score,
      accuracy: Math.round(accuracy),
    };
  },
}));
