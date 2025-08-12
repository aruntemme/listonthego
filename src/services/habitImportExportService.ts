import { Habit, HabitLog, HabitCategory, HabitExportData } from '../types';

class HabitImportExportService {
  private readonly APP_VERSION = '0.1.0';

  // Export functions
  async exportToJSON(habits: Habit[], logs: HabitLog[], categories: HabitCategory[]): Promise<string> {
    const exportData: HabitExportData = {
      habits,
      habitLogs: logs,
      habitCategories: categories,
      exportDate: new Date(),
      version: this.APP_VERSION
    };

    return JSON.stringify(exportData, null, 2);
  }

  async exportToCSV(habits: Habit[], logs: HabitLog[]): Promise<string> {
    const csvRows: string[] = [];
    
    // Header
    csvRows.push([
      'Habit Name',
      'Description',
      'Category',
      'Frequency',
      'Goal',
      'Current Streak',
      'Created Date',
      'Total Completions',
      'Last Completed'
    ].join(','));

    // Data rows
    habits.forEach(habit => {
      const habitLogs = logs.filter(log => log.habitId === habit.id);
      const totalCompletions = habitLogs.filter(log => log.completed).length;
      
      csvRows.push([
        this.escapeCSV(habit.name),
        this.escapeCSV(habit.description || ''),
        this.escapeCSV(habit.category),
        habit.frequency,
        habit.goal?.toString() || '',
        habit.streak.toString(),
        habit.createdAt.toISOString().split('T')[0],
        totalCompletions.toString(),
        habit.lastCompleted?.toISOString().split('T')[0] || ''
      ].join(','));
    });

    return csvRows.join('\n');
  }

  async exportHabitLogsToCSV(logs: HabitLog[], habits: Habit[]): Promise<string> {
    const csvRows: string[] = [];
    
    // Header
    csvRows.push([
      'Date',
      'Habit Name',
      'Completed',
      'Mood',
      'Effort',
      'Notes'
    ].join(','));

    // Data rows
    logs.forEach(log => {
      const habit = habits.find(h => h.id === log.habitId);
      csvRows.push([
        log.date.toISOString().split('T')[0],
        this.escapeCSV(habit?.name || 'Unknown'),
        log.completed ? 'Yes' : 'No',
        log.mood?.toString() || '',
        log.effort?.toString() || '',
        this.escapeCSV(log.notes || '')
      ].join(','));
    });

    return csvRows.join('\n');
  }

  async exportToMarkdown(habits: Habit[], logs: HabitLog[], categories: HabitCategory[]): Promise<string> {
    const md: string[] = [];
    
    md.push('# Habit Tracker Export');
    md.push('');
    md.push(`**Export Date:** ${new Date().toISOString().split('T')[0]}`);
    md.push(`**Total Habits:** ${habits.length}`);
    md.push(`**Total Logs:** ${logs.length}`);
    md.push('');

    // Categories summary
    md.push('## Categories');
    md.push('');
    categories.forEach(category => {
      const categoryHabits = habits.filter(h => h.category === category.name);
      md.push(`- **${category.name}**: ${categoryHabits.length} habits`);
    });
    md.push('');

    // Habits summary
    md.push('## Habits Overview');
    md.push('');
    habits.forEach(habit => {
      const habitLogs = logs.filter(log => log.habitId === habit.id);
      const completions = habitLogs.filter(log => log.completed).length;
      const completionRate = habitLogs.length > 0 ? 
        Math.round((completions / habitLogs.length) * 100) : 0;

      md.push(`### ${habit.name}`);
      md.push('');
      if (habit.description) {
        md.push(`**Description:** ${habit.description}`);
      }
      md.push(`**Category:** ${habit.category}`);
      md.push(`**Frequency:** ${habit.frequency}`);
      md.push(`**Current Streak:** ${habit.streak} days`);
      md.push(`**Total Completions:** ${completions}`);
      md.push(`**Completion Rate:** ${completionRate}%`);
      if (habit.goal) {
        md.push(`**Goal:** ${habit.goal}`);
      }
      md.push(`**Created:** ${habit.createdAt.toISOString().split('T')[0]}`);
      if (habit.lastCompleted) {
        md.push(`**Last Completed:** ${habit.lastCompleted.toISOString().split('T')[0]}`);
      }
      md.push('');
    });

    return md.join('\n');
  }

