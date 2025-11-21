import React from 'react';

const ThinkingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path
      fillRule="evenodd"
      d="M8.25 5.25a3 3 0 0 1 3-3h1.5a3 3 0 0 1 3 3v.75A3.75 3.75 0 0 1 19.5 9.75v4.5a3.75 3.75 0 0 1-3.75 3.75h-1.5a3 3 0 0 1-3-3v-.75a3.75 3.75 0 0 1-3.75-3.75v-4.5ZM11.25 6v.75a2.25 2.25 0 0 0 2.25 2.25h1.5a2.25 2.25 0 0 0 2.25-2.25V6a1.5 1.5 0 0 0-1.5-1.5h-3a1.5 1.5 0 0 0-1.5 1.5Zm-2.25 9v-.75a2.25 2.25 0 0 1 2.25-2.25h1.5a2.25 2.25 0 0 1 2.25 2.25v.75a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5Z"
      clipRule="evenodd"
    />
  </svg>
);

export default ThinkingIcon;