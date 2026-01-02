import { create } from 'zustand';
import type { VoiceMessage, VoiceProcessResponse, VoiceRecordingState } from '../../../core/domain/voice';
import i18n from '../../../core/i18n/init';
import { processVoiceMessage } from '../api/voiceRepository';

type VoiceState = {
  isOpen: boolean;
  sessionId: string | null;
  messages: VoiceMessage[];
  recordingState: VoiceRecordingState;
  error: string | null;

  setIsOpen: (open: boolean) => void;
  setRecordingState: (state: VoiceRecordingState) => void;
  clear: () => void;
  processMessage: (message: string) => Promise<VoiceProcessResponse>;
};

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  isOpen: false,
  sessionId: null,
  messages: [],
  recordingState: 'idle',
  error: null,

  setIsOpen: (open) => set({ isOpen: open, error: null }),
  setRecordingState: (state) => set({ recordingState: state }),

  clear: () =>
    set({
      sessionId: null,
      messages: [],
      recordingState: 'idle',
      error: null,
    }),

  processMessage: async (message) => {
    const trimmed = String(message ?? '').trim();
    if (!trimmed) {
      return {
        sessionId: get().sessionId ?? `voice_session_${Date.now()}`,
        assistantMessage: '',
      };
    }

    const userMsg: VoiceMessage = {
      id: makeId('usr'),
      role: 'user',
      text: trimmed,
      createdAt: Date.now(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      recordingState: 'processing',
      error: null,
    }));

    try {
      const res = await processVoiceMessage(trimmed, get().sessionId ?? undefined);

      const assistantMsg: VoiceMessage = {
        id: makeId('ast'),
        role: 'assistant',
        text: res.assistantMessage,
        createdAt: Date.now(),
      };

      set((s) => ({
        sessionId: res.sessionId,
        messages: [...s.messages, assistantMsg],
        recordingState: 'idle',
        error: null,
      }));

      return res;
    } catch (e: any) {
      set({
        recordingState: 'error',
        error:
          typeof e?.message === 'string' && e.message.trim()
            ? e.message
            : i18n.t('voice.genericError'),
      });

      const fallback: VoiceProcessResponse = {
        sessionId: get().sessionId ?? `voice_session_${Date.now()}`,
        assistantMessage: i18n.t('voice.assistantFallback'),
      };

      const assistantMsg: VoiceMessage = {
        id: makeId('ast'),
        role: 'assistant',
        text: fallback.assistantMessage,
        createdAt: Date.now(),
      };

      set((s) => ({
        messages: [...s.messages, assistantMsg],
        recordingState: 'idle',
      }));

      return fallback;
    }
  },
}));
