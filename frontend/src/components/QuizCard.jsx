import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  RotateCcw,
  TrendingUp,
  Target,
  Award,
} from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

export const QuizCard = ({ onBack, token }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.QUIZ.QUESTIONS}?courseId=default`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      setQuestions(data);
      setAnsweredQuestions(new Array(data.length).fill(null));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Failed to load questions");
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (showExplanation) return;

    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const newAnsweredQuestions = [...answeredQuestions];
    newAnsweredQuestions[currentIndex] = {
      selectedAnswer: answerIndex,
      correctAnswer: questions[currentIndex].correctAnswer,
      isCorrect: answerIndex === questions[currentIndex].correctAnswer,
    };
    setAnsweredQuestions(newAnsweredQuestions);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(
        answeredQuestions[currentIndex + 1]?.selectedAnswer ?? null,
      );
      setShowExplanation(answeredQuestions[currentIndex + 1] !== null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(
        answeredQuestions[currentIndex - 1]?.selectedAnswer ?? null,
      );
      setShowExplanation(answeredQuestions[currentIndex - 1] !== null);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnsweredQuestions(new Array(questions.length).fill(null));
  };

  const totalAnswered = answeredQuestions.filter((q) => q !== null).length;
  const correctAnswers = answeredQuestions.filter((q) => q?.isCorrect).length;
  const accuracy =
    totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-[#065F46] mx-auto mb-4"></div>
          <p className="text-gray-600 text-base sm:text-lg">
            Loading questions...
          </p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <XCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-red-600" />
          <p className="text-lg sm:text-xl text-gray-600 mb-4">
            {error || "No questions available. Please upload a file first."}
          </p>
          <button
            onClick={onBack}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-[#065F46] text-white rounded-lg hover:bg-[#064e3b] transition-colors font-semibold text-sm sm:text-base"
          >
            Upload File
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4">
      {/* Stats Header - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Target className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Progress</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">
                {currentIndex + 1}/{questions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <Award className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Correct</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">
                {correctAnswers}/{totalAnswered}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-purple-500">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Accuracy</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">
                {accuracy}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Quiz Card */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#065F46] to-[#047857] p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1 sm:gap-2 text-white hover:text-green-100 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold hidden sm:inline">
                Back to Upload
              </span>
              <span className="font-semibold sm:hidden">Back</span>
            </button>
            <button
              onClick={handleRestart}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white text-sm sm:text-base"
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Restart</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 sm:h-3">
            <div
              className="bg-white h-2 sm:h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="p-4 sm:p-8">
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
              {currentQuestion.topic && (
                <span className="inline-block px-3 py-1 sm:px-4 sm:py-2 bg-[#065F46]/10 text-[#065F46] rounded-full text-xs sm:text-sm font-bold">
                  📚 {currentQuestion.topic}
                </span>
              )}
              {currentQuestion.difficulty && (
                <span
                  className={`inline-block px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold ${
                    currentQuestion.difficulty === "easy"
                      ? "bg-green-100 text-green-700"
                      : currentQuestion.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {currentQuestion.difficulty === "easy"
                    ? "⭐ Easy"
                    : currentQuestion.difficulty === "medium"
                      ? "⭐⭐ Medium"
                      : "⭐⭐⭐ Hard"}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showResult = showExplanation;

              let buttonClass =
                "w-full p-3 sm:p-5 text-left rounded-lg sm:rounded-xl border-2 transition-all font-medium text-sm sm:text-base ";

              if (!showResult) {
                buttonClass += isSelected
                  ? "border-[#065F46] bg-[#065F46]/10 shadow-md transform scale-[1.02]"
                  : "border-gray-200 hover:border-[#065F46] hover:bg-gray-50 hover:shadow-md active:scale-95";
              } else {
                if (isCorrect) {
                  buttonClass += "border-green-500 bg-green-50 shadow-md";
                } else if (isSelected && !isCorrect) {
                  buttonClass += "border-red-500 bg-red-50 shadow-md";
                } else {
                  buttonClass += "border-gray-200 bg-gray-50";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  className={buttonClass}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-lg pr-2">{option}</span>
                    {showResult && isCorrect && (
                      <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-green-600 flex-shrink-0" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 sm:w-7 sm:h-7 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div
              className={`p-4 sm:p-5 rounded-lg sm:rounded-xl mb-4 sm:mb-6 border-2 ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-2">
                    {selectedAnswer === currentQuestion.correctAnswer
                      ? "🎉 Correct!"
                      : "❌ Incorrect"}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2 sm:gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-1 py-3 sm:py-4 px-4 sm:px-6 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1 sm:gap-2 hover:shadow-md text-sm sm:text-base active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className="flex-1 py-3 sm:py-4 px-4 sm:px-6 bg-[#065F46] text-white rounded-lg sm:rounded-xl font-bold hover:bg-[#064e3b] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1 sm:gap-2 hover:shadow-md text-sm sm:text-base active:scale-95"
            >
              Next
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Question Navigator */}
      <div className="mt-4 sm:mt-6 bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">
          Question Navigator
        </h3>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
          {questions.map((_, index) => {
            const answered = answeredQuestions[index];
            return (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setSelectedAnswer(
                    answeredQuestions[index]?.selectedAnswer ?? null,
                  );
                  setShowExplanation(answeredQuestions[index] !== null);
                }}
                className={`p-2 sm:p-3 rounded-lg font-bold transition-all text-xs sm:text-base active:scale-90 ${
                  currentIndex === index
                    ? "bg-[#065F46] text-white shadow-lg scale-110"
                    : answered?.isCorrect
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : answered && !answered.isCorrect
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
