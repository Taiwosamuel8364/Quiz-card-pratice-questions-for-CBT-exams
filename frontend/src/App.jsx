import React, { useEffect, useState } from "react";
import { AuthForm } from "./components/AuthForm";
import { FileUpload } from "./components/FileUpload";
import { QuizCard } from "./components/QuizCard"; // Changed from QuizInterface
import { LogOut } from "lucide-react";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken("");
    setIsAuthenticated(false);
    setShowQuiz(false);
  };

  const handleUploadComplete = () => {
    setShowQuiz(true);
  };

  const handleBackToUpload = () => {
    setShowQuiz(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#065F46] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="bg-[#065F46] text-white py-6 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quiz Card Practice</h1>
            <p className="text-green-100 mt-2">Welcome, {user?.name}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!showQuiz ? (
          <FileUpload onUploadComplete={handleUploadComplete} token={token} />
        ) : (
          <QuizCard onBack={handleBackToUpload} token={token} />
        )}
      </main>

      <footer className="bg-[#065F46] text-white py-4 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2026 Quiz Card Practice. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
