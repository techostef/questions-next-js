"use client";

import React from "react";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  id?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[] | Array<{ value: string | number; label: string }>;
  disabled?: boolean;
  className?: string;
  title?: string;
}

const Select = (props: SelectProps) => {
  const className =
    "appearance-none relative w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className={` ${props.className ? props.className : ""} relative inline-block`}>
      <select
        id={props.id}
        name={props.name}
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        title={props.title}
        required={props.required}
        className={className}
      >
        {props.placeholder && (
          <option value="" disabled>
            {props.placeholder}
          </option>
        )}
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
          <path d="M5.516 7.548L10 12.032l4.484-4.484z" />
        </svg>
      </div>
    </div>
  );
};

export default Select;
