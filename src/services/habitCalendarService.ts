import { Habit, HabitLog } from '../types';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  habits: CalendarHabitData[];
  completionRate: number;
}

export interface CalendarHabitData {
  habit: Habit;
  completed: boolean;
  log?: HabitLog;
}

export interface CalendarWeek {
  days: CalendarDay[];
  weekNumber: number;
}

export interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarWeek[];
  monthName: string;
  totalDays: number;
  completedDays: number;
}

export interface HeatmapData {
  date: string; // YYYY-MM-DD format
  count: number;
  level: number; // 0-4 intensity level
}

class HabitCalendarService {
  
  generateCalendarMonth(year: number, month: number, habits: Habit[], logs: HabitLog[]): CalendarMonth {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Start from Sunday of the week containing the first day
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const weeks: CalendarWeek[] = [];
    let currentDate = new Date(startDate);
    let weekNumber = 1;
    
    while (currentDate <= lastDay || currentDate.getMonth() === month) {
      const week: CalendarWeek = {
        days: [],
        weekNumber
      };
      
      for (let i = 0; i < 7; i++) {
        const day = this.generateCalendarDay(new Date(currentDate), habits, logs, month);
        week.days.push(day);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push(week);
      weekNumber++;
      
      // Break if we've filled the month and are now in the next month
      if (currentDate.getMonth() !== month && week.days.some(d => d.isCurrentMonth)) {
        break;
      }
    }
    
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    const totalDays = weeks.reduce((sum, week) => 
      sum + week.days.filter(day => day.isCurrentMonth).length, 0
    );
    const completedDays = weeks.reduce((sum, week) => 
      sum + week.days.filter(day => day.isCurrentMonth && day.completionRate > 0).length, 0
    );
    
    return {
      year,
      month,
      weeks,
      monthName,
      totalDays,
      completedDays
    };
  }
  
  private generateCalendarDay(date: Date, habits: Habit[], logs: HabitLog[], currentMonth: number): CalendarDay {
    const today = new Date();
    const dayHabits: CalendarHabitData[] = [];
    
    habits.forEach(habit => {
      const dayLog = logs.find(log => 
        log.habitId === habit.id && 
        this.isSameDay(new Date(log.date), date)
      );
      
      dayHabits.push({
        habit,
        completed: dayLog?.completed || false,
        log: dayLog
      });
    });
    
    const completedCount = dayHabits.filter(h => h.completed).length;
    const completionRate = habits.length > 0 ? completedCount / habits.length : 0;
    
    return {
      date: new Date(date),
      isCurrentMonth: date.getMonth() === currentMonth,
      isToday: this.isSameDay(date, today),
      habits: dayHabits,
      completionRate
    };
  }
  
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  generateHeatmapData(habits: Habit[], logs: HabitLog[], startDate: Date, endDate: Date): HeatmapData[] {
    const heatmapData: HeatmapData[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = this.formatDateForHeatmap(currentDate);
      const dayLogs = logs.filter(log => 
        this.isSameDay(new Date(log.date), currentDate) && log.completed
      );
      
      const count = dayLogs.length;
      const level = this.calculateHeatmapLevel(count, habits.length);
      
      heatmapData.push({
        date: dateStr,
        count,
        level
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return heatmapData;
  }
  
  private formatDateForHeatmap(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  private calculateHeatmapLevel(completedCount: number, totalHabits: number): number {
    if (totalHabits === 0) return 0;
    
    const rate = completedCount / totalHabits;
    if (rate === 0) return 0;
    if (rate <= 0.25) return 1;
    if (rate <= 0.5) return 2;
    if (rate <= 0.75) return 3;
    return 4;
  }
  
  getHabitsForDate(date: Date, habits: Habit[], logs: HabitLog[]): CalendarHabitData[] {
    return habits.map(habit => {
      const log = logs.find(l => 
        l.habitId === habit.id && 
        this.isSameDay(new Date(l.date), date)
      );
      
      return {
        habit,
        completed: log?.completed || false,
        log
      };
    });
  }
  
  getCompletionStreakForMonth(year: number, month: number, habits: Habit[], logs: HabitLog[]): number[] {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const streaks: number[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const completedHabits = habits.filter(habit => {
        const log = logs.find(l => 
          l.habitId === habit.id && 
          this.isSameDay(new Date(l.date), date)
        );
        return log?.completed || false;
      }).length;
      
      streaks.push(completedHabits);
    }
    
    return streaks;
  }
  
  getWeeklyOverview(startDate: Date, habits: Habit[], logs: HabitLog[]): {
    days: { date: Date; completed: number; total: number }[];
    totalCompleted: number;
    totalPossible: number;
  } {
    const days = [];
    const currentDate = new Date(startDate);
    let totalCompleted = 0;
    let totalPossible = 0;
    
    for (let i = 0; i < 7; i++) {
      const dayLogs = logs.filter(log => 
        this.isSameDay(new Date(log.date), currentDate) && log.completed
      );
      
      const completed = dayLogs.length;
      const total = habits.length;
      
      days.push({
        date: new Date(currentDate),
        completed,
        total
      });
      
      totalCompleted += completed;
      totalPossible += total;
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      days,
      totalCompleted,
      totalPossible
    };
  }
  
  getMonthlyStats(year: number, month: number, habits: Habit[], logs: HabitLog[]): {
    totalDays: number;
    activeDays: number;
    completionRate: number;
    bestDay: { date: Date; completed: number } | null;
    worstDay: { date: Date; completed: number } | null;
    streak: number;
  } {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyCompletions: { date: Date; completed: number }[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const completed = logs.filter(log => 
        this.isSameDay(new Date(log.date), date) && log.completed
      ).length;
      
      dailyCompletions.push({ date, completed });
    }
    
    const activeDays = dailyCompletions.filter(d => d.completed > 0).length;
    const totalCompletions = dailyCompletions.reduce((sum, d) => sum + d.completed, 0);
    const totalPossible = daysInMonth * habits.length;
    const completionRate = totalPossible > 0 ? totalCompletions / totalPossible : 0;
    
    const bestDay = dailyCompletions.reduce((best, current) => 
      current.completed > (best?.completed || 0) ? current : best, null as any
    );
    
    const worstDay = dailyCompletions.reduce((worst, current) => 
      current.completed < (worst?.completed || Infinity) ? current : worst, null as any
    );
    
    // Calculate current streak (from end of month backwards)
    let streak = 0;
    for (let i = dailyCompletions.length - 1; i >= 0; i--) {
      if (dailyCompletions[i].completed > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return {
      totalDays: daysInMonth,
      activeDays,
      completionRate,
      bestDay: bestDay?.completed > 0 ? bestDay : null,
      worstDay: worstDay?.completed < habits.length ? worstDay : null,
      streak
    };
  }
  
  exportCalendarToICS(habits: Habit[], logs: HabitLog[], startDate: Date, endDate: Date): string {
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ListOnTheGo//Habit Tracker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayLogs = logs.filter(log => 
        this.isSameDay(new Date(log.date), currentDate) && log.completed
      );
      
      dayLogs.forEach(log => {
        const habit = habits.find(h => h.id === log.habitId);
        if (habit) {
          const eventDate = this.formatDateForICS(currentDate);
          icsLines.push(
            'BEGIN:VEVENT',
            `UID:${log.id}@listonthego.app`,
            `DTSTART;VALUE=DATE:${eventDate}`,
            `DTEND;VALUE=DATE:${eventDate}`,
            `SUMMARY:${habit.name} ✓`,
            `DESCRIPTION:Completed habit: ${habit.name}`,
            'STATUS:CONFIRMED',
            'TRANSP:TRANSPARENT',
            'END:VEVENT'
          );
        }
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    icsLines.push('END:VCALENDAR');
    return icsLines.join('\r\n');
  }
  
  private formatDateForICS(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }
  
  // Utility methods for date navigation
  getPreviousMonth(year: number, month: number): { year: number; month: number } {
    if (month === 0) {
      return { year: year - 1, month: 11 };
    }
    return { year, month: month - 1 };
  }
  
  getNextMonth(year: number, month: number): { year: number; month: number } {
    if (month === 11) {
      return { year: year + 1, month: 0 };
    }
    return { year, month: month + 1 };
  }
  
  getStartOfWeek(date: Date): Date {
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    startDate.setHours(0, 0, 0, 0);
    return startDate;
  }
  
  getEndOfWeek(date: Date): Date {
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  }
}

export const habitCalendarService = new HabitCalendarService();
export default habitCalendarService; 