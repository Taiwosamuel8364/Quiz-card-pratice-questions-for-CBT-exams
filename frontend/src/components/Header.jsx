import { FiBook, FiSettings } from "react-icons/fi";

const Header = () => {
  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiBook className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Quiz Card Practice</h1>
              <p className="text-green-100 text-sm">CBT Exam Preparation</p>
            </div>
          </div>

          <button className="p-2 hover:bg-primary-light rounded-lg transition-colors">
            <FiSettings className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