  // Import functions
  async importFromJSON(jsonData: string): Promise<{ habits: Habit[], logs: HabitLog[], categories: HabitCategory[] }> {
    try {
      const data = JSON.parse(jsonData) as HabitExportData;
      
      // Validate data structure
      if (!data.habits || !data.habitLogs || !data.habitCategories) {
        throw new Error('Invalid import format: Missing required data fields');
      }

      // Convert date strings back to Date objects
      const habits = data.habits.map(habit => ({
        ...habit,
        createdAt: new Date(habit.createdAt),
        lastCompleted: habit.lastCompleted ? new Date(habit.lastCompleted) : undefined
      }));

      const logs = data.habitLogs.map(log => ({
        ...log,
        date: new Date(log.date)
      }));

      const categories = data.habitCategories;

      return { habits, logs, categories };
    } catch (error) {
      throw new Error(`Failed to import JSON data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async importFromCSV(csvData: string): Promise<Habit[]> {
    try {
      const rows = csvData.split('\n').map(row => row.trim()).filter(row => row.length > 0);
      
      if (rows.length < 2) {
        throw new Error('CSV must contain at least a header row and one data row');
      }

      const headers = this.parseCSVRow(rows[0]);
      const habits: Habit[] = [];

      for (let i = 1; i < rows.length; i++) {
        const values = this.parseCSVRow(rows[i]);
        
        if (values.length !== headers.length) {
          console.warn(`Skipping row ${i + 1}: Column count mismatch`);
          continue;
        }

        const habit: Habit = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: values[0] || `Imported Habit ${i}`,
          description: values[1] || undefined,
          category: values[2] || 'General',
          frequency: this.validateFrequency(values[3]) || 'daily',
          goal: values[4] ? parseInt(values[4]) : undefined,
          streak: values[5] ? parseInt(values[5]) : 0,
          createdAt: values[6] ? new Date(values[6]) : new Date(),
          lastCompleted: values[8] ? new Date(values[8]) : undefined,
        };

        habits.push(habit);
      }

      return habits;
    } catch (error) {
      throw new Error(`Failed to import CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Utility functions for downloading files
  downloadAsFile(content: string, filename: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  generateFilename(format: string, prefix: string = 'habits'): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}_export_${timestamp}.${format}`;
  }

  // Sharing functions
  generateShareableLink(habits: Habit[]): string {
    const shareData = {
      habits: habits.map(h => ({
        name: h.name,
        description: h.description,
        category: h.category,
        frequency: h.frequency,
        goal: h.goal
      }))
    };
    
    const encoded = btoa(JSON.stringify(shareData));
    return `${window.location.origin}?import=${encoded}`;
  }

  async importFromShareableLink(encoded: string): Promise<Habit[]> {
    try {
      const decoded = atob(encoded);
      const data = JSON.parse(decoded);
      
      if (!data.habits || !Array.isArray(data.habits)) {
        throw new Error('Invalid shareable link format');
      }

      return data.habits.map((habitData: any) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: habitData.name || 'Imported Habit',
        description: habitData.description,
        category: habitData.category || 'General',
        frequency: this.validateFrequency(habitData.frequency) || 'daily',
        goal: habitData.goal,
        streak: 0,
        createdAt: new Date(),
      }));
    } catch (error) {
      throw new Error(`Failed to import from shareable link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Backup and restore functions
  async createBackup(habits: Habit[], logs: HabitLog[], categories: HabitCategory[]): Promise<string> {
    const backup = {
      version: this.APP_VERSION,
      timestamp: new Date().toISOString(),
      data: {
        habits,
        habitLogs: logs,
        habitCategories: categories
      }
    };

    return JSON.stringify(backup, null, 2);
  }

  async restoreFromBackup(backupData: string): Promise<{ habits: Habit[], logs: HabitLog[], categories: HabitCategory[] }> {
    try {
      const backup = JSON.parse(backupData);
      
      if (!backup.data) {
        throw new Error('Invalid backup format: Missing data field');
      }

      return this.importFromJSON(JSON.stringify(backup.data));
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < row.length) {
      const char = row[i];
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private validateFrequency(frequency: string): 'daily' | 'weekly' | 'monthly' | null {
    if (['daily', 'weekly', 'monthly'].includes(frequency)) {
      return frequency as 'daily' | 'weekly' | 'monthly';
    }
    return null;
  }
}

export const habitImportExportService = new HabitImportExportService();
export default habitImportExportService; 