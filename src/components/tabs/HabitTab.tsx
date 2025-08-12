import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Target, Check, X, Edit3, Trash2, Clock, Award, 
  Bell, Lightbulb, BarChart3, List, TrendingUp,
  Share, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Habit, HabitLog, HabitCategory, HabitTemplate, HabitReminder, HabitInsight } from '../../types';
import indexedDBService from '../../services/indexedDBService';
import habitTemplatesService from '../../services/habitTemplatesService';
import habitAnalyticsService from '../../services/habitAnalyticsService';
import habitImportExportService from '../../services/habitImportExportService';
import habitRemindersService from '../../services/habitRemindersService';
import habitCalendarService, { CalendarMonth } from '../../services/habitCalendarService';

type ViewMode = 'list' | 'calendar' | 'analytics';

const HabitTab: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [templates, setTemplates] = useState<HabitTemplate[]>([]);
  const [insights, setInsights] = useState<HabitInsight[]>([]);
  const [reminders, setReminders] = useState<HabitReminder[]>([]);
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarMonth | null>(null);

  // Default categories
  const defaultCategories: HabitCategory[] = [
    { id: '1', name: 'Health', color: '#000000', icon: 'heart', description: 'Physical and mental wellbeing' },
    { id: '2', name: 'Learning', color: '#374151', icon: 'book', description: 'Education and skill development' },
    { id: '3', name: 'Fitness', color: '#6B7280', icon: 'activity', description: 'Physical exercise and movement' },
    { id: '4', name: 'Mindfulness', color: '#9CA3AF', icon: 'brain', description: 'Mental clarity and meditation' },
    { id: '5', name: 'Productivity', color: '#4B5563', icon: 'target', description: 'Work and personal productivity' },
  ];

  // Load data and initialize services
  useEffect(() => {
    const loadData = async () => {
      try {
        await indexedDBService.init();
        await habitRemindersService.init();
        
        // Load habits
        const loadedHabits = await indexedDBService.getAllHabits();
        setHabits(loadedHabits);

        // Load habit logs
        const loadedLogs = await indexedDBService.getAllHabitLogs();
        setHabitLogs(loadedLogs);

        // Load categories or set defaults
        const loadedCategories = await indexedDBService.getAllHabitCategories();
        if (loadedCategories.length > 0) {
          setCategories(loadedCategories);
        } else {
          setCategories(defaultCategories);
          await indexedDBService.saveHabitCategories(defaultCategories);
        }

        // Load templates
        setTemplates(habitTemplatesService.getPopularTemplates());

        // Load reminders
        setReminders(habitRemindersService.getAllReminders());
        console.log(reminders);

        // Generate insights
        const habitInsights = loadedHabits.map(habit => {
          const analytics = habitAnalyticsService.calculateAnalytics(habit, loadedLogs);
          return habitAnalyticsService.generateInsights(habit, analytics, loadedHabits);
        }).flat();
        
        const overallInsights = habitAnalyticsService.getOverallInsights(loadedHabits, loadedLogs);
        setInsights([...habitInsights, ...overallInsights]);

        // Generate calendar data
        updateCalendarData(currentDate, loadedHabits, loadedLogs);

        // Migrate data if needed
        await indexedDBService.migrateFromLocalStorage();
        
      } catch (error) {
        console.error('Failed to load habit data:', error);
        setCategories(defaultCategories);
      }
    };

    loadData();
  }, []);

  // Update calendar when date changes
  useEffect(() => {
    updateCalendarData(currentDate, habits, habitLogs);
  }, [currentDate, habits, habitLogs]);

  const updateCalendarData = (date: Date, habitsData: Habit[], logsData: HabitLog[]) => {
    const calData = habitCalendarService.generateCalendarMonth(
      date.getFullYear(),
      date.getMonth(),
      habitsData,
      logsData
    );
    setCalendarData(calData);
  };

  const addHabit = async (habitData: Omit<Habit, 'id' | 'streak' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      streak: 0,
      createdAt: new Date(),
    };
    
    try {
      await indexedDBService.saveHabit(newHabit);
      setHabits([...habits, newHabit]);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to save habit:', error);
    }
  };

  const addHabitFromTemplate = async (template: HabitTemplate) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: template.name,
      description: template.description,
      frequency: template.frequency,
      category: template.category,
      goal: template.goal,
      streak: 0,
      createdAt: new Date(),
      color: template.color,
    };
    
    try {
      await indexedDBService.saveHabit(newHabit);
      setHabits([...habits, newHabit]);
      setShowTemplates(false);
    } catch (error) {
      console.error('Failed to save habit from template:', error);
    }
  };

  const updateHabit = async (updatedHabit: Habit) => {
    try {
      await indexedDBService.saveHabit(updatedHabit);
      setHabits(habits.map(h => h.id === updatedHabit.id ? updatedHabit : h));
      setEditingHabit(null);
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      await indexedDBService.deleteHabit(habitId);
      setHabits(habits.filter(h => h.id !== habitId));
      setHabitLogs(habitLogs.filter(log => log.habitId !== habitId));
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  const toggleHabitComplete = async (habitId: string, date: Date = new Date()) => {
    const dateStr = date.toDateString();
    const existingLog = habitLogs.find(log => 
      log.habitId === habitId && log.date.toDateString() === dateStr
    );

    try {
      let updatedLogs;
      
      if (existingLog) {
        const updatedLog = { ...existingLog, completed: !existingLog.completed };
        await indexedDBService.saveHabitLog(updatedLog);
        
        updatedLogs = habitLogs.map(log =>
          log.id === existingLog.id ? updatedLog : log
        );
        setHabitLogs(updatedLogs);
      } else {
        const newLog: HabitLog = {
          id: Date.now().toString(),
          habitId,
          date,
          completed: true,
        };
        
        await indexedDBService.saveHabitLog(newLog);
        updatedLogs = [...habitLogs, newLog];
        setHabitLogs(updatedLogs);
      }

      // Update habit streak and lastCompleted
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        const newStreak = calculateStreak(habitId, updatedLogs);
        const updatedHabit = {
          ...habit,
          lastCompleted: date,
          streak: newStreak,
        };
        
        await indexedDBService.saveHabit(updatedHabit);
        setHabits(habits.map(h => h.id === habitId ? updatedHabit : h));
      }
    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
    }
  };

  const calculateStreak = (habitId: string, logs?: HabitLog[]): number => {
    const logsToUse = logs || habitLogs;
    const habitLog = logsToUse.filter(log => log.habitId === habitId && log.completed);
    if (habitLog.length === 0) return 0;

    const sortedLogs = habitLog.sort((a, b) => b.date.getTime() - a.date.getTime());
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const log of sortedLogs) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      
      if (logDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (logDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  const getHabitCompletion = (habitId: string, date: Date): boolean => {
    const log = habitLogs.find(log => 
      log.habitId === habitId && log.date.toDateString() === date.toDateString()
    );
    return log?.completed || false;
  };

  // Since category filtering was removed, show all habits
  const filteredHabits = habits;

  // Export functions
  const handleExportJSON = async () => {
    try {
      const data = await habitImportExportService.exportToJSON(habits, habitLogs, categories);
      const filename = habitImportExportService.generateFilename('json');
      habitImportExportService.downloadAsFile(data, filename, 'application/json');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const data = await habitImportExportService.exportToCSV(habits, habitLogs);
      const filename = habitImportExportService.generateFilename('csv');
      habitImportExportService.downloadAsFile(data, filename, 'text/csv');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      if (file.type === 'application/json') {
        const { habits: importedHabits, logs: importedLogs, categories: importedCategories } = 
          await habitImportExportService.importFromJSON(text);
        
        // Add imported habits with new IDs to avoid conflicts
        const newHabits = importedHabits.map(h => ({ ...h, id: Date.now().toString() + Math.random() }));
        setHabits([...habits, ...newHabits]);
        setHabitLogs([...habitLogs, ...importedLogs]);
        setCategories([...categories, ...importedCategories]);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import file. Please check the format and try again.');
    }
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const renderToolbar = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold text-black">Habit Tracker</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-lg ${viewMode === 'calendar' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <Calendar size={16} />
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`p-2 rounded-lg ${viewMode === 'analytics' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <BarChart3 size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">

        
        <button
          onClick={() => setShowTemplates(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <Lightbulb size={16} />
          Templates
        </button>
        

        <button
          onClick={() => setShowImportExport(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <Share size={16} />
          Export
        </button>
        
        <button
          onClick={async () => {
            try {
              await habitRemindersService.testNotification();
              alert('Test notification sent! Check your system notifications.');
            } catch (error) {
              alert('Failed to send notification. Please check permissions.');
            }
          }}
          className="btn-secondary flex items-center gap-2"
        >
          <Bell size={16} />
          Test Alert
        </button>
        
        <button
          onClick={async () => {
            try {
              // Create a reminder for 10 seconds from now
              const testTime = new Date();
              testTime.setSeconds(testTime.getSeconds() + 10);
              const timeString = testTime.toTimeString().slice(0, 5);
              
              const quickReminder = habitRemindersService.createCustomReminder(
                'demo-habit',
                timeString,
                [testTime.getDay()], // Today's day of week
                '🚀 Scheduled notification test! This was created 10 seconds ago.'
              );
              
              await habitRemindersService.addReminder(quickReminder);
              alert('Scheduled notification created! You should see it in 10 seconds.');
              
              // Clean up after 15 seconds
              setTimeout(async () => {
                await habitRemindersService.deleteReminder(quickReminder.id);
              }, 15000);
            } catch (error) {
              alert('Failed to schedule notification: ' + error);
            }
          }}
          className="btn-secondary flex items-center gap-2"
        >
          <Clock size={16} />
          Schedule Test
        </button>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Habit
        </button>
      </div>
    </div>
  );

  const renderCalendarView = () => {
    if (!calendarData) return <div>Loading calendar...</div>;

    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{calendarData.monthName} {calendarData.year}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateCalendar('prev')}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => navigateCalendar('next')}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarData.weeks.map(week =>
            week.days.map(day => (
              <div
                key={day.date.toISOString()}
                className={`
                  p-3 min-h-[80px] border rounded-lg cursor-pointer transition-colors
                  ${day.isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}
                  ${day.isToday ? 'ring-2 ring-black' : ''}
                  hover:bg-gray-50
                `}
              >
                <div className="text-sm font-medium mb-1">
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {day.habits.slice(0, 3).map(habitData => (
                    <div
                      key={habitData.habit.id}
                      className={`
                        w-full h-1 rounded
                        ${habitData.completed ? 'bg-black' : 'bg-gray-200'}
                      `}
                    />
                  ))}
                  {day.habits.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{day.habits.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>Completion rate: {Math.round((calendarData.completedDays / calendarData.totalDays) * 100)}%</span>
          <span>{calendarData.completedDays} of {calendarData.totalDays} days active</span>
        </div>
      </div>
    );
  };

  const renderAnalyticsView = () => (
    <div className="space-y-6">
      {insights.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Insights & Recommendations</h3>
          <div className="space-y-3">
            {insights.slice(0, 5).map(insight => (
              <div key={insight.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-black">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    {insight.suggestion && (
                      <p className="text-sm text-blue-600 mt-2">{insight.suggestion}</p>
                    )}
                  </div>
                  {insight.value && (
                    <span className="text-lg font-semibold text-black">{insight.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <StatsOverview habits={habits} habitLogs={habitLogs} />
    </div>
  );

  return (
    <div className="flex-1 h-screen bg-gray-100 overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="px-6 py-4">
          {renderToolbar()}
        </div>

        <div className="flex-1 px-6 pb-6 overflow-auto">
          {viewMode === 'calendar' && renderCalendarView()}
          {viewMode === 'analytics' && renderAnalyticsView()}
          {(viewMode === 'list') && (
            <>
              <StatsOverview habits={habits} habitLogs={habitLogs} />
              
              {filteredHabits.length === 0 ? (
                <EmptyState onAddHabit={() => setShowAddForm(true)} />
              ) : (
                <div className={'space-y-4 pt-6'}>
                  {filteredHabits.map(habit => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      categories={categories}
                      onToggleComplete={toggleHabitComplete}
                      onEdit={setEditingHabit}
                      onDelete={deleteHabit}
                      getHabitCompletion={getHabitCompletion}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {(showAddForm || editingHabit) && (
        <HabitModal
          habit={editingHabit}
          categories={categories}
          onSubmit={editingHabit ? updateHabit : addHabit}
          onClose={() => {
            setShowAddForm(false);
            setEditingHabit(null);
          }}
        />
      )}

      {showTemplates && (
        <TemplatesModal
          templates={templates}
          onSelectTemplate={addHabitFromTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showImportExport && (
        <ImportExportModal
          onExportJSON={handleExportJSON}
          onExportCSV={handleExportCSV}
          onImport={handleImportFile}
          onClose={() => setShowImportExport(false)}
        />
      )}
    </div>
  );
};

// GitHub-style Streak Visualization Component
const StreakGrid: React.FC<{
  habitId: string;
  getHabitCompletion: (habitId: string, date: Date) => boolean;
}> = ({ habitId, getHabitCompletion }) => {
  const weeks = 52;
  const today = new Date();
  
  const generateDateGrid = () => {
    const grid = [];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7 - 1));
    
    for (let week = 0; week < weeks; week++) {
      const weekDates = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (week * 7) + day);
        weekDates.push(date);
      }
      grid.push(weekDates);
    }
    return grid;
  };

  const dateGrid = generateDateGrid();

  const getIntensity = (date: Date): number => {
    if (date > today) return -1; // Future dates
    return getHabitCompletion(habitId, date) ? 1 : 0;
  };

  const getSquareClass = (intensity: number): string => {
    if (intensity === -1) return 'bg-gray-100'; // Future
    if (intensity === 0) return 'bg-gray-200'; // Not completed
    return 'bg-black'; // Completed
  };

  return (
    <div className="flex gap-1">
      {dateGrid.map((week, weekIndex) => (
        <div key={weekIndex} className="flex flex-col gap-1">
          {week.map((date, dayIndex) => {
            const intensity = getIntensity(date);
            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`w-3 h-3 rounded-sm ${getSquareClass(intensity)}`}
                title={`${date.toDateString()}: ${intensity > 0 ? 'Completed' : 'Not completed'}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Stats Overview Component
const StatsOverview: React.FC<{
  habits: Habit[];
  habitLogs: HabitLog[];
}> = ({ habits, habitLogs }) => {
  const totalHabits = habits.length;
  const todayCompleted = habitLogs.filter(log => 
    log.completed && log.date.toDateString() === new Date().toDateString()
  ).length;
  const longestStreak = Math.max(...habits.map(h => h.streak), 0);
  const avgCompletion = habits.length > 0 
    ? Math.round((todayCompleted / totalHabits) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="card p-4 text-center">
        <div className="text-2xl font-bold text-black">{totalHabits}</div>
        <div className="text-sm text-gray-600">Total Habits</div>
      </div>
      <div className="card p-4 text-center">
        <div className="text-2xl font-bold text-black">{todayCompleted}</div>
        <div className="text-sm text-gray-600">Today Completed</div>
      </div>
      <div className="card p-4 text-center">
        <div className="text-2xl font-bold text-black">{longestStreak}</div>
        <div className="text-sm text-gray-600">Longest Streak</div>
      </div>
      <div className="card p-4 text-center">
        <div className="text-2xl font-bold text-black">{avgCompletion}%</div>
        <div className="text-sm text-gray-600">Today's Rate</div>
      </div>
    </div>
  );
};

// Habit Card Component
const HabitCard: React.FC<{
  habit: Habit;
  categories: HabitCategory[];
  onToggleComplete: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  getHabitCompletion: (habitId: string, date: Date) => boolean;
}> = ({ habit, categories, onToggleComplete, onEdit, onDelete, getHabitCompletion }) => {
  const today = new Date();
  const isCompletedToday = getHabitCompletion(habit.id, today);
  const category = categories.find(c => c.id === habit.category);

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-black">{habit.name}</h3>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
              {category?.name || habit.category}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
              {habit.frequency}
            </span>
          </div>
          {habit.description && (
            <p className="text-gray-600 text-sm mb-3">{habit.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Award size={14} />
              <span>{habit.streak} day streak</span>
            </div>
            {habit.goal && (
              <div className="flex items-center gap-1">
                <Target size={14} />
                <span>Goal: {habit.goal}</span>
              </div>
            )}
            {habit.lastCompleted && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>Last: {habit.lastCompleted.toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleComplete(habit.id)}
            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
              isCompletedToday
                ? 'bg-black border-black text-white'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {isCompletedToday && <Check size={16} />}
          </button>
          <button
            onClick={() => onEdit(habit)}
            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(habit.id)}
            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {/* GitHub-style Streak Grid */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Activity</span>
          <span className="text-xs text-gray-500">Less</span>
        </div>
        <StreakGrid
          habitId={habit.id}
          getHabitCompletion={getHabitCompletion}
        />
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ onAddHabit: () => void }> = ({ onAddHabit }) => (
  <div className="text-center py-16">
    <div className="mb-6">
      <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
      <TrendingUp size={32} className="mx-auto text-gray-300" />
    </div>
    <h2 className="text-2xl font-bold text-black mb-4">Start Building Habits</h2>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      Track your daily habits and build powerful streaks. Visualize your progress 
      with our GitHub-style activity grid.
    </p>
    <button onClick={onAddHabit} className="btn-primary">
      Create Your First Habit
    </button>
  </div>
);

// Habit Modal Component
const HabitModal: React.FC<{
  habit?: Habit | null;
  categories: HabitCategory[];
  onSubmit: (habit: any) => void;
  onClose: () => void;
}> = ({ habit, categories, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: habit?.name || '',
    description: habit?.description || '',
    frequency: habit?.frequency || 'daily' as 'daily' | 'weekly' | 'monthly',
    category: habit?.category || categories[0]?.id || '',
    goal: habit?.goal || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSubmit({
      ...formData,
      goal: formData.goal ? parseInt(formData.goal.toString()) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black">
            {habit ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Habit Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              placeholder="e.g., Drink 8 glasses of water"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              rows={3}
              placeholder="Add more details about this habit..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Goal (Optional)
            </label>
            <input
              type="number"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              placeholder="e.g., 30 (days streak target)"
              min="1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {habit ? 'Update' : 'Create'} Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Templates Modal Component
const TemplatesModal: React.FC<{
  templates: HabitTemplate[];
  onSelectTemplate: (template: HabitTemplate) => void;
  onClose: () => void;
}> = ({ templates, onSelectTemplate, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black">
            Select a Template
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="w-full btn-secondary"
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Import/Export Modal Component
const ImportExportModal: React.FC<{
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}> = ({ onExportJSON, onExportCSV, onImport, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black">
            Export Habits
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={onExportJSON}
            className="w-full btn-secondary"
          >
            Export as JSON
          </button>
          <button
            onClick={onExportCSV}
            className="w-full btn-secondary"
          >
            Export as CSV
          </button>
          <label className="block text-sm font-medium text-black mb-1">
            Import Habits
          </label>
          <input
            type="file"
            accept=".json"
            onChange={onImport}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          />
        </div>
      </div>
    </div>
  );
};

export default HabitTab; 