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
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: Date;
  completed: boolean;
  notes?: string;
}

export interface HabitCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
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