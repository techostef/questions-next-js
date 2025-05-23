'use client';
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface TabProps {
  tabs: { name: string; path: string }[];
  basePath?: string;
}

export default function TabNavigation({ tabs, basePath = "" }: TabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>("");

  // Set active tab based on current path
  useEffect(() => {
    const tab = tabs.find(tab => pathname === tab.path);
    if (tab) {
      setActiveTab(tab.path);
    } else {
      // Default to first tab if no match
      setActiveTab(tabs[0].path);
    }
  }, [pathname, tabs]);

  const handleTabClick = (tabPath: string) => {
    setActiveTab(tabPath);
    router.push(`${basePath}${tabPath}`);
  };

  return (
    <div className="mb-6 border-b border-gray-200">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => handleTabClick(tab.path)}
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === tab.path
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>
    </div>
  );
}
