"use client";

import { useMemo } from "react";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "default" | "danger" | "text";
}

export default function Button({ children, variant, size = "medium", ...props }: ButtonProps) {
  const classVariant = useMemo(() => {
    if (props.disabled) {
      return `bg-gray-300 text-gray-600 rounded hover:bg-gray-300 transition-colors`;
    }
    
    switch (variant) {
      case "primary":
        return `bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors`;
      case "secondary":
        return `bg-green-500 text-white rounded hover:bg-green-600 transition-colors`;
      case "default":
        return `bg-white text-black rounded hover:bg-gray-300 transition-colors border border-gray-300`;
      case "text":
        return `bg-white text-black rounded hover:bg-gray-300 transition-colors`;
      case "danger":
        return `bg-red-500 text-white rounded hover:bg-red-600 transition-colors`;
      default:
        return `bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors`;
    }
  }, [variant, props.disabled]);
  const classSize = useMemo(() => {
    switch (size) {
      case "small":
        return `px-2 py-1 text-sm`;
      case "medium":
        return `px-4 py-2 text-base`;
      case "large":
        return `px-6 py-3 text-lg`;
      default:
        return `px-4 py-2 text-base`;
    }
  }, [size]);
  return (
    <button {...props} className={`${classVariant} ${classSize} ${props.className}`}>
      {children}
    </button>
  );
}