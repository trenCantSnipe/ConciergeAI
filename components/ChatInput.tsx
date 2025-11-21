import React, { useState, useRef } from 'react';
import SendIcon from './icons/SendIcon';
import MicIcon from './icons/MicIcon';
import { ChatMode } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  onMicToggle: () => void;
  currentMode: ChatMode;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  isRecording,
  onMicToggle,
  currentMode
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isVoiceMode = currentMode === ChatMode.VOICE;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pb-4 md:px-6 md:pb-6 bg-slate-900 pt-2">
      <div className="relative flex items-end p-2 bg-slate-800 rounded-2xl shadow-lg border border-slate-700/50 ring-1 ring-black/5">
        <label htmlFor="chat-input" className="sr-only">
          {isVoiceMode ? "Voice Concierge is active..." : "Ask ConciergeAI..."}
        </label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={isVoiceMode ? "Voice Concierge is active..." : "Ask ConciergeAI..."}
          disabled={isLoading || isVoiceMode}
          rows={1}
          className="flex-1 bg-transparent resize-none focus:outline-none placeholder-slate-500 text-slate-200 py-3 px-2 max-h-32 overflow-y-auto"
        />
        {isVoiceMode ? (
          <button
            onClick={onMicToggle}
            className={`p-3 rounded-xl transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500/20 text-red-500 animate-pulse ring-2 ring-red-500/50' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <MicIcon isRecording={isRecording} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="p-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-sky-600 text-white hover:bg-sky-500 disabled:bg-slate-700/50 disabled:text-slate-500"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;