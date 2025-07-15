"use client";

interface TextAreaProps {
  id?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  className?: string;
  readOnly?: boolean;
  rows?: number;
}

const TextArea = ({ rows = 4, ...props }: TextAreaProps) => {
  const className = 'w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  return (
    <textarea
      rows={rows}
      {...props}
      className={`${props.className} ${className}`}
    />
  );
};

export default TextArea;
