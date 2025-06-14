import { Story, StoryPart } from "@/types/story";

interface ControlStoriesProps {
  isRecording: boolean;
  isReading: boolean;
  setIsAddStoryDialogOpen: (value: boolean) => void;
  setIsStoryDialogOpen: (value: boolean) => void;
  selectedStory: Story | null;
  storyParts: StoryPart[];
  selectedPartIndex: number;
  setPartIndexWithCache: (index: number) => void;
  isFullStoryView: boolean;
  setIsFullStoryView: (value: boolean) => void;
}

const ControlStories = ({
  isRecording,
  isReading,
  setIsAddStoryDialogOpen,
  setIsStoryDialogOpen,
  selectedStory,
  storyParts,
  selectedPartIndex,
  setPartIndexWithCache,
  isFullStoryView,
  setIsFullStoryView,
}: ControlStoriesProps) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Current Story</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsAddStoryDialogOpen(true)}
            className="px-4 py-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 transition-colors"
          >
            Add Story
          </button>
          <button
            onClick={() => {
              if (!isRecording && !isReading) {
                setIsStoryDialogOpen(true);
              }
            }}
            className={`px-4 py-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors ${
              isRecording || isReading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isRecording || isReading}
          >
            Change Story
          </button>
        </div>
      </div>

      {/* Current story card */}
      <div className="p-4 border rounded-lg border-blue-500 bg-blue-50">
        <h3 className="font-medium text-lg">{selectedStory?.title}</h3>
        <div className="flex justify-between mt-2">
          <span
            className={`px-2 py-0.5 rounded ${
              selectedStory?.difficulty === "beginner"
                ? "bg-green-100 text-green-800"
                : selectedStory?.difficulty === "intermediate"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {selectedStory?.difficulty}
          </span>
          <span className="text-gray-500">{selectedStory?.words} words</span>
        </div>

        {/* View mode toggle */}
        {storyParts.length > 1 && (
          <div className="mt-4 border-t pt-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium">Story View</span>
                <div className="flex items-center">
                  <span className={`text-xs ${!isFullStoryView ? "font-medium text-blue-600" : "text-gray-500"}`}>Parts</span>
                  <button 
                    onClick={() => !isRecording && !isReading && setIsFullStoryView(!isFullStoryView)}
                    disabled={isRecording || isReading}
                    className={`relative inline-flex h-5 w-10 mx-2 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                      ${isFullStoryView ? 'bg-blue-500' : 'bg-gray-300'}
                      ${isRecording || isReading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    aria-label={isFullStoryView ? 'Show as parts' : 'Show full story'}
                  >
                    <span
                      className={`${isFullStoryView ? 'translate-x-5' : 'translate-x-0'}
                        pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                  <span className={`text-xs ${isFullStoryView ? "font-medium text-blue-600" : "text-gray-500"}`}>Full</span>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {selectedPartIndex + 1} of {storyParts.length}
              </span>
            </div>

            {!isFullStoryView && (
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setPartIndexWithCache(selectedPartIndex - 1)}
                  disabled={selectedPartIndex === 0 || isRecording || isReading}
                  className={`px-2 py-1 rounded ${
                    selectedPartIndex === 0 || isRecording || isReading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  ← Previous
                </button>

                <div className="flex space-x-1">
                  {storyParts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setPartIndexWithCache(index)}
                      disabled={isRecording || isReading}
                      className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                        selectedPartIndex === index
                          ? "bg-blue-500 text-white"
                          : isRecording || isReading
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPartIndexWithCache(selectedPartIndex + 1)}
                  disabled={
                    selectedPartIndex === storyParts.length - 1 ||
                    isRecording ||
                    isReading
                  }
                  className={`px-2 py-1 rounded ${
                    selectedPartIndex === storyParts.length - 1 ||
                    isRecording ||
                    isReading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlStories;
