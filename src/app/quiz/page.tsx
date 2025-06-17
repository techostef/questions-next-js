"use client";

import AskQuestion from "@/components/AskQuestion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Navigation from "@/components/Navigation";

export default function QuizPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 max-w-3xl">
        <Navigation />
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold ml-1">English Quiz</h1>
          <div className="flex items-center">
            <span className="mr-2">Welcome, {user?.username}</span>
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <AskQuestion />
      </div>
    </ProtectedRoute>
  );
}
