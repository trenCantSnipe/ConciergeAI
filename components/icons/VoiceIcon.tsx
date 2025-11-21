import React from 'react';

const VoiceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path d="M11.25 4.533A9.708 9.708 0 0 0 3.75 12a9.75 9.75 0 0 0 16.5 0 9.708 9.708 0 0 0-7.5-7.467V12a2.25 2.25 0 0 1-2.25 2.25h-1.5A2.25 2.25 0 0 1 9 12V4.533Z" />
    <path
      fillRule="evenodd"
      d="M12 21a8.25 8.25 0 0 0 8.25-8.25c0-2.863-1.44-5.43-3.667-6.936A.75.75 0 0 0 15.75 6.5C17.51 7.761 18.75 9.758 18.75 12a6.75 6.75 0 0 1-13.5 0c0-2.242 1.24-4.239 3-5.5a.75.75 0 0 0-.833-.686C5.69 7.32 4.25 9.887 4.25 12.75A8.25 8.25 0 0 0 12.5 21Z"
      clipRule="evenodd"
    />
  </svg>
);

export default VoiceIcon;