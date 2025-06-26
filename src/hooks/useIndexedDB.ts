import { useState, useCallback } from 'react';
import { indexedDBService } from '../services/indexedDBService';
import { Todo, Note } from '../types';

interface UseIndexedDBReturn {
  isLoading: boolean;
  error: string | null;
  saveTodo: (todo: Todo) => Promise<void>;
  saveTodos: (todos: Todo[]) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  saveNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useIndexedDB = (): UseIndexedDBReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T | void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      console.error(errorMessage, err);
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveTodo = useCallback(async (todo: Todo) => {
    await withErrorHandling(
      () => indexedDBService.saveTodo(todo),
      'Failed to save todo'
    );
  }, [withErrorHandling]);

  const saveTodos = useCallback(async (todos: Todo[]) => {
    await withErrorHandling(
      () => indexedDBService.saveTodos(todos),
      'Failed to save todos'
    );
  }, [withErrorHandling]);

  const deleteTodo = useCallback(async (id: string) => {
    await withErrorHandling(
      () => indexedDBService.deleteTodo(id),
      'Failed to delete todo'
    );
  }, [withErrorHandling]);

  const saveNote = useCallback(async (note: Note) => {
    await withErrorHandling(
      () => indexedDBService.saveNote(note),
      'Failed to save note'
    );
  }, [withErrorHandling]);

  const deleteNote = useCallback(async (id: string) => {
    await withErrorHandling(
      () => indexedDBService.deleteNote(id),
      'Failed to delete note'
    );
  }, [withErrorHandling]);

  return {
    isLoading,
    error,
    saveTodo,
    saveTodos,
    deleteTodo,
    saveNote,
    deleteNote,
    clearError,
  };
}; 