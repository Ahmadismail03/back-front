import { env } from '../../config/env.js';

export type RasaResponse = {
  intent?: { name: string; confidence?: number };
  responseText?: string;
  entities?: Record<string, unknown>[];
};

export async function sendToRasa(opts: {
  senderId: string;
  message: string;
}): Promise<RasaResponse> {
  const url = `${env.RASA_BASE_URL.replace(/\/$/, '')}/webhooks/rest/webhook`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: opts.senderId, message: opts.message })
  });
  if (!res.ok) {
    throw new Error(`Rasa request failed: ${res.status} ${await res.text()}`);
  }
  // Rasa REST webhook returns an array of messages
  const arr = (await res.json()) as Array<{ text?: string;[k: string]: unknown }>;
  const combinedText = arr.map((m) => m.text).filter(Boolean).join('\n');
  return { responseText: combinedText };
}

export type RasaParseResult = {
  name: string;
  confidence: number;
};

export async function parseIntent(text: string): Promise<RasaParseResult> {
  const url = `${env.RASA_BASE_URL.replace(/\/$/, '')}/model/parse`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    throw new Error(`Rasa parse failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();

  return {
    name: data.intent?.name ?? 'unknown',
    confidence: data.intent?.confidence ?? 0
  };
}