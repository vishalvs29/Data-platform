export type MoodType = 'great' | 'good' | 'okay' | 'sad' | 'stressed';

export interface MoodEntry {
  id: string;
  mood: MoodType;
  note?: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  mood?: MoodType;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  type: 'breathing' | 'meditation' | 'mindfulness' | 'physical';
  icon: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'crisis' | 'support' | 'article' | 'video';
  url?: string;
  phone?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  birthdate?: string;
  weight_kg?: number;
  height_cm?: number;
}

export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent';

export interface SleepSession {
  id: string;
  user_id: string;
  date: string;
  hours: number;
  quality: SleepQuality;
  notes?: string;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  date: string;
  duration_minutes: number;
  activity?: string;
  notes?: string;
  created_at: string;
}
