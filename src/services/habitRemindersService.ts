import { HabitReminder, Habit } from '../types';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

class HabitRemindersService {
  private reminders: HabitReminder[] = [];
  private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map();

  async init(): Promise<void> {
    await this.checkNotificationPermission();
    await this.loadReminders();
    this.scheduleAllReminders();
  }

  private async checkNotificationPermission(): Promise<boolean> {
    try {
      let permissionGranted = await isPermissionGranted();
      
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }

      return permissionGranted;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }

  async addReminder(reminder: HabitReminder): Promise<void> {
    try {
      this.reminders.push(reminder);
      await this.saveReminders();
      
      if (reminder.enabled) {
        this.scheduleReminder(reminder);
      }
    } catch (error) {
      console.error('Failed to add reminder:', error);
      throw error;
    }
  }

  async updateReminder(updatedReminder: HabitReminder): Promise<void> {
    try {
      const index = this.reminders.findIndex(r => r.id === updatedReminder.id);
      if (index !== -1) {
        // Cancel existing scheduled notification
        this.cancelScheduledNotification(updatedReminder.id);
        
        this.reminders[index] = updatedReminder;
        await this.saveReminders();
        
        if (updatedReminder.enabled) {
          this.scheduleReminder(updatedReminder);
        }
      }
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  }

  async deleteReminder(reminderId: string): Promise<void> {
    try {
      this.cancelScheduledNotification(reminderId);
      this.reminders = this.reminders.filter(r => r.id !== reminderId);
      await this.saveReminders();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw error;
    }
  }

  async toggleReminder(reminderId: string): Promise<void> {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.enabled = !reminder.enabled;
      await this.updateReminder(reminder);
    }
  }

  getRemindersForHabit(habitId: string): HabitReminder[] {
    return this.reminders.filter(r => r.habitId === habitId);
  }

  getAllReminders(): HabitReminder[] {
    return [...this.reminders];
  }

  private scheduleReminder(reminder: HabitReminder): void {
    const [hours, minutes] = reminder.time.split(':').map(Number);
    
    // Schedule for each enabled day
    reminder.days.forEach(dayOfWeek => {
      this.scheduleReminderForDay(reminder, dayOfWeek, hours, minutes);
    });
  }

  private scheduleReminderForDay(reminder: HabitReminder, dayOfWeek: number, hours: number, minutes: number): void {
    const now = new Date();
    const scheduleTime = new Date();
    
    // Calculate next occurrence of this day and time
    scheduleTime.setHours(hours, minutes, 0, 0);
    
    // Adjust to the target day of week
    const currentDay = now.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    
    if (daysUntilTarget === 0) {
      // Same day - check if time has passed
      if (scheduleTime <= now) {
        // Schedule for next week
        scheduleTime.setDate(scheduleTime.getDate() + 7);
      }
    } else {
      scheduleTime.setDate(scheduleTime.getDate() + daysUntilTarget);
    }

    const delay = scheduleTime.getTime() - now.getTime();
    const timeoutId = setTimeout(() => {
      this.sendReminderNotification(reminder);
      // Reschedule for next week
      this.scheduleReminderForDay(reminder, dayOfWeek, hours, minutes);
    }, delay);

    const notificationKey = `${reminder.id}-${dayOfWeek}`;
    this.scheduledNotifications.set(notificationKey, timeoutId);
  }

  private async sendReminderNotification(reminder: HabitReminder): Promise<void> {
    try {
      const hasPermission = await this.checkNotificationPermission();
      if (!hasPermission) {
        console.warn('Notification permission not granted');
        return;
      }

      const message = reminder.message || `Time to complete your habit!`;
      
      await sendNotification({
        title: 'Habit Reminder',
        body: message,
        icon: 'memo.png' // Using the app icon
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  private cancelScheduledNotification(reminderId: string): void {
    // Cancel all scheduled notifications for this reminder
    this.scheduledNotifications.forEach((timeoutId, key) => {
      if (key.startsWith(reminderId)) {
        clearTimeout(timeoutId);
        this.scheduledNotifications.delete(key);
      }
    });
  }

  private scheduleAllReminders(): void {
    this.reminders
      .filter(reminder => reminder.enabled)
      .forEach(reminder => this.scheduleReminder(reminder));
  }

  private async loadReminders(): Promise<void> {
    try {
      const stored = localStorage.getItem('habit-reminders');
      if (stored) {
        this.reminders = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load reminders:', error);
      this.reminders = [];
    }
  }

  private async saveReminders(): Promise<void> {
    try {
      localStorage.setItem('habit-reminders', JSON.stringify(this.reminders));
    } catch (error) {
      console.error('Failed to save reminders:', error);
    }
  }

  // Utility methods for creating reminders
  createDailyReminder(habitId: string, time: string, message?: string): HabitReminder {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      habitId,
      time,
      days: [0, 1, 2, 3, 4, 5, 6], // All days
      enabled: true,
      message
    };
  }

  createWeekdayReminder(habitId: string, time: string, message?: string): HabitReminder {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      habitId,
      time,
      days: [1, 2, 3, 4, 5], // Monday to Friday
      enabled: true,
      message
    };
  }

  createWeekendReminder(habitId: string, time: string, message?: string): HabitReminder {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      habitId,
      time,
      days: [0, 6], // Sunday and Saturday
      enabled: true,
      message
    };
  }

  createCustomReminder(habitId: string, time: string, days: number[], message?: string): HabitReminder {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      habitId,
      time,
      days,
      enabled: true,
      message
    };
  }

  // Smart reminder suggestions
  suggestReminderTimes(habit: Habit): string[] {
    const suggestions: string[] = [];
    
    switch (habit.category.toLowerCase()) {
      case 'fitness':
        suggestions.push('07:00', '18:00', '19:00');
        break;
      case 'mindfulness':
        suggestions.push('06:30', '08:00', '21:00');
        break;
      case 'learning':
        suggestions.push('08:30', '13:00', '20:00');
        break;
      case 'health':
        suggestions.push('08:00', '12:00', '18:00');
        break;
      case 'productivity':
        suggestions.push('09:00', '14:00', '16:00');
        break;
      default:
        suggestions.push('09:00', '15:00', '19:00');
    }
    
    return suggestions;
  }

  // Testing and debugging
  async testNotification(): Promise<void> {
    try {
      const hasPermission = await this.checkNotificationPermission();
      if (!hasPermission) {
        throw new Error('Notification permission not granted');
      }

      await sendNotification({
        title: 'Habit Reminder Test',
        body: 'This is a test notification from your habit tracker!',
        icon: 'memo.png'
      });
    } catch (error) {
      console.error('Test notification failed:', error);
      throw error;
    }
  }

  // Cleanup method
  cleanup(): void {
    this.scheduledNotifications.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.scheduledNotifications.clear();
  }
}

export const habitRemindersService = new HabitRemindersService();
export default habitRemindersService; 