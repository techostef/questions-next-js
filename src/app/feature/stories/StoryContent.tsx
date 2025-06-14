import { Story, StoryPart } from "@/types/story";

interface StoryContentProps {
  selectedStory: Story | null;
  storyParts: StoryPart[];
  selectedPartIndex: number;
  isRecording: boolean;
  storyContentRef: React.RefObject<HTMLDivElement>;
  showResults: boolean;
  getHighlightedText: () => string;
  isFullStoryView?: boolean;
}

export const StoryContent = ({
  selectedStory,
  storyParts,
  selectedPartIndex,
  isRecording,
  storyContentRef,
  showResults,
  getHighlightedText,
  isFullStoryView = false,
}: StoryContentProps) => {
  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">
          {selectedStory?.title}{" "}
          {storyParts.length > 1 && !isFullStoryView && (
            <span className="text-sm font-normal text-gray-500">
              - Part {selectedPartIndex + 1}
            </span>
          )}
          {storyParts.length > 1 && isFullStoryView && (
            <span className="text-sm font-normal text-gray-500">
              - Full Story
            </span>
          )}
        </h3>

        {storyParts.length > 0 && (
          <div className="text-sm text-gray-500">
            {isFullStoryView 
              ? storyParts.reduce((total, part) => total + part.words, 0) 
              : storyParts[selectedPartIndex].words} words
          </div>
        )}
      </div>

      {isRecording && (
        <div className="absolute right-0 top-0">
          <div className="animate-pulse flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium">Recording...</span>
          </div>
        </div>
      )}

      <div
        ref={storyContentRef}
        className={`prose max-w-none p-4 bg-gray-50 rounded-lg overflow-y-auto ${
          isRecording ? "border-2 border-blue-500" : ""
        }`}
        style={{
          maxHeight: "400px",
          whiteSpace: "pre-wrap",
          lineHeight: "1.8",
        }}
      >
        {showResults ? (
          <div dangerouslySetInnerHTML={{ __html: getHighlightedText() }} />
        ) : storyParts.length > 0 ? (
          isFullStoryView ? (
            // Display all parts combined when in full story view
            storyParts.map((part, partIndex) => (
              <div key={`part-${partIndex}`}>
                {part.content.split("\n").map((line, lineIndex) => (
                  <p key={`${partIndex}-${lineIndex}`} className="mb-2">
                    {line}
                  </p>
                ))}
              </div>
            ))
          ) : (
            // Display only the selected part when in parts view
            storyParts[selectedPartIndex].content
              .split("\n")
              .map((line, lineIndex) => (
                <p key={lineIndex} className="mb-2">
                  {line}
                </p>
              ))
          )
        ) : (
          selectedStory?.content.split("\n").map((line, lineIndex) => (
            <p key={lineIndex} className="mb-2">
              {line.split(" ").map((word, wordIndex) => (
                <span
                  key={`${lineIndex}-${wordIndex}`}
                  className="inline-block mr-1"
                >
                  {word}
                </span>
              ))}
            </p>
          ))
        )}
      </div>
    </div>
  );
};
