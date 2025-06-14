import { Story } from "@/types/story";
import Dialog from "@/components/Dialog";
import { Dispatch, SetStateAction, useState } from "react";

interface AddStoriesProps {
  isAddStoryDialogOpen: boolean;
  onCloseAddStoryDialog: () => void;
  setStories: Dispatch<SetStateAction<Story[]>>;
  setSelectedStoryWithCache: (story: Story) => void;
}

const AddStories = (props: AddStoriesProps) => {
  const { isAddStoryDialogOpen, onCloseAddStoryDialog, setStories, setSelectedStoryWithCache } = props;
  const [newStory, setNewStory] = useState<Partial<Story>>({
    id: `story-${Date.now()}`,
    title: "",
    content: "",
    difficulty: "beginner",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Handle adding a new story
  const handleAddStory = async () => {
    // Validate form
    if (!newStory.title || !newStory.content) {
      setSubmitMessage({
        type: "error",
        text: "Please fill in all required fields",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Create a complete story object
      const storyToAdd: Story = {
        id: newStory.id || `story-${Date.now()}`,
        title: newStory.title,
        content: newStory.content,
        difficulty: newStory.difficulty || "beginner",
        words: newStory.content.split(/\s+/).filter((word) => word.length > 0)
          .length,
      };

      // Send to API
      const response = await fetch("/api/stories/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ story: storyToAdd }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - add to local stories and select it
        setStories((prevStories) => [...prevStories, storyToAdd]);
        setSelectedStoryWithCache(storyToAdd);

        // Reset form
        setNewStory({
          id: `story-${Date.now()}`,
          title: "",
          content: "",
          difficulty: "beginner",
        });

        setSubmitMessage({
          type: "success",
          text: "Story added successfully!",
        });

        // Close dialog after a delay
        setTimeout(() => {
          onCloseAddStoryDialog();
          setSubmitMessage(null);
        }, 1500);
      } else {
        // Error
        setSubmitMessage({
          type: "error",
          text: data.error || "Failed to add story",
        });
      }
    } catch (error) {
      console.error("Error adding story:", error);
      setSubmitMessage({
        type: "error",
        text: "An error occurred while adding the story",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      {/* Add Story Dialog */}
      <Dialog
        isOpen={isAddStoryDialogOpen}
        onClose={onCloseAddStoryDialog}
        title="Add New Story"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-between w-full">
            <div>
              {submitMessage && (
                <div
                  className={`text-sm ${
                    submitMessage.type === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onCloseAddStoryDialog}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStory}
                disabled={isSubmitting || !newStory.title || !newStory.content}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                  isSubmitting || !newStory.title || !newStory.content
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isSubmitting ? "Saving..." : "Save Story"}
              </button>
            </div>
          </div>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleAddStory();
          }}
        >
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newStory.title}
              onChange={(e) =>
                setNewStory({ ...newStory, title: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label
              htmlFor="difficulty"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Difficulty
            </label>
            <select
              id="difficulty"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newStory.difficulty}
              onChange={(e) =>
                setNewStory({
                  ...newStory,
                  difficulty: e.target.value as
                    | "beginner"
                    | "intermediate"
                    | "advanced",
                })
              }
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Content
            </label>
            <textarea
              id="content"
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newStory.content}
              onChange={(e) =>
                setNewStory({ ...newStory, content: e.target.value })
              }
              placeholder="Enter your story text here. Use blank lines to separate paragraphs."
              required
            />
          </div>

          <div className="text-sm text-gray-500">
            <p>
              Word count:{" "}
              {newStory.content?.split(/\s+/).filter((word) => word.length > 0)
                .length || 0}{" "}
              words
            </p>
            <p>
              Paragraphs:{" "}
              {newStory.content
                ?.split(/\n\s*\n/)
                .filter((p) => p.trim().length > 0).length || 0}
            </p>
          </div>
        </form>
      </Dialog>
    </>
  );
};

export default AddStories;
