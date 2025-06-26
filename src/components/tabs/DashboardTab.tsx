import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  CheckSquare, 
  FileText, 
  Calendar,
  TrendingUp,
  Plus,
  Settings as SettingsIcon,
  Grip,
  Eye,
  EyeOff,
  RotateCcw,
  Clock,
  Target,
  Brain,
  Zap
} from 'lucide-react';
import { Todo, Note, Habit, HabitLog, DashboardWidget, DashboardLayout } from '../../types';
import { indexedDBService } from '../../services/indexedDBService';

interface DashboardTabProps {
  todos: Todo[];
  notes: Note[];
  onToggleTodo: (todoId: string) => void;
  onNavigateToTab: (tab: 'todos' | 'notes' | 'habits') => void;
  onSelectNote?: (note: Note) => void;
}

interface SortableWidgetProps {
  widget: DashboardWidget;
  children: React.ReactNode;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({ widget, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${widget.size.width}`,
    gridRow: `span ${widget.size.height}`,
    maxHeight: `${widget.size.height * 250}px`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group transition-all duration-200 ${
        isDragging ? 'opacity-50 z-50' : 'opacity-100'
      }`}
    >
      <div className="card h-full flex flex-col overflow-hidden">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-gray-100 z-10 touch-none"
        >
          <Grip size={16} className="text-gray-400" />
        </div>
        
        {children}
      </div>
    </div>
  );
};

