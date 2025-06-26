import { Todo, Note, Habit, HabitLog, HabitCategory } from '../types';

class IndexedDBService {
  private dbName = 'listonthego-db';
  private dbVersion = 2; // Incremented for habit stores
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create todos store
        if (!db.objectStoreNames.contains('todos')) {
          const todosStore = db.createObjectStore('todos', { keyPath: 'id' });
          todosStore.createIndex('completed', 'completed', { unique: false });
          todosStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create notes store
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          notesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Create habits store
        if (!db.objectStoreNames.contains('habits')) {
          const habitsStore = db.createObjectStore('habits', { keyPath: 'id' });
          habitsStore.createIndex('category', 'category', { unique: false });
          habitsStore.createIndex('frequency', 'frequency', { unique: false });
          habitsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create habitLogs store
        if (!db.objectStoreNames.contains('habitLogs')) {
          const habitLogsStore = db.createObjectStore('habitLogs', { keyPath: 'id' });
          habitLogsStore.createIndex('habitId', 'habitId', { unique: false });
          habitLogsStore.createIndex('date', 'date', { unique: false });
          habitLogsStore.createIndex('completed', 'completed', { unique: false });
        }

        // Create habitCategories store
        if (!db.objectStoreNames.contains('habitCategories')) {
          db.createObjectStore('habitCategories', { keyPath: 'id' });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Todo operations
  async getAllTodos(): Promise<Todo[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['todos'], 'readonly');
      const store = transaction.objectStore('todos');
      const request = store.getAll();

      request.onsuccess = () => {
        const todos = request.result.map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
          // Add default values for new fields if they don't exist
          priority: todo.priority || 'medium',
          tags: todo.tags || [],
          category: todo.category || undefined,
        }));
        resolve(todos);
      };

