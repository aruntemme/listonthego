import React, { useState, useMemo } from 'react';
import { 
  ArrowUp, 
  Loader2, 
  Check, 
  X, 
  CheckSquare, 
  Search, 
  Filter, 
  Download,
  Calendar,
  Tag,
  Flag,
  ChevronDown,
  ChevronRight,

  Trash2,
  Clock,
  AlertCircle,
  Circle
} from 'lucide-react';
import { Todo } from '../../types';
import { LLMService } from '../../services/llmService';

interface TodoTabProps {
  todos: Todo[];
  onAddTodos: (todos: Todo[]) => void;
  onToggleTodo: (todoId: string) => void;
  onDeleteTodo: (todoId: string) => void;
  onUpdateTodo: (todoId: string, updates: Partial<Todo>) => void;
  llmService: LLMService;
}

type SortBy = 'dueDate' | 'priority' | 'created' | 'alphabetical';
type FilterBy = 'all' | 'pending' | 'completed' | 'overdue' | 'today' | 'thisWeek';

const PRIORITY_COLORS = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500', 
  low: 'bg-green-500'
};

const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

// Accordion Component
const Accordion: React.FC<{
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, children }) => {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2 font-medium text-gray-900">
          {icon}
          {title}
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

// Common Input Component
const CommonInput: React.FC<{
  inputText: string;
  setInputText: (text: string) => void;
  isExtracting: boolean;
  error: string | null;
  handleExtractTodos: () => void;
}> = ({ inputText, setInputText, isExtracting, error, handleExtractTodos }) => (
  <>
    {/* Gradient blur overlay */}
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-100/95 via-gray-100/60 via-gray-100/10 to-transparent backdrop-blur-md pointer-events-none" />
    
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <div className="max-w-3xl">
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste your meeting notes, voice transcript, or any text here..."
        className="bg-white w-full p-4 pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none transition-all duration-200 font-normal placeholder-gray-400 text-gray-900 shadow-sm"
        rows={3}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleExtractTodos();
          }
        }}
      />
      
      {/* Send Button */}
      <button
        onClick={handleExtractTodos}
        disabled={!inputText.trim() || isExtracting}
        className="absolute bottom-3 right-3 w-8 h-8 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isExtracting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ArrowUp size={16} />
        )}
      </button>
      
      {/* Character count */}
      <div className="absolute bottom-3 left-4 text-xs text-gray-400">
        {inputText.length > 0 && `${inputText.length} chars`}
      </div>
    </div>
    
    {error && (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2 max-w-4xl mx-auto">
        <X size={14} />
        {error}
      </div>
    )}
    
    {/* Hint text */}
    <div className="mt-2 text-xs text-gray-500 text-center">
      Press ⌘+Enter to extract todos
    </div>
    </div>
  </>
);

