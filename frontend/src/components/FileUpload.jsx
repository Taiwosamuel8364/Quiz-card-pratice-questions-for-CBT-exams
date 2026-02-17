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
  const [questions, setQuestions] = useState([]);

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

      if (selectedFile.size > 41943040) {
        setMessage({
          type: "error",
          text: "File size exceeds 40MB limit",
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

    if (!token) {
      console.error("❌ No token available!");
      setMessage({
        type: "error",
        text: "You are not logged in. Please login first.",
      });
      return;
    }

    console.log("✅ Token exists:", token.substring(0, 20) + "...");

    setUploading(true);
    setProgress(0);
    setQuestions([]);
    setMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("topic", topic);
    formData.append("questionCount", questionCount.toString());
    formData.append("difficulty", difficulty);

    try {
      setStatusMessage("📤 Uploading file...");

      console.log("🔑 Sending request with Authorization header...");
      console.log("📍 URL:", API_ENDPOINTS.QUIZ.UPLOAD);

      // Step 1: Start the generation
      const response = await fetch(API_ENDPOINTS.QUIZ.UPLOAD, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // 🔧 Make sure this is correct
        },
        body: formData,
      });

      console.log("📡 Response status:", response.status);

      // 🔍 DEBUG: Log response details
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Upload failed:", response.status, errorText);

        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }

        throw new Error(errorText || "Failed to upload file");
      }

      const data = await response.json();
      console.log("✅ Upload successful:", data);

      const { generationId } = data;
      setStatusMessage("✨ Generation started. Streaming results...");

      // Step 2: Connect to SSE stream with token in URL
      const baseUrl = API_ENDPOINTS.QUIZ.UPLOAD.replace("/quiz/upload", "");

      console.log("🔌 Connecting to SSE stream...");
      console.log("📍 Stream URL:", `${baseUrl}/quiz/stream/${generationId}`);

      const eventSource = new EventSource(
        `${baseUrl}/quiz/stream/${generationId}?token=${encodeURIComponent(token)}`,
      );

      eventSource.onopen = () => {
        console.log("✅ SSE connection opened");
      };

      eventSource.onmessage = (event) => {
        const streamData = JSON.parse(event.data);
        console.log("📨 SSE message:", streamData.type);

        if (streamData.type === "progress") {
          setProgress(streamData.progress);
          setStatusMessage(streamData.message);
        } else if (streamData.type === "question") {
          setQuestions((prev) => [...prev, streamData.question]);
          setProgress(streamData.progress);
          setStatusMessage(
            `📝 Received ${streamData.questionNumber}/${streamData.totalQuestions} questions`,
          );
        } else if (streamData.type === "complete") {
          console.log("✅ Generation complete!");
          setProgress(100);
          setStatusMessage("✅ All questions generated!");
          setMessage({
            type: "success",
            text: `Successfully generated ${streamData.totalQuestions} ${difficulty} questions!`,
          });
          setUploading(false);
          eventSource.close();

          setFile(null);
          const fileInput = document.getElementById("file-upload");
          if (fileInput) fileInput.value = "";

          setTimeout(() => {
            if (onUploadComplete) {
              onUploadComplete();
            }
          }, 1500);
        } else if (streamData.type === "error") {
          console.error("❌ SSE error:", streamData.message);
          setStatusMessage("");
          setMessage({
            type: "error",
            text: streamData.message,
          });
          setUploading(false);
          eventSource.close();
        }
      };

      eventSource.onerror = (error) => {
        console.error("❌ SSE connection error:", error);
        setStatusMessage("");
        setMessage({
          type: "error",
          text: "Connection error. Please try again.",
        });
        setUploading(false);
        eventSource.close();
      };
    } catch (error) {
      console.error("❌ Upload error:", error);
      setStatusMessage("");
      setMessage({
        type: "error",
        text: error.message || "An error occurred while uploading",
      });
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
            Course Material (PDF or TXT, max 40MB)
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
                <div>
                  <span className="text-[#065F46] font-semibold block">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ) : (
                <>
                  <span className="text-gray-600">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-sm text-gray-500 mt-1">
                    PDF or TXT files only (max 40MB)
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
            {questions.length > 0 && (
              <p className="text-sm font-bold text-[#065F46] mt-3 text-center">
                📊 {questions.length} / {questionCount} questions received
              </p>
            )}
          </div>
        )}

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
          disabled={uploading || !file || !topic || !token}
          className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${
            uploading || !file || !topic || !token
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#065F46] hover:bg-[#064e3b] shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          }`}
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin h-5 w-5" />
              Generating Questions... ({questions.length}/{questionCount})
            </span>
          ) : !token ? (
            "Please Login First"
          ) : (
            "Generate Quiz Questions"
          )}
        </button>
      </form>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
    </div>
  );
};
