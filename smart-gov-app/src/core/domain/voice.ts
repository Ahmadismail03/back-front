export type VoiceAction =
  | {
      type: 'navigate';
      screen: string;
      params?: unknown;
    }
  | undefined;

export type VoiceProcessRequest = {
  message: string;
  sessionId?: string;
};

export type VoiceProcessResponse = {
  sessionId: string;
  assistantMessage: string;
  action?: Exclude<VoiceAction, undefined>;
};

export type VoiceMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
};

export type VoiceRecordingState = 'idle' | 'listening' | 'processing' | 'playing' | 'error';
