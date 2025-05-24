"use client";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export default function Button({ children, ...props }: ButtonProps) {
  return (
    <button {...props} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
      {children}
    </button>
  );
}