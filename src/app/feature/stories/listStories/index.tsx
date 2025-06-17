import Button from "@/components/Button";
import Dialog from "@/components/Dialog";
import { Story } from "@/types/story";
import { useEffect, useState } from "react";

interface ListStoriesProps {
  isStoryDialogOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  stories: Story[];
  setSelectedStoryWithCache: (story: Story) => void;
  resetReading: () => void;
  selectedStory: Story | null;
}

export default function ListStories({
  isStoryDialogOpen,
  onClose,
  isLoading,
  stories,
  setSelectedStoryWithCache,
  resetReading,
  selectedStory,
}: ListStoriesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "">("");
  
  // Load cached search term when component mounts
  useEffect(() => {
    const cachedSearch = localStorage.getItem("storycache_search");
    if (cachedSearch) {
      setSearchTerm(cachedSearch);
    }
    
    const cachedSort = localStorage.getItem("storycache_sort") as "asc" | "desc" | "";
    if (cachedSort) {
      setSortOrder(cachedSort);
    }
  }, []);
  
  // Cache search term and sort order when they change
  useEffect(() => {
    localStorage.setItem("storycache_search", searchTerm);
  }, [searchTerm]);
  
  useEffect(() => {
    if (sortOrder) {
      localStorage.setItem("storycache_sort", sortOrder);
    }
  }, [sortOrder]);
  
  // Filter and sort stories
  const filteredAndSortedStories = stories
    .filter(story => 
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.difficulty.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortOrder) return 0;
      
      const difficultyOrder = { "beginner": 1, "intermediate": 2, "advanced": 3 };
      const valueA = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0;
      const valueB = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0;
      
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSortChange = (value: "asc" | "desc" | "") => {
    setSortOrder(value);
  };
  
  return (
    <>
      <Dialog
        isOpen={isStoryDialogOpen}
        onClose={onClose}
        title="Select a Story"
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              variant="danger"
            >
              Close
            </Button>
          </div>
        }
      >
        <div className="mb-4 flex flex-col md:flex-row gap-2 md:items-center">
          <div className="flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search stories..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort by level:</span>
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => handleSortChange(sortOrder === "asc" ? "" : "asc")}
                className={`px-3 py-1 text-sm ${
                  sortOrder === "asc" ? "bg-blue-500 text-white" : "bg-gray-100"
                }`}
              >
                Easiest first
              </button>
              <button
                onClick={() => handleSortChange(sortOrder === "desc" ? "" : "desc")}
                className={`px-3 py-1 text-sm ${
                  sortOrder === "desc" ? "bg-blue-500 text-white" : "bg-gray-100"
                }`}
              >
                Hardest first
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAndSortedStories.length > 0 ? (
            filteredAndSortedStories.map((story) => (
              <div
                key={story.id}
                onClick={() => {
                  setSelectedStoryWithCache(story);
                  resetReading();
                  onClose();
                }}
                className={`relative p-4 flex flex-col border rounded-lg cursor-pointer transition-colors ${
                  selectedStory?.id === story.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <span
                  className={`px-2 py-0.5 rounded capitalize ${
                    story.difficulty === "beginner"
                      ? "bg-green-100 text-green-800"
                      : story.difficulty === "intermediate"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {story.difficulty}
                </span>
                <h3 className="font-medium mt-2 mb-5">{story.title}</h3>
                <div className="text-gray-500 absolute right-5 bottom-2">
                  {story.words} words
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-6 text-gray-500">
              No stories found matching your search.
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
