import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LiveSession, LiveServerMessage } from '@google/genai';
import { ChatMode, Message } from './types';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import ModeSelector from './components/ModeSelector';
import * as geminiService from './services/geminiService';
import TrashIcon from './components/icons/TrashIcon';
import RefreshIcon from './components/icons/RefreshIcon';

const getInitialMessages = (): Message[] => {
  try {
    const savedHistory = localStorage.getItem('concierge-ai-chat-history');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
        return parsedHistory;
      }
    }
  } catch (error) {
    console.error("Failed to load chat history from localStorage", error);
    localStorage.removeItem('concierge-ai-chat-history');
  }
  return [
    {
      id: 'init-welcome',
      role: 'model',
      text: 'Welcome to ConciergeAI. How may I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [chatMode, setChatMode] = useState<ChatMode>(ChatMode.QUICK);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // For Live API transcriptions
  const liveSession = useRef<LiveSession | null>(null);
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');
  const [displayTranscription, setDisplayTranscription] = useState('');

  // Effect to save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('concierge-ai-chat-history', JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat history to localStorage:", error);
    }
  }, [messages]);

  const addMessage = (role: Message['role'], text: string, toolCalls?: any[], toolResponses?: any[]) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const message: Message = { id: Date.now().toString(), role, text, timestamp };
    if (toolCalls) message.toolCalls = toolCalls;
    if (toolResponses) message.toolResponses = toolResponses;
    setMessages((prev) => [...prev, message]);
  };

  const executeMockTools = (functionCalls: any[]): any[] => {
    return functionCalls.map(fc => {
      let responsePayload: any = {};
      switch(fc.name) {
        case 'makeReservation':
          responsePayload = {
            status: "Success",
            reservationId: `RES-${Math.floor(Math.random() * 9000) + 1000}`,
            message: `Mock reservation for ${fc.args.guestName} from ${fc.args.checkInDate} to ${fc.args.checkOutDate} confirmed.`
          };
          break;
        case 'checkAvailability':
          responsePayload = {
            status: "Available",
            availableRooms: Math.floor(Math.random() * 5) + 1,
            message: `Yes, we have rooms available for those dates.`
          };
          break;
        case 'modifyReservation':
          responsePayload = {
            status: "Success",
            reservationId: fc.args.reservationId,
            message: `Reservation ${fc.args.reservationId} has been successfully modified.`
          };
          break;
        case 'cancelReservation':
          responsePayload = {
            status: "Success",
            reservationId: fc.args.reservationId,
            message: `Reservation ${fc.args.reservationId} has been canceled.`
          };
          break;
        default:
          responsePayload = {
            status: "Error",
            message: `Unknown tool call: ${fc.name}`
          };
      }
      return {
        name: fc.name,
        id: fc.id,
        response: responsePayload
      };
    });
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const history = [...messages, userMessage];

    try {
      let response = await geminiService.sendMessage(history, "", chatMode);
      
      let modelMessage: Message = {
        id: `${Date.now()}-model`,
        role: 'model',
        text: response.text || '',
        toolCalls: response.functionCalls,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, modelMessage]);
      history.push(modelMessage);

      if (response.functionCalls && response.functionCalls.length > 0) {
        const toolResponses = executeMockTools(response.functionCalls);
        
        const toolMessage: Message = {
          id: `${Date.now()}-tool`,
          role: 'tool',
          text: `[Tool executed]`, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolResponses: toolResponses,
        };
        
        setMessages(prev => [...prev, toolMessage]);
        history.push(toolMessage);

        response = await geminiService.sendMessage(history, "", chatMode);

        const finalModelMessage: Message = {
          id: `${Date.now()}-final`,
          role: 'model',
          text: response.text || '',
          toolCalls: response.functionCalls,
          groundingMetadata: response.candidates?.[0]?.groundingMetadata,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        
        setMessages(prev => [...prev, finalModelMessage]);
      }

    } catch (error: any) {
      console.error('Error sending message (Detailed):', error);
      
      // Construct a technical error message for the user
      let errorMessage = `Error: ${error.message}`;
      
      if (error instanceof Error) {
        // If we attached location info in the service, it will be in the message already.
        // If not, we can try to infer or just show what we have.
        if (error.message.includes('SAFETY')) {
           errorMessage += '\n(Safety Violation)';
        } else if (error.message.includes('400')) {
           errorMessage += '\n(Bad Request - Check Tool/Prompt Config)';
        }
      }
      
      addMessage('system', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiveMessage = useCallback(async (message: LiveServerMessage) => {
    if (message.serverContent?.outputTranscription) {
      currentOutputTranscription.current += message.serverContent.outputTranscription.text;
    }
    if (message.serverContent?.inputTranscription) {
      currentInputTranscription.current += message.serverContent.inputTranscription.text;
      setDisplayTranscription(`You: ${currentInputTranscription.current}`);
    }
    
    if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
      const toolCalls = message.toolCall.functionCalls;
      addMessage('model', '', toolCalls);
      
      const toolResponses = executeMockTools(toolCalls);
      const toolResponsesToSend = toolResponses.map(tr => ({
         id: tr.id,
         name: tr.name,
         response: tr.response
      }));

      const toolMessageText = `[Tool call executed: ${toolResponses.map(tr => tr.name).join(', ')}]`;
      addMessage('tool', toolMessageText, undefined, toolResponses);

      if (liveSession.current) {
        toolResponsesToSend.forEach(tr => {
          liveSession.current!.sendToolResponse({
            functionResponses: [tr]
          });
        });
      }
    }

    if (message.serverContent?.turnComplete) {
      if (currentInputTranscription.current.trim()) {
        addMessage('user', currentInputTranscription.current.trim());
      }
      if (currentOutputTranscription.current.trim()) {
        addMessage('model', currentOutputTranscription.current.trim());
      }
      currentInputTranscription.current = '';
      currentOutputTranscription.current = '';
      setDisplayTranscription('');
    }

    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (audioData) {
      await geminiService.playAudio(audioData);
    }

    if (message.serverContent?.interrupted) {
      geminiService.stopAudio();
    }
  }, []);

  const handleLiveError = useCallback((error: ErrorEvent) => {
    console.error('Live session error:', error);
    addMessage('system', `Voice Session Error: ${error.message || 'Unknown error in Live API connection'}`);
    setIsRecording(false);
  }, []);

  const handleLiveClose = useCallback((event: CloseEvent) => {
    console.log('Live session closed');
    liveSession.current = null;
    setIsRecording(false);
  }, []);

  const startVoiceSession = useCallback(async () => {
    try {
      const session = await geminiService.connectLiveSession(handleLiveMessage, handleLiveError, handleLiveClose);
      liveSession.current = session;
      setIsRecording(true);
      addMessage('system', 'Voice concierge activated. Start speaking...');
    } catch (error: any) {
      console.error('Failed to start voice session:', error);
      addMessage('system', `Failed to start voice session: ${error.message}`);
      setIsRecording(false);
    }
  }, [handleLiveMessage, handleLiveError, handleLiveClose]);

  const stopVoiceSession = useCallback(async () => {
    if (liveSession.current) {
      await geminiService.closeLiveSession(liveSession.current);
      liveSession.current = null;
      setIsRecording(false);
      addMessage('system', 'Voice concierge deactivated.');
    }
  }, []);

  const handleMicToggle = useCallback(() => {
    if (isRecording) {
      stopVoiceSession();
    } else {
      startVoiceSession();
    }
  }, [isRecording, startVoiceSession, stopVoiceSession]);

  const handleModeChange = (newMode: ChatMode) => {
    if (newMode !== chatMode) {
      setChatMode(newMode);
      if (isRecording) {
        stopVoiceSession();
      }
      const modeName = newMode.charAt(0) + newMode.slice(1).toLowerCase();
      addMessage('system', `Switched to ${modeName} mode.`);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      const initialMsg: Message = {
        id: 'init-welcome',
        role: 'model',
        text: 'Welcome to ConciergeAI. How may I assist you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([initialMsg]);
      localStorage.removeItem('concierge-ai-chat-history');
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (isRecording) {
        stopVoiceSession();
      }
    };
  }, [isRecording, stopVoiceSession]);

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-slate-900">
      <header className="p-4 border-b border-slate-700/50 shadow-md z-10 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <h1 className="text-xl font-bold text-sky-400 tracking-tight">ConciergeAI</h1>
          </div>
          
          <div className="order-3 sm:order-2 w-full sm:w-auto flex justify-center">
             <ModeSelector aria-labelledby="mode-selector-label" currentMode={chatMode} onModeChange={handleModeChange} disabled={isLoading || isRecording} />
          </div>

          <div className="flex items-center gap-2 order-2 sm:order-3">
            <button 
                onClick={handleClearChat}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Clear Chat"
                disabled={isLoading}
            >
                <TrashIcon />
            </button>
            <button 
                onClick={handleRefresh}
                className="p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Refresh App"
            >
                <RefreshIcon />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
          <ChatWindow messages={messages} isLoading={isLoading} liveTranscription={displayTranscription} />
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isRecording={isRecording}
            onMicToggle={handleMicToggle}
            currentMode={chatMode}
          />
        </div>
      </main>
    </div>
  );
};

export default App;