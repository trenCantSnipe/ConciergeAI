import React from 'react';

const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path
      fillRule="evenodd"
      d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h5.75a.75.75 0 0 0 .75-.75v-5.75a.75.75 0 0 0-1.5 0v3.183l-1.9-1.9A9 9 0 0 0 3.207 9.649a.75.75 0 0 0 1.548.41Zm-1.548 3.882a.75.75 0 0 0-1.548.41 9 9 0 0 0 15.248 4.664l1.903-1.903v3.183a.75.75 0 0 0 1.5 0v-5.75a.75.75 0 0 0-.75-.75h-5.75a.75.75 0 0 0 0 1.5h3.183l-1.903 1.903a7.5 7.5 0 0 1-11.883-3.213Z"
      clipRule="evenodd"
    />
  </svg>
);

export default RefreshIcon;