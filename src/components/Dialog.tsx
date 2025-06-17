import { ReactNode, useEffect, useRef } from "react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  footer?: ReactNode;
}

/**
 * Reusable Dialog component
 */
export default function Dialog({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-4xl",
  showCloseButton = true,
  footer,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Control dialog open/close and disable body scrolling when dialog is open
  useEffect(() => {
    if (dialogRef.current) {
      if (isOpen) {
        // Disable scrolling on the body
        document.body.style.overflow = 'hidden';
        // Open the dialog
        dialogRef.current.showModal();
      } else {
        // Close the dialog
        dialogRef.current.close();
        // Re-enable scrolling on the body after a small delay to prevent flash
        setTimeout(() => {
          document.body.style.overflow = '';
        }, 100);
      }
    }
    
    // Cleanup function to ensure scrolling is re-enabled if component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={`w-full h-full ${maxWidth} p-0 rounded-lg shadow-xl backdrop:bg-opacity-50 m-auto overflow-x-hidden`}
      onClose={onClose}
    >
      <div className="flex flex-col h-full overflow-x-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close dialog"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">{children}</div>

        {/* Footer */}
        {footer && <div className="p-6 border-t border-gray-200">{footer}</div>}
      </div>
    </dialog>
  );
}
