import { getApiClient } from '../../../core/api/axiosClient';
import type { VoiceProcessResponse } from '../../../core/domain/voice';
import i18n from '../../../core/i18n/init';

export async function processVoiceMessage(
  message: string,
  sessionId?: string
): Promise<VoiceProcessResponse> {
  const client = getApiClient();

  try {
    const { data } = await client.post<VoiceProcessResponse>('/voice/process', {
      message,
      sessionId,
    });
    return data;
  } catch {
    // Keep frontend-only + resilient: return a friendly assistant message.
    return {
      sessionId: sessionId ?? `voice_session_${Date.now()}`,
      assistantMessage: i18n.t('voice.assistantFallback'),
    };
  }
}