// Tab Switch Component
const TabSwitch: React.FC<{
  options: { key: string; label: string; color?: string }[];
  value: string;
  onChange: (value: string) => void;
}> = ({ options, value, onChange }) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      {options.map(option => (
        <button
          key={option.key}
          onClick={() => onChange(option.key)}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            value === option.key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {option.color && (
            <div className={`w-2 h-2 rounded-full ${option.color}`} />
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
};

const TodoTab: React.FC<TodoTabProps> = ({ 
  todos, 
  onAddTodos, 
  onToggleTodo, 
  onDeleteTodo,
  onUpdateTodo,
  llmService 
}) => {
  const [inputText, setInputText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Bulk operations state
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Accordion state
  const [accordionState, setAccordionState] = useState({
    status: true,
    priority: true,
    category: false,
    sort: false,
    bulk: false,
    export: false
  });

  const toggleAccordion = (key: keyof typeof accordionState) => {
    setAccordionState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Extract unique categories and tags from todos
  const { categories } = useMemo(() => {
    const categoriesSet = new Set<string>();
    
    todos.forEach(todo => {
      if (todo.category) categoriesSet.add(todo.category);
    });
    
    return {
      categories: Array.from(categoriesSet)
    };
  }, [todos]);

  const handleExtractTodos = async () => {
    if (!inputText.trim()) return;

    setIsExtracting(true);
    setError(null);

    try {
      const extractedItems = await llmService.extractTodos(inputText);
      
      const newTodos: Todo[] = extractedItems.map((item) => ({
        id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: item,
        completed: false,
        createdAt: new Date(),
        priority: 'medium' as const,
        tags: [],
        sourceText: inputText,
      }));

      onAddTodos(newTodos);
      setInputText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract todos');
    } finally {
      setIsExtracting(false);
    }
  };

  // Filter and sort todos
  const filteredAndSortedTodos = useMemo(() => {
    let filtered = todos;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(todo => 
        todo.text.toLowerCase().includes(query) ||
        todo.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (todo.category && todo.category.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (filterBy) {
      case 'pending':
        filtered = filtered.filter(todo => !todo.completed);
        break;
      case 'completed':
        filtered = filtered.filter(todo => todo.completed);
        break;
      case 'overdue':
        filtered = filtered.filter(todo => 
          !todo.completed && todo.dueDate && todo.dueDate < today
        );
        break;
      case 'today':
        filtered = filtered.filter(todo => 
          !todo.completed && todo.dueDate && 
          today.toDateString() === todo.dueDate.toDateString()
        );
        break;
      case 'thisWeek':
        filtered = filtered.filter(todo => 
          !todo.completed && todo.dueDate && 
          todo.dueDate >= today && todo.dueDate <= weekFromNow
        );
        break;
      // 'all' shows everything
    }

    // Apply priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(todo => todo.priority === selectedPriority);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(todo => todo.category === selectedCategory);
    }

    // Sort todos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'alphabetical':
          return a.text.localeCompare(b.text);
        case 'created':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return filtered;
  }, [todos, searchQuery, filterBy, sortBy, selectedPriority, selectedCategory]);

  const groupedTodos = {
    pending: filteredAndSortedTodos.filter(todo => !todo.completed),
    completed: filteredAndSortedTodos.filter(todo => todo.completed)
  };

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedTodos.size === filteredAndSortedTodos.length) {
      setSelectedTodos(new Set());
    } else {
      setSelectedTodos(new Set(filteredAndSortedTodos.map(todo => todo.id)));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedTodos.size} selected todos?`)) {
      selectedTodos.forEach(todoId => onDeleteTodo(todoId));
      setSelectedTodos(new Set());
      setIsSelectMode(false);
    }
  };

  const handleBulkComplete = () => {
    selectedTodos.forEach(todoId => onToggleTodo(todoId));
    setSelectedTodos(new Set());
    setIsSelectMode(false);
  };

  // Export functionality
  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    const dataToExport = filteredAndSortedTodos;
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(dataToExport, null, 2);
        filename = 'todos.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        const headers = 'Text,Completed,Priority,Due Date,Category,Tags,Created\n';
        const rows = dataToExport.map(todo => 
          `"${todo.text}","${todo.completed}","${todo.priority}","${todo.dueDate?.toISOString() || ''}","${todo.category || ''}","${todo.tags.join(';')}","${todo.createdAt.toISOString()}"`
        ).join('\n');
        content = headers + rows;
        filename = 'todos.csv';
        mimeType = 'text/csv';
        break;
      case 'txt':
        content = dataToExport.map(todo => {
          const status = todo.completed ? '✓' : '○';
          const priority = todo.priority.toUpperCase();
          const dueDate = todo.dueDate ? ` (Due: ${formatDate(todo.dueDate)})` : '';
          return `${status} [${priority}] ${todo.text}${dueDate}`;
        }).join('\n');
        filename = 'todos.txt';
        mimeType = 'text/plain';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const isOverdue = (todo: Todo) => {
    if (!todo.dueDate || todo.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return todo.dueDate < today;
  };

  const isDueToday = (todo: Todo) => {
    if (!todo.dueDate || todo.completed) return false;
    const today = new Date();
    const todoDate = new Date(todo.dueDate);
    return today.toDateString() === todoDate.toDateString();
  };

  return (
    <div className="flex-1 flex h-screen bg-gray-100 relative">
      {/* Main content area (2/3) */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto pb-40">
          <div className="px-6 py-4">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Todos</h1>
                  <p className="text-sm text-gray-500">Manage your action items and let AI extract todos from text</p>
                </div>
                
                {/* Bulk operations */}
                {isSelectMode && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {selectedTodos.size} selected
                    </span>
                    <button
                      onClick={handleBulkComplete}
                      className="btn-minimal"
                      disabled={selectedTodos.size === 0}
                    >
                      <Check size={14} />
                      Complete
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="btn-minimal text-red-600 hover:bg-red-50"
                      disabled={selectedTodos.size === 0}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setIsSelectMode(false);
                        setSelectedTodos(new Set());
                      }}
                      className="btn-minimal"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Todo Lists */}
            <div className="space-y-8">
              {/* Pending Todos */}
              {groupedTodos.pending.length > 0 && (
                <div>
                  <h2 className="section-subheader flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                    Pending ({groupedTodos.pending.length})
                    {!isSelectMode && (
                      <button
                        onClick={() => setIsSelectMode(true)}
                        className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                      >
                        Select
                      </button>
                    )}
                  </h2>
                  <div className="space-y-3">
                    {groupedTodos.pending.map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={() => onToggleTodo(todo.id)}
                        onDelete={() => onDeleteTodo(todo.id)}
                        onUpdate={(updates) => onUpdateTodo(todo.id, updates)}
                        formatDate={formatDate}
                        isOverdue={isOverdue(todo)}
                        isDueToday={isDueToday(todo)}
                        isSelectMode={isSelectMode}
                        isSelected={selectedTodos.has(todo.id)}
                        onSelectToggle={(selected) => {
                          const newSelected = new Set(selectedTodos);
                          if (selected) {
                            newSelected.add(todo.id);
                          } else {
                            newSelected.delete(todo.id);
                          }
                          setSelectedTodos(newSelected);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Todos */}
              {groupedTodos.completed.length > 0 && (
                <div>
                  <h2 className="section-subheader flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    Completed ({groupedTodos.completed.length})
                  </h2>
                  <div className="space-y-3">
                    {groupedTodos.completed.map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={() => onToggleTodo(todo.id)}
                        onDelete={() => onDeleteTodo(todo.id)}
                        onUpdate={(updates) => onUpdateTodo(todo.id, updates)}
                        formatDate={formatDate}
                        isOverdue={false}
                        isDueToday={false}
                        isSelectMode={isSelectMode}
                        isSelected={selectedTodos.has(todo.id)}
                        onSelectToggle={(selected) => {
                          const newSelected = new Set(selectedTodos);
                          if (selected) {
                            newSelected.add(todo.id);
                          } else {
                            newSelected.delete(todo.id);
                          }
                          setSelectedTodos(newSelected);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredAndSortedTodos.length === 0 && (
                <div className="text-center py-16">
                  <CheckSquare size={48} className="mx-auto text-gray-300 mb-6" strokeWidth={1} />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    {todos.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
                  </h3>
                  <p className="text-gray-500">
                    {todos.length === 0 
                      ? 'Add some text below and let AI extract actionable items for you.'
                      : 'Try adjusting your search or filter criteria.'}
                  </p>
                </div>
              )}
            </div>

            {/* Single Common Input Area - spans full width at bottom */}
            <CommonInput
              inputText={inputText}
              setInputText={setInputText}
              isExtracting={isExtracting}
              error={error}
              handleExtractTodos={handleExtractTodos}
            />
          </div>
        </div>

      </div>

      {/* Filters and Operations Sidebar (1/3) */}
      <div className="w-96  border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Filters & Actions</h2>
          
          {/* Search - Always visible */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search todos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
            />
          </div>

          {/* Quick Stats - Always visible */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-gray-900">
                {todos.filter(t => !t.completed).length}
              </div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-gray-900">
                {todos.filter(t => t.completed).length}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-48">
          {/* Status Filter Accordion */}
          <Accordion
            title="Status"
            icon={<Filter size={14} />}
            isOpen={accordionState.status}
            onToggle={() => toggleAccordion('status')}
          >
            <TabSwitch
              options={[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'completed', label: 'Done' },
              ]}
              value={filterBy}
              onChange={(value) => setFilterBy(value as FilterBy)}
            />
            <div className="mt-3">
              <TabSwitch
                options={[
                  { key: 'overdue', label: 'Overdue' },
                  { key: 'today', label: 'Today' },
                  { key: 'thisWeek', label: 'This Week' },
                ]}
                value={filterBy === 'overdue' || filterBy === 'today' || filterBy === 'thisWeek' ? filterBy : ''}
                onChange={(value) => setFilterBy(value as FilterBy)}
              />
            </div>
          </Accordion>

          {/* Priority Filter Accordion */}
          <Accordion
            title="Priority"
            icon={<Flag size={14} />}
            isOpen={accordionState.priority}
            onToggle={() => toggleAccordion('priority')}
          >
            <TabSwitch
              options={[
                { key: 'all', label: 'All' },
                { key: 'high', label: 'High', color: PRIORITY_COLORS.high },
                { key: 'medium', label: 'Medium', color: PRIORITY_COLORS.medium },
                { key: 'low', label: 'Low', color: PRIORITY_COLORS.low },
              ]}
              value={selectedPriority}
              onChange={(value) => setSelectedPriority(value as any)}
            />
          </Accordion>

          {/* Sort Accordion */}
          <Accordion
            title="Sort By"
            icon={<ArrowUp size={14} />}
            isOpen={accordionState.sort}
            onToggle={() => toggleAccordion('sort')}
          >
            <TabSwitch
              options={[
                { key: 'created', label: 'Created' },
                { key: 'dueDate', label: 'Due Date' },
              ]}
              value={sortBy}
              onChange={(value) => setSortBy(value as SortBy)}
            />
            <div className="mt-3">
              <TabSwitch
                options={[
                  { key: 'priority', label: 'Priority' },
                  { key: 'alphabetical', label: 'A-Z' },
                ]}
                value={sortBy === 'priority' || sortBy === 'alphabetical' ? sortBy : ''}
                onChange={(value) => setSortBy(value as SortBy)}
              />
            </div>
          </Accordion>

          {/* Category Filter Accordion */}
          {categories.length > 0 && (
            <Accordion
              title="Categories"
              icon={<Tag size={14} />}
              isOpen={accordionState.category}
              onToggle={() => toggleAccordion('category')}
            >
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === 'all' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === category 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </Accordion>
          )}

          {/* Bulk Operations Accordion */}
          {isSelectMode && (
            <Accordion
              title="Bulk Actions"
              icon={<CheckSquare size={14} />}
              isOpen={accordionState.bulk}
              onToggle={() => toggleAccordion('bulk')}
            >
              <div className="space-y-2">
                <button
                  onClick={handleSelectAll}
                  className="w-full btn-minimal"
                >
                  {selectedTodos.size === filteredAndSortedTodos.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleBulkComplete}
                  className="w-full btn-minimal"
                  disabled={selectedTodos.size === 0}
                >
                  Complete Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="w-full btn-minimal text-red-600 hover:bg-red-50"
                  disabled={selectedTodos.size === 0}
                >
                  Delete Selected
                </button>
              </div>
            </Accordion>
          )}

          {/* Export Options Accordion */}
          <Accordion
            title="Export"
            icon={<Download size={14} />}
            isOpen={accordionState.export}
            onToggle={() => toggleAccordion('export')}
          >
            <div className="space-y-2">
              <button
                onClick={() => handleExport('json')}
                className="w-full btn-minimal"
              >
                Export as JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full btn-minimal"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="w-full btn-minimal"
              >
                Export as Text
              </button>
            </div>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Todo>) => void;
  formatDate: (date: Date) => string;
  isOverdue: boolean;
  isDueToday: boolean;
  isSelectMode: boolean;
  isSelected: boolean;
  onSelectToggle: (selected: boolean) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ 
  todo, 
  onToggle, 
  onDelete, 
  onUpdate,
  formatDate,
  isOverdue,
  isDueToday,
  isSelectMode,
  isSelected,
  onSelectToggle
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editDueDate, setEditDueDate] = useState(
    todo.dueDate ? todo.dueDate.toISOString().split('T')[0] : ''
  );
  const [editPriority, setEditPriority] = useState(todo.priority);
  const [editCategory, setEditCategory] = useState(todo.category || '');
  const [editTags, setEditTags] = useState(todo.tags.join(', '));

  const handleSave = () => {
    const updates: Partial<Todo> = {
      text: editText,
      priority: editPriority,
      category: editCategory || undefined,
      tags: editTags.split(',').map(tag => tag.trim()).filter(Boolean),
      dueDate: editDueDate ? new Date(editDueDate) : undefined,
    };
    
    onUpdate(updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setEditDueDate(todo.dueDate ? todo.dueDate.toISOString().split('T')[0] : '');
    setEditPriority(todo.priority);
    setEditCategory(todo.category || '');
    setEditTags(todo.tags.join(', '));
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="card p-4 border-2 border-gray-300">
        <div className="space-y-4">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="Task description"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Due Date</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Todo['priority'])}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Optional category"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tags</label>
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="tag1, tag2"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="btn-minimal"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''} ${isOverdue ? 'border-red-200 bg-red-50' : ''} ${isDueToday ? 'border-yellow-200 bg-yellow-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {isSelectMode ? (
            <button
              onClick={() => onSelectToggle(!isSelected)}
              className={`mt-1 w-4 h-4 border-2 rounded transition-colors ${
                isSelected 
                  ? 'bg-gray-900 border-gray-900 text-white' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {isSelected && <Check size={12} strokeWidth={3} />}
            </button>
          ) : (
            <button
              onClick={onToggle}
              className={`checkbox mt-1 ${todo.completed ? 'checked' : ''}`}
            >
              {todo.completed && <Check size={12} strokeWidth={3} />}
            </button>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Priority indicator */}
              <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[todo.priority]}`} />
              
              <p className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {todo.text}
              </p>
              
              {/* Due date warning icons */}
              {isOverdue && !todo.completed && (
                <AlertCircle size={16} className="text-red-500" />
              )}
              {isDueToday && !todo.completed && (
                <Clock size={16} className="text-yellow-600" />
              )}
            </div>
            
            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
              <span>{PRIORITY_LABELS[todo.priority]} Priority</span>
              
              {todo.dueDate && (
                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : isDueToday ? 'text-yellow-600' : ''}`}>
                  <Calendar size={12} />
                  Due {formatDate(todo.dueDate)}
                </span>
              )}
              
              {todo.category && (
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  {todo.category}
                </span>
              )}
              
              <span>Created {formatDate(todo.createdAt)}</span>
            </div>
            
            {/* Tags */}
            {todo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {todo.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Source text */}
            {todo.sourceText && (
              <div className="mt-2 text-xs text-gray-400 truncate max-w-96">
                From: "{todo.sourceText.length > 50 ? todo.sourceText.substring(0, 50) + '...' : todo.sourceText}"
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            <Circle size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoTab; 