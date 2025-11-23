import { GoogleGenAI, FunctionDeclaration, Type, Chat, LiveSession, LiveServerMessage, Modality, Content, Part, Blob } from '@google/genai';
import { ChatMode, Message } from '../types';
import { encode, decode, decodeAudioData } from '../utils/audio';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are "ConciergeAI" — the hotel’s intelligent receptionist and operations manager.

RESPONSIBILITIES:
- Check-in/out guests, manage reservations, upsell room upgrades and F&B, coordinate housekeeping.
- Use Google Search to find real-time local information (restaurants, attractions, events, chauffeur services).
- Proactively remind staff and guests of scheduled events, check-in times, and special requests.
- Provide immediate, clear confirmations for every state-changing request.

PRINCIPLES:
1. Confirm intent before irreversible actions.
2. Be concise and professional. Use friendly, formal tone for guests.
3. Respect privacy: never reveal private PII unless the caller is authenticated.
4. Fail safely: if uncertain or outside permissions, ask for human override.

TOOL USE:
- Use "Google Search" to find external local information, recommendations, or services (e.g., "Find Italian restaurants nearby", "Book a chauffeur").
- Use hotel operation tools (makeReservation, etc.) for internal hotel booking management.
- You can combine information from search to help users make decisions before booking.`;

const makeReservation: FunctionDeclaration = {
  name: 'makeReservation',
  parameters: {
    type: Type.OBJECT,
    description: 'Creates a new hotel reservation for a guest.',
    properties: {
      guestName: { type: Type.STRING, description: "Guest's full name." },
      checkInDate: { type: Type.STRING, description: 'Check-in date in YYYY-MM-DD format.' },
      checkOutDate: { type: Type.STRING, description: 'Check-out date in YYYY-MM-DD format.' },
      roomType: { type: Type.STRING, description: 'e.g., "Queen", "King", "Suite".' },
    },
    required: ['guestName', 'checkInDate', 'checkOutDate', 'roomType'],
  },
};

const checkAvailability: FunctionDeclaration = {
  name: 'checkAvailability',
  parameters: {
    type: Type.OBJECT,
    description: 'Checks for room availability.',
    properties: {
      checkInDate: { type: Type.STRING, description: 'Check-in date in YYYY-MM-DD format.' },
      checkOutDate: { type: Type.STRING, description: 'Check-out date in YYYY-MM-DD format.' },
      roomType: { type: Type.STRING, description: 'e.g., "Queen", "King", "Suite". Optional.' },
      guests: { type: Type.NUMBER, description: 'Number of guests. Optional.' },
    },
    required: ['checkInDate', 'checkOutDate'],
  },
};

const modifyReservation: FunctionDeclaration = {
  name: 'modifyReservation',
  parameters: {
    type: Type.OBJECT,
    description: 'Modifies an existing hotel reservation.',
    properties: {
      reservationId: { type: Type.STRING, description: "The ID of the reservation to modify." },
      guestName: { type: Type.STRING, description: "Guest's new full name. Optional." },
      checkInDate: { type: Type.STRING, description: 'New check-in date in YYYY-MM-DD format. Optional.' },
      checkOutDate: { type: Type.STRING, description: 'New check-out date in YYYY-MM-DD format. Optional.' },
      roomType: { type: Type.STRING, description: 'New room type. Optional.' },
    },
    required: ['reservationId'],
  },
};

const cancelReservation: FunctionDeclaration = {
  name: 'cancelReservation',
  parameters: {
    type: Type.OBJECT,
    description: 'Cancels an existing hotel reservation.',
    properties: {
      reservationId: { type: Type.STRING, description: "The ID of the reservation to cancel." },
      guestName: { type: Type.STRING, description: "Guest's full name for verification. Optional." }
    },
    required: ['reservationId'],
  },
};

// Define tools as separate objects to avoid serialization errors
const tools = [
  { googleSearch: {} },
  { functionDeclarations: [makeReservation, checkAvailability, modifyReservation, cancelReservation] }
];

const getModelForMode = (mode: ChatMode) => {
  switch (mode) {
    case ChatMode.QUICK:
      return 'gemini-2.5-flash';
    case ChatMode.DETAILED:
      return 'gemini-3-pro-preview';
    default:
      return 'gemini-2.5-flash';
  }
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendMessage = async (history: Message[], newMessage: string, mode: ChatMode) => {
  // Format history for the API
  const contents: Content[] = history
    .filter(msg => msg.role === 'user' || msg.role === 'model' || msg.role === 'tool')
    .map(msg => {
      const parts: Part[] = [];
      if (msg.role === 'tool') {
        if (msg.toolResponses) {
          msg.toolResponses.forEach(fr => {
            // Explicitly construct valid FunctionResponse object
            const functionResponse: any = {
              name: fr.name,
              response: fr.response,
            };
            if (fr.id) {
               functionResponse.id = fr.id;
            }
            parts.push({ functionResponse });
          });
        }
      } else {
        if (msg.text) {
          parts.push({ text: msg.text });
        }
        if (msg.role === 'model' && msg.toolCalls) {
          msg.toolCalls.forEach(fc => {
             // Explicitly construct valid FunctionCall object
             const functionCall: any = {
                name: fc.name,
                args: fc.args,
             };
             if (fc.id) {
                functionCall.id = fc.id;
             }
             parts.push({ functionCall });
          });
        }
      }

      return {
        role: (msg.role === 'tool' ? 'user' : msg.role) as 'user' | 'model',
        parts: parts,
      };
    }).filter(c => c.parts.length > 0);

  // Add the new user message if provided
  if (newMessage && newMessage.trim()) {
    contents.push({
      role: 'user',
      parts: [{ text: newMessage }],
    });
  }

  const config: {
    systemInstruction: string;
    tools?: any;
    thinkingConfig?: any;
  } = {
    systemInstruction: systemInstruction,
  };

  // Add tools (including search) to both modes
  config.tools = tools;
  
  if (mode === ChatMode.DETAILED) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  let currentAttempt = 0;
  const maxAttempts = 3;
  
  while (true) {
    try {
      currentAttempt++;
      const response = await ai.models.generateContent({
        model: getModelForMode(mode),
        contents: contents,
        config: config,
      });
      return response;
    } catch (error: any) {
      // Retry on 5xx (Server Errors) and 429 (Too Many Requests)
      const isRetryable = error.status === 503 || error.status === 500 || error.status === 429 || 
                          (error.message && (error.message.includes('503') || error.message.includes('500') || error.message.includes('429')));
      
      if (isRetryable && currentAttempt < maxAttempts) {
        // Exponential backoff: 1000ms, 2000ms
        const delay = 1000 * Math.pow(2, currentAttempt - 1);
        console.warn(`Gemini API Error (${error.status || error.message}). Retrying in ${delay}ms...`);
        await wait(delay);
        continue;
      }
      
      throw error;
    }
  }
};

// --- Live API ---

let inputAudioContext: AudioContext;
let outputAudioContext: AudioContext;
let scriptProcessor: ScriptProcessorNode;
let mediaStream: MediaStream;

const createBlob = (data: Float32Array): Blob => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
};

export const connectLiveSession = (
  onMessage: (message: LiveServerMessage) => Promise<void>,
  onError: (error: ErrorEvent) => void,
  onClose: (event: CloseEvent) => void
): Promise<LiveSession> => {

  if (!outputAudioContext) {
    outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: async () => {
        if (!mediaStream || mediaStream.getAudioTracks().every(t => t.readyState === 'ended')) {
          mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        if (!inputAudioContext || inputAudioContext.state === 'closed') {
           inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        }

        const source = inputAudioContext.createMediaStreamSource(mediaStream);
        scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: onMessage,
      onerror: onError,
      onclose: onClose,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: systemInstruction,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      tools: tools
    },
  });

  return sessionPromise;
};

export const closeLiveSession = async (session: LiveSession | null) => {
  if (session) {
    session.close();
  }
  if (scriptProcessor) {
    scriptProcessor.disconnect();
  }
  if (inputAudioContext && inputAudioContext.state !== 'closed') {
    await inputAudioContext.close();
  }
  mediaStream?.getTracks().forEach(track => track.stop());
};

let nextStartTime = 0;
const sources = new Set<AudioBufferSourceNode>();

export const playAudio = async (base64EncodedAudioString: string) => {
  if (!outputAudioContext) {
    outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  if(outputAudioContext.state === 'suspended') {
    await outputAudioContext.resume();
  }

  nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
  const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outputAudioContext, 24000, 1);

  const source = outputAudioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(outputAudioContext.destination);

  source.addEventListener('ended', () => {
    sources.delete(source);
  });

  source.start(nextStartTime);
  nextStartTime += audioBuffer.duration;
  sources.add(source);
};

export const stopAudio = () => {
  for (const source of sources.values()) {
    source.stop();
    sources.delete(source);
  }
  nextStartTime = 0;
};