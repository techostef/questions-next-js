import Button from "@/components/Button";
import { Story, StoryPart } from "@/types/story";
import { useState } from "react";

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
  handleCustomStorySubmission: (userInputText: string) => void;
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
  handleCustomStorySubmission,
}: ControlStoriesProps) => {
  const [userInputText, setUserInputText] = useState("");
  const [isCustomStory, setIsCustomStory] = useState(false);
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Current Story</h2>
        <div className="flex space-x-2">
          <Button
            onClick={() => setIsAddStoryDialogOpen(true)}
            variant="primary"
          >
            Add Story
          </Button>
          <Button
            onClick={() => {
              setIsCustomStory(false);
              if (!isRecording && !isReading) {
                setIsStoryDialogOpen(true);
              }
            }}
            variant="primary"
            disabled={isRecording || isReading}
          >
            Change Story
          </Button>
          <Button
            onClick={() => setIsCustomStory(true)}
            variant="primary"
            disabled={isRecording || isReading}
          >
            Custom Story
          </Button>
        </div>
      </div>

      {/* Current story card */}
      {isCustomStory && (
        <div className="mb-6 p-4 rounded-lg border border-blue-500 bg-blue-50">
          <h4 className="text-md font-medium mb-2">Add to Story</h4>
          <textarea
            value={userInputText}
            onChange={(e) => setUserInputText(e.target.value)}
            placeholder="Type your text to add to the story..."
            className="w-full p-3 rounded-md mb-3 min-h-[100px] bg-white border border-blue-500"
            disabled={isRecording || isReading}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => handleCustomStorySubmission(userInputText)}
              disabled={!userInputText.trim() || isRecording || isReading}
              variant="primary"
            >
              Submit Text
            </Button>
          </div>
        </div>
      )}

      <div className="p-4 rounded-lg border border-blue-500 bg-blue-50">
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
                  <span
                    className={`text-xs ${
                      !isFullStoryView
                        ? "font-medium text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    Parts
                  </span>
                  <button
                    onClick={() =>
                      !isRecording &&
                      !isReading &&
                      setIsFullStoryView(!isFullStoryView)
                    }
                    disabled={isRecording || isReading}
                    className={`relative inline-flex h-5 w-10 mx-2 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                      ${isFullStoryView ? "bg-blue-500" : "bg-gray-300"}
                      ${
                        isRecording || isReading
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    aria-label={
                      isFullStoryView ? "Show as parts" : "Show full story"
                    }
                  >
                    <span
                      className={`${
                        isFullStoryView ? "translate-x-5" : "translate-x-0"
                      }
                        pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                  <span
                    className={`text-xs ${
                      isFullStoryView
                        ? "font-medium text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    Full
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {selectedPartIndex + 1} of {storyParts.length}
              </span>
            </div>

            {!isFullStoryView && (
              <div className="flex justify-between items-center">
                <Button
                  onClick={() => setPartIndexWithCache(selectedPartIndex - 1)}
                  disabled={selectedPartIndex === 0 || isRecording || isReading}
                  variant="primary"
                  size="small"
                >
                  ← Previous
                </Button>

                <div className="flex space-x-1">
                  {storyParts.map((_, index) => (
                    <Button
                      key={index}
                      onClick={() => setPartIndexWithCache(index)}
                      disabled={isRecording || isReading}
                      className="rounded-full"
                      variant="primary"
                      size="small"
                  >
                      {index + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={() => setPartIndexWithCache(selectedPartIndex + 1)}
                  disabled={
                    selectedPartIndex === storyParts.length - 1 ||
                    isRecording ||
                    isReading
                  }
                  variant="primary"
                  size="small"
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlStories;
