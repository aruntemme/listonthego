import React, { useState, useEffect } from 'react';
import { Plus, FileText, Loader2, ChevronRight, Zap, X, Edit, Maximize2 } from 'lucide-react';
import { Note, Todo } from '../../types';
import { LLMService } from '../../services/llmService';

interface NotesTabProps {
  notes: Note[];
  onAddNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onAddTodos: (todos: Todo[]) => void;
  llmService: LLMService;
}

const NotesTab: React.FC<NotesTabProps> = ({ 
  notes, 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote, 
  onAddTodos, 
  llmService 
}) => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Sync selectedNote with updates from the notes array
  useEffect(() => {
    if (selectedNote) {
      const updatedNote = notes.find(note => note.id === selectedNote.id);
      if (updatedNote && (
        updatedNote.tldr !== selectedNote.tldr || 
        updatedNote.actionPoints.length !== selectedNote.actionPoints.length ||
        updatedNote.updatedAt.getTime() !== selectedNote.updatedAt.getTime()
      )) {
        setSelectedNote(updatedNote);
      }
    }
  }, [notes, selectedNote]);

  const handleUpdateNote = (updatedNote: Note) => {
    onUpdateNote(updatedNote);
    // Also update the selected note to trigger immediate UI refresh
    if (selectedNote && selectedNote.id === updatedNote.id) {
      setSelectedNote(updatedNote);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newNoteTitle,
      content: newNoteContent,
      actionPoints: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isNew: true,
    };

    onAddNote(newNote);
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsCreating(false);
    setSelectedNote(newNote);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="flex-1 flex h-screen bg-gray-100">
      {/* Notes List */}
      <div className="w-80 border-r border-gray-200">

      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
              <p className="text-sm text-gray-500">Smart notes with AI insights</p>
            </div>
          </div>
        </div>
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary flex items-center gap-2 justify-center w-full mt-4 border-none hover:bg-gray-800 hover:text-white"
            >
              <Plus size={16} />
              <span className="text-sm">Create Note</span>
            </button>
      </div>
  

        <div className="flex-1 overflow-y-auto">
          {/* Create Note Form */}
          {isCreating && (
            <div className="p-6 border-b border-gray-100">
              <div className="space-y-4">
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="input-field"
                />
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write your note content..."
                  className="textarea-field"
                  rows={4}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateNote}
                    disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                    className="btn-primary disabled:opacity-50"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewNoteTitle('');
                      setNewNoteContent('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="p-4">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 mb-2 ${
                  selectedNote?.id === note.id
                    ? 'bg-white border border-black shadow-sm'
                    : 'bg-white hover:bg-gray-50 border border-transparent shadow-sm'
                } ${note.isNew ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate mb-2">
                      {note.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                      {note.content.length > 60 
                        ? note.content.substring(0, 60) + '...'
                        : note.content
                      }
                    </p>
                    <p className="text-xs text-gray-400 font-medium">
                      {formatDate(note.updatedAt)}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 mt-1 flex-shrink-0 ml-2" strokeWidth={1.5} />
                </div>
              </button>
            ))}
          </div>

          {/* Empty State */}
          {notes.length === 0 && !isCreating && (
            <div className="p-12 text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No notes yet</h3>
              <p className="text-gray-500 text-sm">Click + to create your first note</p>
            </div>
          )}
        </div>
      </div>

      {/* Note Detail */}
      <div className="flex-1">
        {selectedNote ? (
          <NoteDetail
            note={selectedNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={onDeleteNote}
            onAddTodos={onAddTodos}
            llmService={llmService}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FileText size={64} className="mx-auto mb-6 text-gray-300" strokeWidth={1} />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Select a note</h3>
              <p className="text-gray-500">Choose a note from the sidebar to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface NoteDetailProps {
  note: Note;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onAddTodos: (todos: Todo[]) => void;
  llmService: LLMService;
}

const NoteDetail: React.FC<NoteDetailProps> = ({ 
  note, 
  onUpdateNote, 
  onDeleteNote, 
  onAddTodos, 
  llmService 
}) => {
  const [isGeneratingTLDR, setIsGeneratingTLDR] = useState(false);
  const [isExtractingActions, setIsExtractingActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [modalContent, setModalContent] = useState<{ type: 'summary' | 'actions'; content: string | string[]; title: string } | null>(null);

  // Sync local state with note prop changes
  useEffect(() => {
    setEditTitle(note.title);
    setEditContent(note.content);
  }, [note.id, note.title, note.content]);

  const handleGenerateTLDR = async () => {
    setIsGeneratingTLDR(true);
    try {
      const tldr = await llmService.generateTLDR(note.content);
      const updatedNote = { ...note, tldr, updatedAt: new Date() };
      onUpdateNote(updatedNote);
    } catch (error) {
      console.error('Failed to generate TLDR:', error);
    } finally {
      setIsGeneratingTLDR(false);
    }
  };

  const handleExtractActionPoints = async () => {
    setIsExtractingActions(true);
    try {
      const actionPoints = await llmService.extractActionPoints(note.content);
      const updatedNote = { ...note, actionPoints, updatedAt: new Date() };
      onUpdateNote(updatedNote);
    } catch (error) {
      console.error('Failed to extract action points:', error);
    } finally {
      setIsExtractingActions(false);
    }
  };

  const handleCreateTodos = () => {
    const newTodos: Todo[] = note.actionPoints.map((action) => ({
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: action,
      completed: false,
      createdAt: new Date(),
      priority: 'medium' as const,
      tags: [],
      sourceText: `Note: ${note.title}`,
    }));

    onAddTodos(newTodos);
  };

  const handleSaveEdit = () => {
    onUpdateNote({
      ...note,
      title: editTitle,
      content: editContent,
      updatedAt: new Date(),
      isNew: false,
    });
    setIsEditing(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-8 border-b border-gray-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="input-field text-2xl font-bold border-none bg-transparent p-0 focus:ring-0"
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{note.title}</h1>
            )}
            <p className="text-sm text-gray-500 mt-3 font-medium">
              Last updated {note.updatedAt.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button onClick={handleSaveEdit} className="btn-primary">
                  Save
                </button>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(note.title);
                    setEditContent(note.content);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-minimal p-3"
                >
                  <Edit size={18} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="btn-minimal p-3 hover:text-red-500 hover:bg-red-50"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* AI Actions */}
        <div className="flex gap-4 items-start">
          {/* TLDR Section */}
          {note.tldr ? (
            <div className="flex-1">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-40 flex flex-col">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h3 className="section-subheader mb-0">TLDR;</h3>
                  <button
                    onClick={() => setModalContent({ type: 'summary', content: note.tldr!, title: 'Summary' })}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <p className="text-sm text-gray-700 leading-relaxed">{note.tldr}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <button
                onClick={handleGenerateTLDR}
                disabled={isGeneratingTLDR}
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-medium px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-sm w-full justify-center"
              >
                {isGeneratingTLDR ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Generate Summary
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action Points Section */}
          {note.actionPoints.length > 0 ? (
            <div className="flex-1">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-40 flex flex-col">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h3 className="section-subheader mb-0">Action Points</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModalContent({ type: 'actions', content: note.actionPoints, title: 'Action Points' })}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200"
                    >
                      <Maximize2 size={14} />
                    </button>
                    <button
                      onClick={handleCreateTodos}
                      className="btn-primary py-2 px-4 text-sm"
                    >
                      Create Todos
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ul className="space-y-2">
                    {note.actionPoints.map((action, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-3 leading-relaxed">
                        <span className="text-gray-900 mt-1 font-bold">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <button
                onClick={handleExtractActionPoints}
                disabled={isExtractingActions}
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-medium px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-sm w-full justify-center"
              >
                {isExtractingActions ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Extracting Actions...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Extract Actions
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="textarea-field h-full min-h-96"
            placeholder="Write your note content..."
          />
        ) : (
          <div className="prose prose-gray max-w-none">
            <pre className="whitespace-pre-wrap font-['Inter'] text-gray-700 leading-relaxed text-base">
              {note.content}
            </pre>
          </div>
        )}
      </div>

      {/* Modal for enlarged content */}
      {modalContent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{modalContent.title}</h2>
              <button
                onClick={() => setModalContent(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {modalContent.type === 'summary' ? (
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed text-base whitespace-pre-wrap">
                    {modalContent.content as string}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(modalContent.content as string[]).map((action, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 leading-relaxed">{action}</p>
                    </div>
                  ))}
                  
                  {/* Create Todos button in modal */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleCreateTodos();
                        setModalContent(null);
                      }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Create All as Todos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesTab; 