const TodosWidget: React.FC<{ 
  todos: Todo[]; 
  onToggleTodo: (id: string) => void;
  onNavigateToTab: () => void;
}> = ({ todos, onToggleTodo, onNavigateToTab }) => {
  const pendingTodos = todos.filter(todo => !todo.completed);
  const overdueTodos = todos.filter(todo => 
    !todo.completed && todo.dueDate && todo.dueDate < new Date()
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Recent Todos</h3>
        </div>
        <button
          onClick={onNavigateToTab}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          View all
        </button>
      </div>
      
      {overdueTodos.length > 0 && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600 font-medium">
            {overdueTodos.length} overdue task{overdueTodos.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto min-h-0 widget-scroll">
        {pendingTodos.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <CheckSquare size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">All caught up!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pr-2">
            {pendingTodos.map(todo => (
              <div key={todo.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group">
                <button
                  onClick={() => onToggleTodo(todo.id)}
                  className="checkbox flex-shrink-0"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{todo.text}</p>
                  {todo.dueDate && (
                    <p className="text-xs text-gray-500">
                      Due {todo.dueDate.toLocaleDateString()}
                    </p>
                  )}
                </div>
                {todo.priority === 'high' && (
                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface NotesWidgetProps {
  notes: Note[];
  onNavigateToTab: () => void;
  onSelectNote?: (note: Note) => void;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ notes, onNavigateToTab, onSelectNote }) => {
  const recentNotes = notes.slice(0, 5);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Recent Notes</h3>
        </div>
        <button
          onClick={onNavigateToTab}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          View all
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0 widget-scroll">
        {recentNotes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FileText size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notes yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pr-2">
            {recentNotes.map(note => (
              <div 
                key={note.id} 
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => {
                  if (onSelectNote) {
                    onSelectNote(note);
                  }
                  onNavigateToTab();
                }}
              >
                <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">{note.title}</h4>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{note.content}</p>
                <p className="text-xs text-gray-400">
                  {note.updatedAt.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatsWidget: React.FC<{ 
  todos: Todo[]; 
  notes: Note[];
}> = ({ todos, notes }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);

  useEffect(() => {
    const loadHabits = async () => {
      try {
        const [habitsData, logsData] = await Promise.all([
          indexedDBService.getAllHabits(),
          indexedDBService.getAllHabitLogs()
        ]);
        setHabits(habitsData);
        setHabitLogs(logsData);
      } catch (error) {
        console.error('Failed to load habits:', error);
      }
    };

    loadHabits();
  }, []);

  const completedTodos = todos.filter(todo => todo.completed).length;
  const totalTodos = todos.length;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const todayLogs = habitLogs.filter(log => {
    const today = new Date();
    const logDate = new Date(log.date);
    return logDate.toDateString() === today.toDateString() && log.completed;
  });

  const stats = [
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Total Notes',
      value: notes.length.toString(),
      icon: Brain,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Habits Today',
      value: `${todayLogs.length}/${habits.length}`,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Active Todos',
      value: (totalTodos - completedTodos).toString(),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={18} className="text-gray-600" />
        <h3 className="font-semibold text-gray-900">Quick Stats</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 flex-1">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`p-3 rounded-lg ${stat.bgColor}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={stat.color} />
                <span className="text-xs font-medium text-gray-600">{stat.label}</span>
              </div>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HabitsWidget: React.FC<{ 
  onNavigateToTab: () => void;
}> = ({ onNavigateToTab }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);

  useEffect(() => {
    const loadHabits = async () => {
      try {
        const [habitsData, logsData] = await Promise.all([
          indexedDBService.getAllHabits(),
          indexedDBService.getAllHabitLogs()
        ]);
        setHabits(habitsData);
        setHabitLogs(logsData);
      } catch (error) {
        console.error('Failed to load habits:', error);
      }
    };

    loadHabits();
  }, []);

  const todayLogs = habitLogs.filter(log => {
    const today = new Date();
    const logDate = new Date(log.date);
    return logDate.toDateString() === today.toDateString();
  });

  const todayHabits = habits.slice(0, 3).map(habit => {
    const todayLog = todayLogs.find(log => log.habitId === habit.id);
    return {
      ...habit,
      completedToday: todayLog?.completed || false
    };
  });

  const handleToggleHabit = async (habitId: string, completed: boolean) => {
    try {
      const today = new Date();
      const existingLog = todayLogs.find(log => log.habitId === habitId);
      
      if (existingLog) {
        const updatedLog = { ...existingLog, completed };
        await indexedDBService.saveHabitLog(updatedLog);
      } else {
        const newLog: HabitLog = {
          id: `${habitId}-${today.toDateString()}`,
          habitId,
          date: today,
          completed,
        };
        await indexedDBService.saveHabitLog(newLog);
      }

      // Reload data
      const logsData = await indexedDBService.getAllHabitLogs();
      setHabitLogs(logsData);
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Today's Habits</h3>
        </div>
        <button
          onClick={onNavigateToTab}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          View all
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0 widget-scroll">
        {todayHabits.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Calendar size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No habits yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pr-2">
            {todayHabits.map(habit => (
              <div key={habit.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group">
                <button
                  onClick={() => handleToggleHabit(habit.id, !habit.completedToday)}
                  className={`checkbox flex-shrink-0 ${habit.completedToday ? 'checked' : ''}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center ${
                    habit.completedToday 
                      ? 'bg-gray-900 border-gray-900 text-white' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    {habit.completedToday && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm transition-colors ${
                    habit.completedToday ? 'text-gray-500 line-through' : 'text-gray-900'
                  }`}>
                    {habit.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {habit.streak} day streak
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const QuickAddWidget: React.FC<{
  onNavigateToTab: (tab: 'todos' | 'notes' | 'habits') => void;
}> = ({ onNavigateToTab }) => {
  const quickActions = [
    {
      label: 'Add Todo',
      icon: CheckSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      action: () => onNavigateToTab('todos')
    },
    {
      label: 'Create Note',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      action: () => onNavigateToTab('notes')
    },
    {
      label: 'New Habit',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      action: () => onNavigateToTab('habits')
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Plus size={18} className="text-gray-600" />
        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
      </div>
      
      <div className="flex-1 space-y-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.action}
              className={`w-full p-3 rounded-lg transition-colors text-left ${action.bgColor} ${action.hoverColor}`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={action.color} />
                <span className={`font-medium ${action.color}`}>{action.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const DashboardTab: React.FC<DashboardTabProps> = ({ 
  todos, 
  notes, 
  onToggleTodo, 
  onNavigateToTab,
  onSelectNote
}) => {
  const [layout, setLayout] = useState<DashboardLayout>({
    widgets: [
      {
        id: 'todos',
        type: 'todos',
        position: { x: 0, y: 0 },
        size: { width: 2, height: 2 },
        enabled: true,
        title: 'Recent Todos'
      },
      {
        id: 'notes',
        type: 'notes',
        position: { x: 2, y: 0 },
        size: { width: 2, height: 2 },
        enabled: true,
        title: 'Recent Notes'
      },
      {
        id: 'stats',
        type: 'stats',
        position: { x: 0, y: 2 },
        size: { width: 2, height: 1 },
        enabled: true,
        title: 'Statistics'
      },
      {
        id: 'habits',
        type: 'habits',
        position: { x: 2, y: 2 },
        size: { width: 1, height: 2 },
        enabled: true,
        title: 'Today\'s Habits'
      },
      {
        id: 'quickAdd',
        type: 'quickAdd',
        position: { x: 3, y: 2 },
        size: { width: 1, height: 2 },
        enabled: true,
        title: 'Quick Actions'
      }
    ],
    columns: 4,
    rowHeight: 200
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isConfigMode, setIsConfigMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load layout from storage on mount
  useEffect(() => {
    const loadLayout = async () => {
      try {
        const savedLayout = await indexedDBService.getSetting('dashboard-layout');
        if (savedLayout) {
          setLayout(savedLayout);
        }
      } catch (error) {
        console.error('Failed to load dashboard layout:', error);
      }
    };

    loadLayout();
  }, []);

  // Save layout to storage when it changes
  useEffect(() => {
    const saveLayout = async () => {
      try {
        await indexedDBService.setSetting('dashboard-layout', layout);
      } catch (error) {
        console.error('Failed to save dashboard layout:', error);
      }
    };

    saveLayout();
  }, [layout]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setLayout((prev) => {
        const oldIndex = prev.widgets.findIndex((widget) => widget.id === active.id);
        const newIndex = prev.widgets.findIndex((widget) => widget.id === over?.id);
        
        return {
          ...prev,
          widgets: arrayMove(prev.widgets, oldIndex, newIndex),
        };
      });
    }
    
    setActiveId(null);
  };

  const handleResetLayout = () => {
    const defaultLayout: DashboardLayout = {
      widgets: [
        {
          id: 'todos',
          type: 'todos',
          position: { x: 0, y: 0 },
          size: { width: 2, height: 2 },
          enabled: true,
          title: 'Recent Todos'
        },
        {
          id: 'notes',
          type: 'notes',
          position: { x: 2, y: 0 },
          size: { width: 2, height: 2 },
          enabled: true,
          title: 'Recent Notes'
        },
        {
          id: 'stats',
          type: 'stats',
          position: { x: 0, y: 2 },
          size: { width: 2, height: 1 },
          enabled: true,
          title: 'Statistics'
        },
        {
          id: 'habits',
          type: 'habits',
          position: { x: 2, y: 2 },
          size: { width: 1, height: 2 },
          enabled: true,
          title: 'Today\'s Habits'
        },
        {
          id: 'quickAdd',
          type: 'quickAdd',
          position: { x: 3, y: 2 },
          size: { width: 1, height: 2 },
          enabled: true,
          title: 'Quick Actions'
        }
      ],
      columns: 4,
      rowHeight: 200
    };
    setLayout(defaultLayout);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, enabled: !widget.enabled }
          : widget
      )
    }));
  };

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.enabled) return null;

    let content;
    switch (widget.type) {
      case 'todos':
        content = (
          <TodosWidget 
            todos={todos} 
            onToggleTodo={onToggleTodo}
            onNavigateToTab={() => onNavigateToTab('todos')}
          />
        );
        break;
      case 'notes':
        content = (
          <NotesWidget 
            notes={notes}
            onNavigateToTab={() => onNavigateToTab('notes')}
            onSelectNote={onSelectNote}
          />
        );
        break;
      case 'stats':
        content = <StatsWidget todos={todos} notes={notes} />;
        break;
      case 'habits':
        content = (
          <HabitsWidget 
            onNavigateToTab={() => onNavigateToTab('habits')}
          />
        );
        break;
      case 'quickAdd':
        content = <QuickAddWidget onNavigateToTab={onNavigateToTab} />;
        break;
      default:
        content = <div>Unknown widget type</div>;
    }

    return (
      <SortableWidget key={widget.id} widget={widget}>
        {content}
      </SortableWidget>
    );
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Your productivity overview</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConfigMode(!isConfigMode)}
              className={`btn-minimal ${isConfigMode ? 'bg-gray-100' : ''}`}
            >
              <SettingsIcon size={16} />
              Configure
            </button>
            
            <button
              onClick={handleResetLayout}
              className="btn-minimal"
            >
              <RotateCcw size={16} />
              Reset Layout
            </button>
          </div>
        </div>

        {/* Widget configuration panel */}
        {isConfigMode && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-3">Widget Visibility</h3>
            <div className="flex flex-wrap gap-2">
              {layout.widgets.map(widget => (
                <button
                  key={widget.id}
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    widget.enabled
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {widget.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  {widget.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Grid - Scrollable Container */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={layout.widgets.map(w => w.id)} 
              strategy={rectSortingStrategy}
            >
              <div
                className="grid gap-6"
                style={{
                  gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
                  gridAutoRows: '250px', // Dynamic rows that adapt to content
                }}
              >
                {layout.widgets.map(renderWidget)}
              </div>
            </SortableContext>
            
            <DragOverlay>
              {activeId ? (
                <div className="card opacity-90 transform rotate-2 shadow-lg">
                  <div className="p-4 text-gray-600">
                    Moving {layout.widgets.find(w => w.id === activeId)?.title}...
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab; 