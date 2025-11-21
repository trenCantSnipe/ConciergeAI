import React, { useEffect, useRef, useState } from 'react';
import { Message as MessageType } from '../types';
import Message from './Message';

interface ChatWindowProps {
  messages: MessageType[];
  isLoading: boolean;
  liveTranscription: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, liveTranscription }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAtBottomRef = useRef(true);
  const SCROLL_THRESHOLD = 100;

  // Auto-scroll when new messages are added, but only if the user is already near the bottom.
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer && isAtBottomRef.current) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isLoading, liveTranscription]);

  // This handler updates scroll state and button visibility whenever the user scrolls.
  const handleScroll = () => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const atBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
      isAtBottomRef.current = atBottom;
      
      const shouldShow = !atBottom;
      if (showScrollButton !== shouldShow) {
        setShowScrollButton(shouldShow);
      }
    }
  };

  // This function smoothly scrolls the view to the bottom when the button is clicked.
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex-1 overflow-hidden relative">
      {/* This visually hidden heading provides an accessible name for the chat log. */}
      <h2 id="chat-history-label" className="sr-only">
        Chat History
      </h2>
      
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4 md:p-6 scroll-smooth"
        role="log"
        aria-live="polite"
        aria-labelledby="chat-history-label" 
      >
        <div className="flex flex-col space-y-6 pb-20">
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start w-full animate-fade-in-up">
              <div className="px-4 py-3 rounded-xl rounded-bl-none bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700/50">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse delay-100"></span>
                  <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse delay-200"></span>
                </div>
                <span className="text-xs text-slate-400 italic">ConciergeAI is thinking...</span>
              </div>
            </div>
          )}

          {liveTranscription && (
            <div className="flex justify-center w-full animate-pulse">
              <div className="px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/50 text-slate-300 text-center self-center italic text-sm backdrop-blur-sm">
                {liveTranscription}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={scrollToBottom}
        aria-label="Scroll to bottom"
        aria-hidden={!showScrollButton}
        tabIndex={showScrollButton ? 0 : -1}
        className={`
          absolute bottom-6 left-1/2 -translate-x-1/2 z-10
          flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg
          bg-sky-600/90 hover:bg-sky-500 backdrop-blur-sm 
          text-white font-medium text-sm
          ring-1 ring-white/10
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500
          transition-all duration-300 ease-in-out
          ${showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" />
        </svg>
        <span>Scroll to bottom</span>
      </button>
    </div>
  );
};

export default ChatWindow;