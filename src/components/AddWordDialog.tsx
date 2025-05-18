import React, { useState } from 'react';
import styles from './AddWordDialog.module.css';

interface AddWordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (words: string[]) => Promise<void>;
  isLoading?: boolean;
}

export default function AddWordDialog({ isOpen, onClose, onSubmit, isLoading: externalLoading }: AddWordDialogProps) {
  const [inputText, setInputText] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use either external loading state (if provided) or internal loading state
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Split by commas, newlines, or spaces and trim each word
    const words = inputText
      .split(/[,\n\s]+/)
      .map(word => word.trim())
      .filter(word => word.length > 0);
    
    // Validate word count
    if (words.length === 0) {
      setError('Please enter at least one word');
      return;
    }
    
    if (words.length > 5) {
      setError('Maximum 5 words allowed');
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
      setInputText('');
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add words');
    } finally {
      if (externalLoading === undefined) {
        setInternalLoading(false);
      }
    }
  };
  
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>Add New Words</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.content}>
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
              className={styles.textarea}
            ></textarea>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.info}>
              <p>
                <strong>Note:</strong> This will query OpenAI to get detailed information about each 
                word and add them to your dictionary.
              </p>
            </div>
          </div>
          
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? 'Processing...' : 'Add Words'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
