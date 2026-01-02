import { getMockApiClient } from '../../../core/api/axiosClient';
import type { HelpTopic } from '../../../core/domain/helpTopic';

export async function searchHelpTopics(query: string): Promise<HelpTopic[]> {
  // TODO(backend): Replace with real API endpoint.
  const res = await getMockApiClient().get<HelpTopic[]>('/help/search', { params: { q: query } });
  return res.data;
}

export async function getHelpTopic(topicId: string): Promise<HelpTopic> {
  // TODO(backend): Replace with real API endpoint.
  const res = await getMockApiClient().get<HelpTopic>(`/help/${topicId}`);
  return res.data;
}

export async function emailHelpTopic(topicId: string): Promise<void> {
  // TODO(backend): Replace with real API endpoint.
  await getMockApiClient().post(`/help/${topicId}/email`);
}
