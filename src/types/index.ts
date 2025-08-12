export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  tags: string[];
  sourceText?: string; // Original text that generated this todo
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tldr?: string; // AI-generated summary
  actionPoints: string[]; // AI-extracted action items
  createdAt: Date;
  updatedAt: Date;
  isNew?: boolean; // For highlighting new notes
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  category: string;
  goal?: number; // Target streak or weekly/monthly count
  streak: number;
  lastCompleted?: Date;
  createdAt: Date;
  color?: string; // For visualization
  reminders?: HabitReminder[]; // NEW: Reminder settings
  isTemplate?: boolean; // NEW: Whether this is a template habit
  templateCategory?: string; // NEW: Template category
  analytics?: HabitAnalytics; // NEW: Analytics data
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: Date;
  completed: boolean;
  notes?: string;
  mood?: 1 | 2 | 3 | 4 | 5; // NEW: Mood tracking 1-5 scale
  effort?: 1 | 2 | 3 | 4 | 5; // NEW: Effort level 1-5 scale
}

export interface HabitCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string; // NEW: Category description
}

export interface LLMProvider {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model?: string;
}

export interface Settings {
  llmProvider: LLMProvider;
  availableProviders: LLMProvider[];
}

export interface DashboardWidget {
  id: string;
  type: 'todos' | 'notes' | 'habits' | 'stats' | 'quickAdd';
  position: { x: number; y: number };
  size: { width: number; height: number };
  enabled: boolean;
  title?: string;
  config?: Record<string, any>;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number;
  rowHeight: number;
}

export type TabType = 'dashboard' | 'todos' | 'notes' | 'habits' | 'settings';

// NEW: Habit reminder interface
export interface HabitReminder {
  id: string;
  habitId: string;
  time: string; // HH:MM format
  days: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
  message?: string;
}

// NEW: Habit template interface
export interface HabitTemplate {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  category: string;
  templateCategory: 'popular' | 'health' | 'productivity' | 'mindfulness' | 'fitness' | 'learning';
  goal?: number;
  color?: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  benefits: string[];
  tips: string[];
}

// NEW: Advanced analytics interface
export interface HabitAnalytics {
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // percentage
  averageMood?: number;
  averageEffort?: number;
  weeklyCompletions: number[];
  monthlyCompletions: number[];
  bestDay: string; // day of week with highest completion rate
  missedDays: number;
  consistency: number; // score 0-100
}

// NEW: Habit insights interface
export interface HabitInsight {
  id: string;
  type: 'streak' | 'completion' | 'consistency' | 'mood' | 'recommendation';
  title: string;
  description: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
  actionable?: boolean;
  suggestion?: string;
}

// NEW: Export data interface
export interface HabitExportData {
  habits: Habit[];
  habitLogs: HabitLog[];
  habitCategories: HabitCategory[];
  exportDate: Date;
  version: string;
} 