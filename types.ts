
export interface Lesson {
  id: string;
  title: string;
  description: string;
  content?: string; // Markdown content
  sources?: { title: string; uri: string }[]; // Search Grounding sources
  videos?: { title: string; videoId: string }[]; // YouTube videos
  images?: { title: string; url: string }[]; // Educational images from Google
  isCompleted: boolean;
  duration: string;
  userRating?: number; // 1-5 stars
  deadline?: string; // ISO string for deadline
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  author: string;
  category: string;
  rating: number;
  students: number;
  modules: Module[];
  progress: number; // 0-100
  isGenerated?: boolean;
  status: 'published' | 'draft';
  visibility: 'public' | 'private';
  isCreatedByUser?: boolean;
}

export interface User {
  name: string;
  avatar: string;
  streak: number;
  points: number;
  xpToday: number;
  dailyGoal: number;
  streakStatus: ('active' | 'completed' | 'missed' | 'frozen')[]; // Last 7 days status
  authDetails?: AuthUser;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  token?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'deadline' | 'achievement' | 'reminder';
  courseId?: string;
}

export interface VerificationResult {
  status: 'ACCURATE' | 'PARTIALLY_ACCURATE' | 'INACCURATE';
  analysis: string;
  suggestedCorrections?: string;
  sources: { title: string; uri: string }[];
}

export type Tab = 'home' | 'search' | 'create' | 'chat' | 'settings';

export type Language = 'vi' | 'en';
