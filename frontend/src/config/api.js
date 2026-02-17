export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
  },
  QUIZ: {
    UPLOAD: `${API_URL}/quiz/upload`,
    QUESTIONS: `${API_URL}/quiz/questions`,
    SUBMIT: `${API_URL}/quiz/submit`,
    PROGRESS: `${API_URL}/quiz/progress`,
  },
};
