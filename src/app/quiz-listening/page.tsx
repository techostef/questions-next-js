"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Navigation from "@/components/Navigation";
import AskListeningQuestion from "@/components/AskListeningQuestion";
import Button from "@/components/Button";

export default function QuizListeningPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 max-w-3xl">
        <Navigation />
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold ml-1">English Listening Quiz</h1>
          <div className="flex items-center">
            <span className="mr-2">Welcome, {user?.username}</span>
            <Button
              onClick={logout}
              variant="danger"
              size="small"
            >
              Logout
            </Button>
          </div>
        </div>

        <AskListeningQuestion />
      </div>
    </ProtectedRoute>
  );
}
