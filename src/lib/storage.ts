export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export const STORAGE_KEYS = {
  lang: 'sahayata_lang',
  reminders: 'sahayata_reminders',
  bestScore: 'sahayata_best_score',
  difficulty: 'sahayata_difficulty',
  lastSynced: 'sahayata_last_synced',
} as const;
