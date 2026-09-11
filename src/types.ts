export type ReminderType = 'medicine' | 'water' | 'doctor';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  completed: boolean;
  scheduled_time: string;
  created_at: string;
  completed_at: string | null;
}

export interface GameScore {
  id: string;
  game_type: string;
  score: number;
  moves: number;
  duration_seconds: number;
  played_at: string;
  difficulty_level: number;
  errors: number;
}

export interface CaregiverAlert {
  id: string;
  label: string;
  enabled: boolean;
  created_at: string;
}

export interface CognitiveState {
  id: string;
  level: number;
  adjustment_note: string;
  updated_at: string;
}

export type Screen = 'reminders' | 'games' | 'caregiver';

export type Language = 'en' | 'hi' | 'as';

export type DifficultyLevel = 1 | 2 | 3;
