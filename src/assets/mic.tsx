export const Mic = ({isListening, ...props}: {isListening: boolean} & React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d={
          isListening
            ? "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M10 9v6m4-6v6"
            : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        }
      ></path>
    </svg>
  );
};
