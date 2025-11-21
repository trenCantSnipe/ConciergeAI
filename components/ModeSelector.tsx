import React from 'react';
import { ChatMode } from '../types';
import SparkleIcon from './icons/SparkleIcon';
import ThinkingIcon from './icons/ThinkingIcon';
import VoiceIcon from './icons/VoiceIcon';

interface ModeSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled: boolean;
}

const modes = [
  { id: ChatMode.QUICK, label: 'Quick', icon: SparkleIcon },
  { id: ChatMode.DETAILED, label: 'Detailed', icon: ThinkingIcon },
  { id: ChatMode.VOICE, label: 'Voice', icon: VoiceIcon },
];

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange, disabled, ...props }) => {
  return (
    <div className="flex justify-center p-1.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
      <div {...props} role="radiogroup" className="flex items-center space-x-1">
        {modes.map((mode) => (
          <button
            key={mode.id}
            role="radio"
            aria-checked={currentMode === mode.id}
            onClick={() => onModeChange(mode.id)}
            disabled={disabled}
            className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
              ${
                currentMode === mode.id
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <mode.icon />
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;