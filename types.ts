export enum ChatMode {
  QUICK = 'QUICK',
  DETAILED = 'DETAILED',
  VOICE = 'VOICE',
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system' | 'tool';
  text: string;
  timestamp: string;
  toolCalls?: any[];
  toolResponses?: any[];
  groundingMetadata?: any;
}