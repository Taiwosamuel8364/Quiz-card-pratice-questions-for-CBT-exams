import React from "react";
import { Target, TrendingUp, Award } from "lucide-react";

export const ProgressBar = ({ current, total, score, accuracy }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Your Progress</h2>
        <span className="text-sm font-medium text-gray-600">
          Question {current} of {total}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
        <div
          className="bg-[#065F46] h-3 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Score */}
        <div className="flex items-center gap-3 p-4 bg-[#E5E7EB] rounded-lg">
          <Award className="w-8 h-8 text-[#065F46]" />
          <div>
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-2xl font-bold text-gray-800">{score}</p>
          </div>
        </div>

        {/* Accuracy */}
        <div className="flex items-center gap-3 p-4 bg-[#E5E7EB] rounded-lg">
          <Target className="w-8 h-8 text-[#D97706]" />
          <div>
            <p className="text-sm text-gray-600">Accuracy</p>
            <p className="text-2xl font-bold text-gray-800">{accuracy}%</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 p-4 bg-[#E5E7EB] rounded-lg">
          <TrendingUp className="w-8 h-8 text-[#065F46]" />
          <div>
            <p className="text-sm text-gray-600">Progress</p>
            <p className="text-2xl font-bold text-gray-800">
              {Math.round(percentage)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
