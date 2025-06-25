import React, { useState } from "react";
import { DEFAULT_CHAT_MODEL } from "@/constants/listModelsOpenAI";
import ModelSelector from "./ModelSelector";
import Dialog from "./Dialog";
import Button from "./Button";

interface AddWordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (words: string[]) => Promise<void>;
  isLoading?: boolean;
  setSelectedModel: (model: string) => void;
}

export default function AddWordDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading: externalLoading,
  setSelectedModel,
}: AddWordDialogProps) {
  const [inputText, setInputText] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use either external loading state (if provided) or internal loading state
  const isLoading =
    externalLoading !== undefined ? externalLoading : internalLoading;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Split by commas, newlines, or spaces and trim each word
    const words = inputText
      .split(/[,\n\s]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 0);

    // Validate word count
    if (words.length === 0) {
      setError("Please enter at least one word");
      return;
    }

    if (words.length > 5) {
      setError("Maximum 5 words allowed");
      return;
    }

    // Only set internal loading if external loading is not provided
    if (externalLoading === undefined) {
      setInternalLoading(true);
    }
    setError(null);

    try {
      await onSubmit(words);
      // Clear form on success
      setInputText("");
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add words");
    } finally {
      if (externalLoading === undefined) {
        setInternalLoading(false);
      }
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Words"
      maxWidth="max-w-2xl"
      showCloseButton={true}
      footer={
        <div className="flex w-full">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            variant="primary"
          >
            {isLoading ? "Processing..." : "Add Words"}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="ml-auto"
            variant="danger"
          >
            Cancel
          </Button>
        </div>
      }
    >
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <ModelSelector
          type="chat"
          defaultModel={DEFAULT_CHAT_MODEL}
          onChange={setSelectedModel}
          showFullList={false}
          pageName="bank-english"
        />
      </div>

      <form id="add-word-form">
        <div className="overflow-y-auto">
          <label htmlFor="words">
            Enter up to 5 words (separated by commas, spaces, or new lines):
          </label>
          <textarea
            id="words"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            rows={5}
            placeholder="e.g. accomplish, determined, resilient"
            className="w-full p-2 border border-gray-300 rounded"
          ></textarea>

          {error && <div className="text-red-500 mt-2">{error}</div>}

          <div className="mt-4">
            <p>
              <strong>Note:</strong> This will query OpenAI to get detailed
              information about each word and add them to your dictionary.
            </p>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
