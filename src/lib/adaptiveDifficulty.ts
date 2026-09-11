import { supabase } from '@/lib/supabase';
import type { CognitiveState, GameScore, DifficultyLevel } from '@/types';

export interface DifficultyConfig {
  level: DifficultyLevel;
  pairs: number;
  labelKey: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  1: { level: 1, pairs: 3, labelKey: 'levelEasy' },
  2: { level: 2, pairs: 4, labelKey: 'levelMedium' },
  3: { level: 3, pairs: 6, labelKey: 'levelChallenging' },
};

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [1, 2, 3];

export async function getCognitiveState(): Promise<CognitiveState | null> {
  const { data } = await supabase
    .from('cognitive_state')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as CognitiveState) || null;
}

export async function initCognitiveState(): Promise<CognitiveState> {
  const existing = await getCognitiveState();
  if (existing) return existing;

  const { data } = await supabase
    .from('cognitive_state')
    .insert({ level: 1, adjustment_note: 'Starting at Easy level' })
    .select('*')
    .maybeSingle();

  return (data as CognitiveState) || { id: '', level: 1, adjustment_note: 'Starting at Easy level', updated_at: new Date().toISOString() };
}

export async function updateCognitiveState(level: DifficultyLevel, note: string): Promise<void> {
  const existing = await getCognitiveState();
  if (existing) {
    await supabase
      .from('cognitive_state')
      .update({ level, adjustment_note: note, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('cognitive_state')
      .insert({ level, adjustment_note: note });
  }
}

interface AdaptiveResult {
  newLevel: DifficultyLevel;
  note: string;
  changed: boolean;
}

export async function evaluateAdaptiveDifficulty(): Promise<AdaptiveResult> {
  const state = await initCognitiveState();
  const currentLevel = state.level as DifficultyLevel;

  const { data } = await supabase
    .from('game_scores')
    .select('*')
    .eq('game_type', 'memory_match')
    .order('played_at', { ascending: false })
    .limit(1);

  const recentGames = (data as GameScore[]) || [];

  if (recentGames.length === 0) {
    return { newLevel: currentLevel, note: state.adjustment_note, changed: false };
  }

  const lastGame = recentGames[0];
  const shouldUpgrade = lastGame.moves <= 8 && currentLevel < 3;
  const shouldDowngrade = (lastGame.moves > 15 || lastGame.duration_seconds > 90) && currentLevel > 1;

  if (shouldUpgrade) {
    const newLevel = (currentLevel + 1) as DifficultyLevel;
    const note = `Level increased to ${DIFFICULTY_CONFIGS[newLevel].labelKey === 'levelEasy' ? 'Easy' : DIFFICULTY_CONFIGS[newLevel].labelKey === 'levelMedium' ? 'Medium' : 'Challenging'} based on strong recent performance`;
    await updateCognitiveState(newLevel, note);
    return { newLevel, note, changed: true };
  }

  if (shouldDowngrade) {
    const newLevel = (currentLevel - 1) as DifficultyLevel;
    const note = `Level adjusted to ${DIFFICULTY_CONFIGS[newLevel].labelKey === 'levelEasy' ? 'Easy' : DIFFICULTY_CONFIGS[newLevel].labelKey === 'levelMedium' ? 'Medium' : 'Challenging'} based on recent completion time`;
    await updateCognitiveState(newLevel, note);
    return { newLevel, note, changed: true };
  }

  return { newLevel: currentLevel, note: state.adjustment_note, changed: false };
}
