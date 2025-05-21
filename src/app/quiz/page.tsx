"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Quiz from "@/components/Quiz";
import AskQuestion, { AskQuestionMethods } from "@/components/AskQuestion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Navigation from "@/components/Navigation";
import type { QuizData } from "@/components/type";

export default function QuizPage() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const askQuestionRef = useRef<AskQuestionMethods>(null);

  // If not authenticated, redirect to login page
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleQuizSubmit = (data: QuizData) => {
    setQuizData(data);
  };

  // Show nothing while checking authentication
  if (!isAuthenticated) {
    return null;
  }

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

        {/* Navigation Menu */}

        <AskQuestion onSuccess={handleQuizSubmit} ref={askQuestionRef} />
        {quizData && <Quiz quizData={quizData} />}
      </div>
    </ProtectedRoute>
  );
}
