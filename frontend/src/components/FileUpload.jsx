import React, { useState } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

export const FileUpload = ({ onUploadComplete, token }) => {
  const [file, setFile] = useState(null);
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ["application/pdf", "text/plain"];
      if (!validTypes.includes(selectedFile.type)) {
        setMessage({
          type: "error",
          text: "Please upload a PDF or TXT file",
        });
        return;
      }
      setFile(selectedFile);
      setMessage({ type: "", text: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !topic) {
      setMessage({
        type: "error",
        text: "Please select a file and enter a topic",
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("topic", topic);
    formData.append("questionCount", questionCount.toString());
    formData.append("difficulty", difficulty);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    // Update status messages
    const statusMessages = [
      "📄 Reading your file...",
      "🧠 Analyzing content...",
      "✨ Generating quiz questions...",
      "🎯 Crafting explanations...",
      "🔍 Ensuring full coverage...",
      "⚡ Almost ready...",
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < statusMessages.length) {
        setStatusMessage(statusMessages[messageIndex]);
        messageIndex++;
      }
    }, 3000);

    try {
      const response = await fetch(API_ENDPOINTS.QUIZ.UPLOAD, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setProgress(100);

      if (response.ok) {
        setStatusMessage("✅ Questions generated successfully!");
        setMessage({
          type: "success",
          text: `Successfully generated ${data.questionsGenerated} ${difficulty} questions!`,
        });

        // Clear file and input but KEEP difficulty and other settings
        setFile(null);
        const fileInput = document.getElementById("file-upload");
        if (fileInput) fileInput.value = "";

        // DON'T reset these anymore:
        // setTopic('');
        // setQuestionCount(10);
        // setDifficulty('medium');

        setTimeout(() => {
          if (onUploadComplete) {
            onUploadComplete();
          }
        }, 1500);
      } else {
        setStatusMessage("");
        setMessage({
          type: "error",
          text: data.message || "Failed to upload file",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setStatusMessage("");
      setMessage({
        type: "error",
        text: "An error occurred while uploading",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-[#065F46]" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Upload Course Material
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Material (PDF or TXT)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#065F46] transition-colors">
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer flex flex-col items-center ${uploading ? "opacity-50" : ""}`}
            >
              <FileText className="w-12 h-12 text-gray-400 mb-2" />
              {file ? (
                <span className="text-[#065F46] font-semibold">
                  {file.name}
                </span>
              ) : (
                <>
                  <span className="text-gray-600">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-sm text-gray-500 mt-1">
                    PDF or TXT files only
                  </span>
                </>
              )}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic/Subject
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Biology, Mathematics, History"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#065F46] focus:outline-none"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Questions: {questionCount}
          </label>
          <input
            type="range"
            min="5"
            max="100"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#065F46]"
            disabled={uploading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5</span>
            <span>50</span>
            <span>100</span>
          </div>
          {questionCount > 30 && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ Generating {questionCount} questions may take 2-3 minutes
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {["easy", "medium", "hard"].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                disabled={uploading}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  difficulty === level
                    ? "bg-[#065F46] text-white shadow-lg transform scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Indicator */}
        {uploading && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 text-[#065F46] animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {statusMessage}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-[#065F46] to-[#047857] h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <p>
                Our AI is analyzing your content and generating high-quality{" "}
                {difficulty} questions that cover the entire material. This
                ensures comprehensive practice!
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Estimated time: {Math.ceil(questionCount / 10)} -{" "}
              {Math.ceil(questionCount / 5)} minutes
            </p>
          </div>
        )}

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            ℹ️ <strong>Note:</strong> Uploading a new file will replace your
            current questions.
          </p>
        </div>

        {message.text && (
          <div
            className={`flex items-center gap-2 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border-2 border-green-200"
                : "bg-red-50 text-red-800 border-2 border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file || !topic}
          className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${
            uploading || !file || !topic
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#065F46] hover:bg-[#064e3b] shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          }`}
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin h-5 w-5" />
              Generating {questionCount} Questions...
            </span>
          ) : (
            "Generate Quiz Questions"
          )}
        </button>
      </form>
    </div>
  );
};
