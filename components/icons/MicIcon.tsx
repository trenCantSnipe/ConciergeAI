import React from 'react';

interface MicIconProps extends React.SVGProps<SVGSVGElement> {
  isRecording?: boolean;
}

const MicIcon: React.FC<MicIconProps> = ({ isRecording = false, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-6 h-6 ${isRecording ? 'text-red-500' : 'text-slate-400'}`}
  >
    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Zm-1 11.975V15a4 4 0 0 0 4 4h0a4 4 0 0 1-4 0Z" />
    <path d="M12 19a1 1 0 0 1-1-1v-2a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1Z" />
    <path fillRule="evenodd" d="M12 22a1 1 0 0 1-1-1v-2a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1Z" clipRule="evenodd" />
     <path d="M6.25 10a.75.75 0 0 1 1.5 0 4.25 4.25 0 0 0 8.5 0 .75.75 0 0 1 1.5 0 5.75 5.75 0 0 1-11.5 0Z" />
  </svg>
);

export default MicIcon;