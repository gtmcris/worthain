import { Timestamp } from 'firebase/firestore';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  premium?: boolean;
  premiumSince?: Timestamp;
  goal?: {
    dailyWords: number;
  };
  stats?: {
    totalWords: number;
    masteredWords: number;
    streak: number;
    lastActivity: Timestamp;
    dailyWordsGoal: number;
    dailyWordsCompleted: number;
    dailyGoalResetAt: Timestamp;
    streakLastActivityDayKey?: string;
    streakTimeZone?: string;
  };
}

export interface Vocabulary {
  id?: string;
  userId: string;
  term: string;
  translation: string;
  meaning: string;
  level: CEFRLevel;
  grammar: {
    genus?: 'maskulin' | 'feminin' | 'neutrum';
    type?: string;
    plural?: string;
  };
  exampleSentences: { de: string; en: string }[];
  frequency: number;
  frequencyContext?: string;
  relatedWords: { term: string; translation: string }[];
  similarWords: string[];
  wordFamily: { term: string; translation: string }[];
  status: 'learning' | 'mastered' | 'favorite';
  mastery: number; // 0-100
  nextReview?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}

export interface PracticeLog {
  id?: string;
  userId: string;
  vocabId: string;
  result: 'easy' | 'good' | 'hard' | 'again';
  timestamp: Timestamp;
}
