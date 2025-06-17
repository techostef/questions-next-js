"use client";

interface InputProps {
  id?: string;
  name?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  readOnly?: boolean;
}

const Input = ({ type = 'text', ...props }: InputProps) => {
  const className = 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  return (
    <input
      type={type}
      {...props}
      className={`${props.className} ${className}`}
    />
  );
};

export default Input;
