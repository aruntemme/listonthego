import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardTab from './components/tabs/DashboardTab';
import TodoTab from './components/tabs/TodoTab';
import NotesTab from './components/tabs/NotesTab';
import HabitTab from './components/tabs/HabitTab';
import SettingsTab from './components/tabs/SettingsTab';
import { LLMService } from './services/llmService';
import { indexedDBService } from './services/indexedDBService';
import { Todo, Note, TabType, LLMProvider } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize LLM provider
  const [llmProvider, setLlmProvider] = useState<LLMProvider>({
    name: 'Local LLM',
    baseUrl: 'http://localhost:8091/v1',
    model: 'gemma3:4b-q4_k_m',
  });

  const [llmService, setLlmService] = useState<LLMService>(
    new LLMService(llmProvider)
  );

  // Initialize IndexedDB and load data on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await indexedDBService.init();
        
        // Migrate data from localStorage if it exists
        await indexedDBService.migrateFromLocalStorage();
        
        // Load data from IndexedDB
        const [loadedTodos, loadedNotes, savedProvider] = await Promise.all([
          indexedDBService.getAllTodos(),
          indexedDBService.getAllNotes(),
          indexedDBService.getSetting('llm-provider')
        ]);

        setTodos(loadedTodos);
        setNotes(loadedNotes);
        
        if (savedProvider) {
          setLlmProvider(savedProvider);
          setLlmService(new LLMService(savedProvider));
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true); // Still allow app to work without persistence
      }
    };

    initializeApp();
  }, []);

  // Save LLM provider setting to IndexedDB when it changes
  useEffect(() => {
    if (isInitialized) {
      indexedDBService.setSetting('llm-provider', llmProvider).catch(error => {
        console.error('Failed to save LLM provider:', error);
      });
    }
  }, [llmProvider, isInitialized]);

  // Todo handlers
  const handleAddTodos = async (newTodos: Todo[]) => {
    setTodos(prev => [...prev, ...newTodos]);
    
    if (isInitialized) {
      try {
        await indexedDBService.saveTodos(newTodos);
      } catch (error) {
        console.error('Failed to save todos:', error);
      }
    }
  };

  const handleToggleTodo = async (todoId: string) => {
    const updatedTodo = todos.find(todo => todo.id === todoId);
    if (!updatedTodo) return;

    const toggledTodo = { ...updatedTodo, completed: !updatedTodo.completed };
    
    setTodos(prev =>
      prev.map(todo =>
        todo.id === todoId ? toggledTodo : todo
      )
    );

    if (isInitialized) {
      try {
        await indexedDBService.saveTodo(toggledTodo);
      } catch (error) {
        console.error('Failed to update todo:', error);
      }
    }
  };

  const handleUpdateTodo = async (todoId: string, updates: Partial<Todo>) => {
    const existingTodo = todos.find(todo => todo.id === todoId);
    if (!existingTodo) return;

    const updatedTodo = { ...existingTodo, ...updates };
    
    setTodos(prev =>
      prev.map(todo =>
        todo.id === todoId ? updatedTodo : todo
      )
    );

    if (isInitialized) {
      try {
        await indexedDBService.saveTodo(updatedTodo);
      } catch (error) {
        console.error('Failed to update todo:', error);
      }
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== todoId));
    
    if (isInitialized) {
      try {
        await indexedDBService.deleteTodo(todoId);
      } catch (error) {
        console.error('Failed to delete todo:', error);
      }
    }
  };

  // Note handlers
  const handleAddNote = async (note: Note) => {
    setNotes(prev => [note, ...prev]);
    
    if (isInitialized) {
      try {
        await indexedDBService.saveNote(note);
      } catch (error) {
        console.error('Failed to save note:', error);
      }
    }
  };

  const handleUpdateNote = async (updatedNote: Note) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === updatedNote.id ? updatedNote : note
      )
    );

    if (isInitialized) {
      try {
        await indexedDBService.saveNote(updatedNote);
      } catch (error) {
        console.error('Failed to update note:', error);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    
    if (isInitialized) {
      try {
        await indexedDBService.deleteNote(noteId);
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  // LLM provider handler
  const handleProviderChange = (newProvider: LLMProvider) => {
    setLlmProvider(newProvider);
    setLlmService(new LLMService(newProvider));
  };

  // Note selection handler for dashboard
  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            todos={todos}
            notes={notes}
            onToggleTodo={handleToggleTodo}
            onNavigateToTab={setActiveTab}
            onSelectNote={handleSelectNote}
          />
        );
      case 'todos':
        return (
          <TodoTab
            todos={todos}
            onAddTodos={handleAddTodos}
            onToggleTodo={handleToggleTodo}
            onUpdateTodo={handleUpdateTodo}
            onDeleteTodo={handleDeleteTodo}
            llmService={llmService}
          />
        );
      case 'notes':
        return (
          <NotesTab
            notes={notes}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onAddTodos={handleAddTodos}
            llmService={llmService}
          />
        );
      case 'habits':
        return <HabitTab />;
      case 'settings':
        return (
          <SettingsTab
            currentProvider={llmProvider}
            onProviderChange={handleProviderChange}
          />
        );
      default:
        return null;
    }
  };

  // Show loading state while initializing IndexedDB
  if (!isInitialized) {
    return (
      <div className="flex h-screen bg-white text-gray-900 items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight mb-2">ListOnTheGo</h1>
          <p className="text-gray-500">Initializing app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-gray-900">
      {/* Custom drag region for title bar */}
      <div data-tauri-drag-region className="drag-region"></div>
      
      <div className="app-content flex w-full">
        {/* Sidebar extends to full height */}
        <div className="sidebar-container">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        
        {/* Main content with top padding */}
        <div className="main-content flex-1 bg-white">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}

export default App;
