import React from 'react';

const SparkleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path
      fillRule="evenodd"
      d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.846.813l2.846-.813a.75.75 0 0 1 .976.976l-.813 2.846a3.75 3.75 0 0 0-.813 2.846l.813 2.846a.75.75 0 0 1-.721.544H12a.75.75 0 0 1-.721-.544l-.813-2.846a3.75 3.75 0 0 0-2.846-.813l-2.846.813A.75.75 0 0 1 3.75 15V12a.75.75 0 0 1 .75-.75h2.25Z"
      clipRule="evenodd"
    />
    <path d="M12 1.5a.75.75 0 0 1 .75.75V3a.75.75 0 0 1-1.5 0V2.25A.75.75 0 0 1 12 1.5ZM5.636 5.636a.75.75 0 0 1 1.06 0l1.5 1.5a.75.75 0 1 1-1.06 1.06l-1.5-1.5a.75.75 0 0 1 0-1.06Zm11.668 0a.75.75 0 0 1 0 1.06l-1.5 1.5a.75.75 0 1 1-1.06-1.06l1.5-1.5a.75.75 0 0 1 1.06 0Z" />
  </svg>
);

export default SparkleIcon;