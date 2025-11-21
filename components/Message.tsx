import React from 'react';
import { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isTool = message.role === 'tool';
  
  const baseClasses = 'px-4 py-3 rounded-xl max-w-xl lg:max-w-3xl whitespace-pre-wrap break-words';
  const userClasses = 'bg-sky-600 text-white self-end rounded-br-none shadow-md';
  const modelClasses = 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 self-start rounded-bl-none border border-slate-700/50 shadow-md';
  const systemClasses = 'bg-transparent text-slate-500 text-center text-xs self-center italic px-4 py-2';
  const toolClasses = 'bg-slate-800 border border-slate-600 text-slate-300 self-start rounded-lg text-sm w-full max-w-2xl shadow-inner';

  const timestampClasses = isUser ? 'text-sky-200' : 'text-slate-400';

  const getContainerClasses = () => {
    if (isSystem) return 'flex justify-center w-full';
    if (isUser) return 'flex justify-end w-full';
    return 'flex justify-start w-full';
  };

  const getMessageClasses = () => {
    if (isSystem) return systemClasses;
    if (isUser) return `${baseClasses} ${userClasses}`;
    if (isTool) return `${baseClasses} ${toolClasses}`;
    return `${baseClasses} ${modelClasses}`;
  };

  const renderToolCall = (toolCall: any, index: number) => (
    <div key={`call-${index}`} className="p-3 bg-slate-900/50 rounded-lg mt-2 border border-slate-700">
      <p className="font-semibold text-sky-400 text-xs uppercase tracking-wider mb-1">Tool Call: {toolCall.name}</p>
      <pre className="text-xs text-slate-400 overflow-x-auto bg-slate-900 p-2 rounded font-mono">
        {JSON.stringify(toolCall.args, null, 2)}
      </pre>
    </div>
  );

  const renderToolResponse = (toolResponse: any, index: number) => (
    <div key={`resp-${index}`} className="p-3 bg-slate-900/50 rounded-lg mt-2 border border-green-900/30">
      <p className="font-semibold text-green-400 text-xs uppercase tracking-wider mb-1">Tool Response: {toolResponse.name}</p>
      <pre className="text-xs text-slate-400 overflow-x-auto bg-slate-900 p-2 rounded font-mono">
        {JSON.stringify(toolResponse.response, null, 2)}
      </pre>
    </div>
  );

  const renderGroundingSources = (metadata: any) => {
    if (!metadata || !metadata.groundingChunks || metadata.groundingChunks.length === 0) return null;
    
    // Filter for web chunks that have a URI and Title
    const sources = metadata.groundingChunks
      .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any, index: number) => ({
        uri: chunk.web.uri,
        title: chunk.web.title,
        index: index + 1
      }));

    if (sources.length === 0) return null;

    return (
      <div className="mt-4 pt-3 border-t border-slate-600/30">
        <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center">
          <span className="mr-1">Sources</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {sources.map((source: any, i: number) => (
            <a 
              key={i}
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-2 px-2 py-1.5 bg-slate-900/60 hover:bg-slate-800 rounded-md border border-slate-700/50 hover:border-sky-500/30 transition-all duration-200 max-w-xs"
            >
              <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center bg-slate-800 group-hover:bg-sky-900/30 rounded-full text-[10px] text-slate-400 group-hover:text-sky-400 border border-slate-600 group-hover:border-sky-500/30 transition-colors">
                {source.index}
              </span>
              <div className="flex flex-col overflow-hidden">
                 <span className="text-xs text-sky-300 font-medium truncate group-hover:text-sky-200 transition-colors">{source.title}</span>
                 <span className="text-[10px] text-slate-500 truncate">{new URL(source.uri).hostname}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={getContainerClasses()}>
      <div className={getMessageClasses()}>
        <div>{message.text}</div>
        {message.toolCalls && message.toolCalls.map((tc, i) => renderToolCall(tc, i))}
        {message.toolResponses && message.toolResponses.map((tr, i) => renderToolResponse(tr, i))}
        
        {message.groundingMetadata && renderGroundingSources(message.groundingMetadata)}

        {(!isSystem && !isTool && message.timestamp) && (
          <div className={`text-right text-xs ${timestampClasses} mt-1.5 opacity-70`}>
            {message.timestamp}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;