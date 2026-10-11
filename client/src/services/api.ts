import { HealthStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function checkApiHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { ok: false, aiConfigured: false };
    return (await res.json()) as HealthStatus;
  } catch {
    return { ok: false, aiConfigured: false };
  }
}

export interface IdentificationResponse {
  name: string;
  scientificName: string;
  category: string;
  rarity: string;
  confidence: string;
  description: string;
  facts: string[];
  modelUsed?: string;
  isAiGenerated?: boolean;
  aiGenerationReason?: string;
  error?: string;
}

export async function identifySpecimen(
  file: File,
  coords?: { latitude: number; longitude: number },
  theme?: string,
  model?: string
): Promise<IdentificationResponse> {
  const form = new FormData();
  form.append('image', file);
  if (coords) {
    form.append('latitude', String(coords.latitude));
    form.append('longitude', String(coords.longitude));
  }
  if (theme) {
    form.append('theme', theme);
  }
  if (model) {
    form.append('model', model);
  }

  const response = await fetch(`${API_BASE}/api/identify`, {
    method: 'POST',
    body: form,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Identification failed. Please try another image.');
  }

  return data as IdentificationResponse;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ChatResponse {
  ok: boolean;
  reply: string;
  modelUsed?: string;
}

export async function askNaturalistChat(params: {
  specimenName: string;
  category: string;
  scientificName?: string;
  description?: string;
  message: string;
  history?: ChatMessage[];
  model?: string;
}): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'The Field Naturalist could not respond. Please try again.');
  }
  return data as ChatResponse;
}

export async function shareCardToApi(card: unknown): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/cards/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[API Share Card Warning]:', err);
    return false;
  }
}

export async function fetchSharedCardFromApi(cardId: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/api/cards/${encodeURIComponent(cardId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.card || null;
  } catch (err) {
    console.warn('[API Fetch Card Warning]:', err);
    return null;
  }
}
