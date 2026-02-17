import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

export const QuizInterface = ({ onBack, token }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
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
      setLoading(false);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Failed to load questions");
      setLoading(false);
    }
  };

  const handleAnswerSelect = (index) => {
    if (showExplanation) return;

    setSelectedAnswer(index);
    setShowExplanation(true);

    const isCorrect = index === questions[currentIndex].correctAnswer;
    if (isCorrect) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    }
    setScore((prev) => ({ ...prev, total: prev.total + 1 }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore({ correct: 0, total: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#065F46]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
        <div className="text-center text-red-600">
          <XCircle className="w-16 h-16 mx-auto mb-4" />
          <p className="text-xl font-semibold">{error}</p>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2 bg-[#065F46] text-white rounded-lg hover:bg-[#064e3b]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">
            No questions available. Please upload a file first.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-[#065F46] text-white rounded-lg hover:bg-[#064e3b]"
          >
            Upload File
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#065F46] hover:text-[#064e3b] font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Upload
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restart
            </button>
            <div className="text-right">
              <div className="text-sm text-gray-600">Score</div>
              <div className="text-2xl font-bold text-[#065F46]">
                {score.correct}/{score.total}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className="bg-[#065F46] h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600 text-center">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          {currentQuestion.topic && (
            <span className="inline-block px-3 py-1 bg-[#065F46]/10 text-[#065F46] rounded-full text-sm font-semibold mb-4">
              {currentQuestion.topic}
            </span>
          )}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {currentQuestion.question}
          </h2>
          {currentQuestion.difficulty && (
            <span className="text-sm text-gray-500">
              Difficulty: {currentQuestion.difficulty}
            </span>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showResult = showExplanation;

            let buttonClass =
              "w-full p-4 text-left rounded-lg border-2 transition-all ";
            if (!showResult) {
              buttonClass += isSelected
                ? "border-[#065F46] bg-[#065F46]/10"
                : "border-gray-300 hover:border-[#065F46] hover:bg-gray-50";
            } else {
              if (isCorrect) {
                buttonClass += "border-green-500 bg-green-50";
              } else if (isSelected && !isCorrect) {
                buttonClass += "border-red-500 bg-red-50";
              } else {
                buttonClass += "border-gray-300 bg-gray-50";
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
                  <span className="font-medium">{option}</span>
                  {showResult && isCorrect && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              selectedAnswer === currentQuestion.correctAnswer
                ? "bg-green-50 border-2 border-green-200"
                : "bg-red-50 border-2 border-red-200"
            }`}
          >
            <div className="flex items-start gap-2">
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="font-bold mb-2">
                  {selectedAnswer === currentQuestion.correctAnswer
                    ? "Correct!"
                    : "Incorrect"}
                </h3>
                <p className="text-gray-700">{currentQuestion.explanation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="flex-1 py-3 px-6 bg-[#065F46] text-white rounded-lg font-semibold hover:bg-[#064e3b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
