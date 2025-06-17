'use client';
import { useRouter } from "next/navigation";

export default function Navigation() {
  const router = useRouter();
  return (
    <nav className="bg-gray-100 rounded-lg mb-6">
      <ul className="flex p-2">
        <li className="mr-6">
          <button
            onClick={() => router.push("/quiz")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Quiz
          </button>
        </li>
        <li className="mr-6">
          <button
            onClick={() => router.push("/quiz-listening")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Listening
          </button>
        </li>
        <li className="mr-6">
          <button
            onClick={() => router.push("/chat")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Chat
          </button>
        </li>
        <li className="mr-6">
          <button
            onClick={() => router.push("/speak")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Speak
          </button>
        </li>
        <li className="mr-6">
          <button
            onClick={() => router.push("/bank-english")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Bank English
          </button>
        </li>
      </ul>
    </nav>
  );
}
