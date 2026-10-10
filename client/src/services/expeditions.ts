import { Quest } from '../types';

const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest-vista',
    title: 'Horizon Watcher',
    description: 'Capture a scenic view, sunset, mountain, or landscape vista.',
    icon: '🌅',
    targetType: 'category',
    targetValue: 'Landscape/Vista',
    currentValue: 0,
    completed: false,
    rewardXp: 150,
    badgeName: 'Golden Horizon',
  },
  {
    id: 'quest-water',
    title: 'Aqua Trek',
    description: 'Photograph a waterfall, stream, lake, or garden water feature.',
    icon: '🌊',
    targetType: 'category',
    targetValue: 'Waterscape',
    currentValue: 0,
    completed: false,
    rewardXp: 150,
    badgeName: 'River Walker',
  },
  {
    id: 'quest-flora',
    title: 'Botanical Survey',
    description: 'Find and log any wildflower, garden plant, or ancient tree.',
    icon: '🌿',
    targetType: 'category',
    targetValue: 'Flora',
    currentValue: 0,
    completed: false,
    rewardXp: 100,
    badgeName: 'Green Thumb',
  },
  {
    id: 'quest-winged',
    title: 'Winged Wanderer',
    description: 'Spot an insect, pollinator, or bird in their natural habitat.',
    icon: '🦋',
    targetType: 'category',
    targetValue: 'Insect',
    currentValue: 0,
    completed: false,
    rewardXp: 120,
    badgeName: 'Sky Watcher',
  },
  {
    id: 'quest-distance',
    title: 'Trail Scout (250m)',
    description: 'Walk 250 meters outside while exploring your surroundings.',
    icon: '🧭',
    targetType: 'distance',
    targetValue: 250,
    currentValue: 0,
    completed: false,
    rewardXp: 120,
    badgeName: 'Trailblazer',
  },
];

const LOCAL_STORAGE_QUESTS_KEY = 'jungledex_quests';
const LOCAL_STORAGE_EXPEDITION_KEY = 'jungledex_expedition_stats';

export interface ExpeditionStats {
  distanceMeters: number;
  estimatedSteps: number;
  totalXp: number;
  level: number;
  unlockedBadges: string[];
}

export function getStoredExpeditionStats(): ExpeditionStats {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EXPEDITION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    distanceMeters: 0,
    estimatedSteps: 0,
    totalXp: 0,
    level: 1,
    unlockedBadges: [],
  };
}

export function saveExpeditionStats(stats: ExpeditionStats) {
  try {
    localStorage.setItem(LOCAL_STORAGE_EXPEDITION_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function getStoredQuests(): Quest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_QUESTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return INITIAL_QUESTS;
}

export function saveQuests(quests: Quest[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_QUESTS_KEY, JSON.stringify(quests));
  } catch {
    // ignore
  }
}

export function calculateLevel(xp: number): { level: number; title: string; nextLevelXp: number } {
  if (xp >= 2000) return { level: 5, title: 'Master Naturalist', nextLevelXp: 5000 };
  if (xp >= 1000) return { level: 4, title: 'Wilderness Ranger', nextLevelXp: 2000 };
  if (xp >= 500) return { level: 3, title: 'Field Biologist', nextLevelXp: 1000 };
  if (xp >= 200) return { level: 2, title: 'Trail Scout', nextLevelXp: 500 };
  return { level: 1, title: 'Novice Forager', nextLevelXp: 200 };
}

// Distance calculation between GPS points (Haversine)
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
