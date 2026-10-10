export type ThemeType = 'nature' | 'enchanted' | 'cosmic' | 'pokedex';

export type RarityType = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Discovery';

export interface Discovery {
  id: string;
  name: string;
  scientificName?: string;
  category: string;
  rarity: RarityType | string;
  confidence?: string;
  description: string;
  facts: string[];
  image: string; // Persistent base64 Data URL
  date: string;
  location?: string;
  coordinates?: { latitude: number; longitude: number };
  weather?: string;
  theme: string;
  modelUsed?: string;
  isAiGenerated?: boolean;
  aiGenerationReason?: string;
  userId?: string;
  syncedToCloud?: boolean;
}

export interface HealthStatus {
  ok: boolean;
  app?: string;
  aiConfigured: boolean;
  model?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  explorerLevel: number;
  explorerXp: number;
  stepsWalked: number;
  distanceMeters: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetType: 'distance' | 'steps' | 'category' | 'discovery';
  targetValue: number | string;
  currentValue: number;
  completed: boolean;
  rewardXp: number;
  badgeName?: string;
}

export interface RadarSpecimen {
  id: number | string;
  commonName: string;
  scientificName: string;
  category: string;
  distanceMeters: number;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  observedOn?: string;
}
