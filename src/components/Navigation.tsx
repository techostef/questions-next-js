'use client';
import { useRouter } from "next/navigation";
import Button from "./Button";

const tabs = [
  { name: "Quiz", path: "/quiz" },
  { name: "Listening", path: "/quiz-listening" },
  { name: "Chat", path: "/chat" },
  { name: "Speak", path: "/speak" },
  { name: "Bank English", path: "/bank-english" },
];

export default function Navigation() {
  const router = useRouter();
  return (
    <nav className="mb-6">
      <ul className="flex p-2">
        {tabs.map((tab) => (
          <li className="mr-2" key={tab.path}>
            <Button
              onClick={() => router.push(tab.path)}
              variant="text"
              size="small"
            >
              {tab.name}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