      request.onerror = () => {
        reject(new Error('Failed to fetch todos'));
      };
    });
  }

  async saveTodo(todo: Todo): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['todos'], 'readwrite');
      const store = transaction.objectStore('todos');
      const request = store.put(todo);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save todo'));
    });
  }

  async saveTodos(todos: Todo[]): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['todos'], 'readwrite');
      const store = transaction.objectStore('todos');
      
      let completed = 0;
      const total = todos.length;

      if (total === 0) {
        resolve();
        return;
      }

      todos.forEach(todo => {
        const request = store.put(todo);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => {
          reject(new Error('Failed to save todos'));
        };
      });
    });
  }

  async deleteTodo(id: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['todos'], 'readwrite');
      const store = transaction.objectStore('todos');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete todo'));
    });
  }

  // Note operations
  async getAllNotes(): Promise<Note[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.getAll();

      request.onsuccess = () => {
        const notes = request.result.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
        // Sort by updatedAt descending (newest first)
        notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        resolve(notes);
      };

      request.onerror = () => {
        reject(new Error('Failed to fetch notes'));
      };
    });
  }

  async saveNote(note: Note): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.put(note);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save note'));
    });
  }

  async deleteNote(id: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete note'));
    });
  }

  // Habit operations
  async getAllHabits(): Promise<Habit[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['habits'], 'readonly');
      const store = transaction.objectStore('habits');
      const request = store.getAll();

      request.onsuccess = () => {
        const habits = request.result.map((habit: any) => ({
          ...habit,
          createdAt: new Date(habit.createdAt),
          lastCompleted: habit.lastCompleted ? new Date(habit.lastCompleted) : undefined,
        }));
        // Sort by createdAt descending (newest first)
        habits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        resolve(habits);
      };

      request.onerror = () => {
        reject(new Error('Failed to fetch habits'));
      };
    });
  }

  async saveHabit(habit: Habit): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['habits'], 'readwrite');
      const store = transaction.objectStore('habits');
      const request = store.put(habit);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save habit'));
    });
  }

  async deleteHabit(id: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['habits', 'habitLogs'], 'readwrite');
      const habitsStore = transaction.objectStore('habits');
      const logsStore = transaction.objectStore('habitLogs');
      
      // Delete the habit
      habitsStore.delete(id);
      
      // Delete all related logs
      const index = logsStore.index('habitId');
      const range = IDBKeyRange.only(id);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to delete habit'));
    });
  }

  // Habit Log operations
  async getAllHabitLogs(): Promise<HabitLog[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['habitLogs'], 'readonly');
      const store = transaction.objectStore('habitLogs');
      const request = store.getAll();

      request.onsuccess = () => {
        const logs = request.result.map((log: any) => ({
          ...log,
          date: new Date(log.date),
        }));
        resolve(logs);
      };

      request.onerror = () => {
        reject(new Error('Failed to fetch habit logs'));
      };
    });
  }

  async saveHabitLog(log: HabitLog): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['habitLogs'], 'readwrite');
      const store = transaction.objectStore('habitLogs');
      const request = store.put(log);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save habit log'));
    });
  }

  async deleteHabitLog(id: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['habitLogs'], 'readwrite');
      const store = transaction.objectStore('habitLogs');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete habit log'));
    });
  }

  async getHabitLogsByHabitId(habitId: string): Promise<HabitLog[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['habitLogs'], 'readonly');
      const store = transaction.objectStore('habitLogs');
      const index = store.index('habitId');
      const request = index.getAll(habitId);

      request.onsuccess = () => {
        const logs = request.result.map((log: any) => ({
          ...log,
          date: new Date(log.date),
        }));
        resolve(logs);
      };

      request.onerror = () => {
        reject(new Error('Failed to fetch habit logs'));
      };
    });
  }

  // Habit Category operations
  async getAllHabitCategories(): Promise<HabitCategory[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['habitCategories'], 'readonly');
      const store = transaction.objectStore('habitCategories');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to fetch habit categories'));
      };
    });
  }

  async saveHabitCategory(category: HabitCategory): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['habitCategories'], 'readwrite');
      const store = transaction.objectStore('habitCategories');
      const request = store.put(category);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save habit category'));
    });
  }

  async saveHabitCategories(categories: HabitCategory[]): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['habitCategories'], 'readwrite');
      const store = transaction.objectStore('habitCategories');
      
      let completed = 0;
      const total = categories.length;

      if (total === 0) {
        resolve();
        return;
      }

      categories.forEach(category => {
        const request = store.put(category);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => {
          reject(new Error('Failed to save habit categories'));
        };
      });
    });
  }

  // Settings operations
  async getSetting(key: string): Promise<any> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get setting: ${key}`));
      };
    });
  }

  async setSetting(key: string, value: any): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to set setting: ${key}`));
    });
  }

  // Migration from localStorage
  async migrateFromLocalStorage(): Promise<void> {
    try {
      // Migrate todos
      const savedTodos = localStorage.getItem('listonthego-todos');
      if (savedTodos) {
        const parsedTodos = JSON.parse(savedTodos).map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
          // Add default values for new fields if they don't exist
          priority: todo.priority || 'medium',
          tags: todo.tags || [],
          category: todo.category || undefined,
        }));
        await this.saveTodos(parsedTodos);
        localStorage.removeItem('listonthego-todos');
      }

      // Migrate notes
      const savedNotes = localStorage.getItem('listonthego-notes');
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
        
        for (const note of parsedNotes) {
          await this.saveNote(note);
        }
        localStorage.removeItem('listonthego-notes');
      }

      // Migrate LLM provider
      const savedProvider = localStorage.getItem('listonthego-llm-provider');
      if (savedProvider) {
        const parsedProvider = JSON.parse(savedProvider);
        await this.setSetting('llm-provider', parsedProvider);
        localStorage.removeItem('listonthego-llm-provider');
      }

      // Migrate habits
      const savedHabits = localStorage.getItem('habits');
      if (savedHabits) {
        const parsedHabits = JSON.parse(savedHabits).map((habit: any) => ({
          ...habit,
          createdAt: new Date(habit.createdAt),
          lastCompleted: habit.lastCompleted ? new Date(habit.lastCompleted) : undefined,
        }));
        
        for (const habit of parsedHabits) {
          await this.saveHabit(habit);
        }
        localStorage.removeItem('habits');
      }

      // Migrate habit logs
      const savedHabitLogs = localStorage.getItem('habitLogs');
      if (savedHabitLogs) {
        const parsedLogs = JSON.parse(savedHabitLogs).map((log: any) => ({
          ...log,
          date: new Date(log.date),
        }));
        
        for (const log of parsedLogs) {
          await this.saveHabitLog(log);
        }
        localStorage.removeItem('habitLogs');
      }

      // Migrate habit categories
      const savedCategories = localStorage.getItem('habitCategories');
      if (savedCategories) {
        const parsedCategories = JSON.parse(savedCategories);
        await this.saveHabitCategories(parsedCategories);
        localStorage.removeItem('habitCategories');
      }

      console.log('Successfully migrated data from localStorage to IndexedDB');
    } catch (error) {
      console.error('Failed to migrate data from localStorage:', error);
    }
  }

  // Clear all data (useful for testing or reset)
  async clearAllData(): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['todos', 'notes', 'habits', 'habitLogs', 'habitCategories', 'settings'], 'readwrite');
      
      const todosStore = transaction.objectStore('todos');
      const notesStore = transaction.objectStore('notes');
      const habitsStore = transaction.objectStore('habits');
      const habitLogsStore = transaction.objectStore('habitLogs');
      const habitCategoriesStore = transaction.objectStore('habitCategories');
      const settingsStore = transaction.objectStore('settings');
      
      todosStore.clear();
      notesStore.clear();
      habitsStore.clear();
      habitLogsStore.clear();
      habitCategoriesStore.clear();
      settingsStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear data'));
    });
  }

  // Debug utilities
  async getDBStats(): Promise<{ todos: number; notes: number; habits: number; habitLogs: number; habitCategories: number; settings: number }> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['todos', 'notes', 'habits', 'habitLogs', 'habitCategories', 'settings'], 'readonly');
      
      const todosStore = transaction.objectStore('todos');
      const notesStore = transaction.objectStore('notes');
      const habitsStore = transaction.objectStore('habits');
      const habitLogsStore = transaction.objectStore('habitLogs');
      const habitCategoriesStore = transaction.objectStore('habitCategories');
      const settingsStore = transaction.objectStore('settings');
      
      const todoCountRequest = todosStore.count();
      const noteCountRequest = notesStore.count();
      const habitCountRequest = habitsStore.count();
      const habitLogCountRequest = habitLogsStore.count();
      const habitCategoryCountRequest = habitCategoriesStore.count();
      const settingCountRequest = settingsStore.count();
      
      let completed = 0;
      const results = { todos: 0, notes: 0, habits: 0, habitLogs: 0, habitCategories: 0, settings: 0 };
      
      todoCountRequest.onsuccess = () => {
        results.todos = todoCountRequest.result;
        completed++;
        if (completed === 6) resolve(results);
      };
      
      noteCountRequest.onsuccess = () => {
        results.notes = noteCountRequest.result;
        completed++;
        if (completed === 6) resolve(results);
      };
      
      habitCountRequest.onsuccess = () => {
        results.habits = habitCountRequest.result;
        completed++;
        if (completed === 6) resolve(results);
      };
      
      habitLogCountRequest.onsuccess = () => {
        results.habitLogs = habitLogCountRequest.result;
        completed++;
        if (completed === 6) resolve(results);
      };
      
      habitCategoryCountRequest.onsuccess = () => {
        results.habitCategories = habitCategoryCountRequest.result;
        completed++;
        if (completed === 6) resolve(results);
      };
      
      settingCountRequest.onsuccess = () => {
        results.settings = settingCountRequest.result;
        completed++;
        if (completed === 6) resolve(results);
      };
      
      transaction.onerror = () => reject(new Error('Failed to get stats'));
    });
  }
}

// Create a singleton instance
export const indexedDBService = new IndexedDBService();

// Add debug utilities to window for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).indexedDBService = indexedDBService;
  (window as any).getDBStats = () => indexedDBService.getDBStats();
  (window as any).clearDB = () => indexedDBService.clearAllData();
}

export default indexedDBService; 