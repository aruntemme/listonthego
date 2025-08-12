import { Habit, HabitLog, HabitAnalytics, HabitInsight } from '../types';

class HabitAnalyticsService {
  
  calculateAnalytics(habit: Habit, logs: HabitLog[]): HabitAnalytics {
    const habitLogs = logs.filter(log => log.habitId === habit.id);
    const completedLogs = habitLogs.filter(log => log.completed);

    // Basic stats
    const totalCompletions = completedLogs.length;
    const currentStreak = this.calculateCurrentStreak(habitLogs);
    const longestStreak = this.calculateLongestStreak(habitLogs);

    // Completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = habitLogs.filter(log => log.date >= thirtyDaysAgo);
    const completionRate = recentLogs.length > 0 ? 
      (recentLogs.filter(log => log.completed).length / recentLogs.length) * 100 : 0;

    // Mood and effort averages
    const logsWithMood = completedLogs.filter(log => log.mood);
    const logsWithEffort = completedLogs.filter(log => log.effort);
    const averageMood = logsWithMood.length > 0 ? 
      logsWithMood.reduce((sum, log) => sum + (log.mood || 0), 0) / logsWithMood.length : undefined;
    const averageEffort = logsWithEffort.length > 0 ? 
      logsWithEffort.reduce((sum, log) => sum + (log.effort || 0), 0) / logsWithEffort.length : undefined;

    // Weekly and monthly completions
    const weeklyCompletions = this.getWeeklyCompletions(completedLogs);
    const monthlyCompletions = this.getMonthlyCompletions(completedLogs);

    // Best day of week
    const bestDay = this.getBestDayOfWeek(completedLogs);

    // Missed days (last 30 days for daily habits)
    const expectedDays = habit.frequency === 'daily' ? 30 : 
                        habit.frequency === 'weekly' ? 4 : 1;
    const actualCompletions = recentLogs.filter(log => log.completed).length;
    const missedDays = Math.max(0, expectedDays - actualCompletions);

    // Consistency score (0-100)
    const consistency = this.calculateConsistencyScore(habit, habitLogs);

    return {
      totalCompletions,
      currentStreak,
      longestStreak,
      completionRate: Math.round(completionRate * 100) / 100,
      averageMood,
      averageEffort,
      weeklyCompletions,
      monthlyCompletions,
      bestDay,
      missedDays,
      consistency
    };
  }

  private calculateCurrentStreak(logs: HabitLog[]): number {
    const completedLogs = logs.filter(log => log.completed)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    if (completedLogs.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const log of completedLogs) {
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
  }

  private calculateLongestStreak(logs: HabitLog[]): number {
    const completedLogs = logs.filter(log => log.completed)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (completedLogs.length === 0) return 0;

    let longestStreak = 0;
    let currentStreak = 1;
    let previousDate = new Date(completedLogs[0].date);

    for (let i = 1; i < completedLogs.length; i++) {
      const currentDate = new Date(completedLogs[i].date);
      const diffTime = currentDate.getTime() - previousDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }

      previousDate = currentDate;
    }

    return Math.max(longestStreak, currentStreak);
  }

  private getWeeklyCompletions(logs: HabitLog[]): number[] {
    const weeks: number[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekCompletions = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= weekStart && logDate <= weekEnd;
      }).length;

      weeks.push(weekCompletions);
    }

    return weeks;
  }

  private getMonthlyCompletions(logs: HabitLog[]): number[] {
    const months: number[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthCompletions = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= monthStart && logDate <= monthEnd;
      }).length;

      months.push(monthCompletions);
    }

    return months;
  }

  private getBestDayOfWeek(logs: HabitLog[]): string {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = new Array(7).fill(0);

    logs.forEach(log => {
      const dayOfWeek = new Date(log.date).getDay();
      dayCounts[dayOfWeek]++;
    });

    const bestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    return dayNames[bestDayIndex];
  }

  private calculateConsistencyScore(habit: Habit, logs: HabitLog[]): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLogs = logs.filter(log => log.date >= thirtyDaysAgo);
    
    if (recentLogs.length === 0) return 0;

    // Calculate expected vs actual completions
    const expectedDays = habit.frequency === 'daily' ? 30 : 
                        habit.frequency === 'weekly' ? 4 : 1;
    const actualCompletions = recentLogs.filter(log => log.completed).length;
    
    // Calculate gaps in completion
    const completedDates = recentLogs.filter(log => log.completed)
      .map(log => new Date(log.date).getTime())
      .sort((a, b) => a - b);

    let gapPenalty = 0;
    for (let i = 1; i < completedDates.length; i++) {
      const gap = (completedDates[i] - completedDates[i-1]) / (1000 * 60 * 60 * 24);
      if (gap > 1) {
        gapPenalty += gap - 1;
      }
    }

    const baseScore = Math.min(100, (actualCompletions / expectedDays) * 100);
    const consistencyPenalty = Math.min(50, gapPenalty * 2);
    
    return Math.max(0, Math.round(baseScore - consistencyPenalty));
  }

  generateInsights(habit: Habit, analytics: HabitAnalytics, allHabits: Habit[]): HabitInsight[] {
    const insights: HabitInsight[] = [];

    // Streak insights
    if (analytics.currentStreak > 0) {
      if (analytics.currentStreak >= 7) {
        insights.push({
          id: `streak-${habit.id}`,
          type: 'streak',
          title: 'Great Streak!',
          description: `You're on a ${analytics.currentStreak}-day streak with ${habit.name}`,
          value: analytics.currentStreak,
          trend: 'up',
          actionable: false
        });
      }
      
      if (analytics.currentStreak === analytics.longestStreak && analytics.currentStreak >= 5) {
        insights.push({
          id: `personal-best-${habit.id}`,
          type: 'streak',
          title: 'Personal Best!',
          description: `This is your longest streak for ${habit.name}`,
          value: analytics.longestStreak,
          trend: 'up',
          actionable: false
        });
      }
    }

    // Completion rate insights
    if (analytics.completionRate >= 80) {
      insights.push({
        id: `completion-high-${habit.id}`,
        type: 'completion',
        title: 'Excellent Consistency',
        description: `${analytics.completionRate}% completion rate is outstanding`,
        value: `${analytics.completionRate}%`,
        trend: 'up',
        actionable: false
      });
    } else if (analytics.completionRate < 50) {
      insights.push({
        id: `completion-low-${habit.id}`,
        type: 'completion',
        title: 'Room for Improvement',
        description: `${analytics.completionRate}% completion rate could be better`,
        value: `${analytics.completionRate}%`,
        trend: 'down',
        actionable: true,
        suggestion: 'Try reducing the habit to a smaller, more manageable version'
      });
    }

    // Consistency insights
    if (analytics.consistency >= 90) {
      insights.push({
        id: `consistency-high-${habit.id}`,
        type: 'consistency',
        title: 'Very Consistent',
        description: `You're maintaining great consistency with ${habit.name}`,
        value: analytics.consistency,
        trend: 'stable',
        actionable: false
      });
    } else if (analytics.consistency < 60) {
      insights.push({
        id: `consistency-low-${habit.id}`,
        type: 'consistency',
        title: 'Inconsistent Pattern',
        description: `Try to reduce gaps between completions`,
        value: analytics.consistency,
        trend: 'down',
        actionable: true,
        suggestion: 'Set up reminders or pair this habit with an existing routine'
      });
    }

    // Mood insights
    if (analytics.averageMood && analytics.averageMood >= 4) {
      insights.push({
        id: `mood-positive-${habit.id}`,
        type: 'mood',
        title: 'Positive Impact',
        description: `${habit.name} seems to boost your mood`,
        value: analytics.averageMood.toFixed(1),
        trend: 'up',
        actionable: false
      });
    }

    // Best day insight
    if (analytics.bestDay) {
      insights.push({
        id: `best-day-${habit.id}`,
        type: 'completion',
        title: 'Best Day Pattern',
        description: `You complete ${habit.name} most often on ${analytics.bestDay}`,
        value: analytics.bestDay,
        trend: 'stable',
        actionable: true,
        suggestion: 'Consider scheduling this habit on your most successful day'
      });
    }

    // Recommendations based on other habits
    const categoryHabits = allHabits.filter(h => h.category === habit.category && h.id !== habit.id);
    if (categoryHabits.length > 0) {
      const avgCompletionRate = categoryHabits.reduce((sum, h) => {
        console.log(h.name, analytics.completionRate);
        // This would need analytics for other habits, simplified for now
        return sum + 70; // placeholder
      }, 0) / categoryHabits.length;

      if (analytics.completionRate > avgCompletionRate + 20) {
        insights.push({
          id: `category-leader-${habit.id}`,
          type: 'recommendation',
          title: 'Category Leader',
          description: `You're excelling in ${habit.category} habits`,
          trend: 'up',
          actionable: true,
          suggestion: 'Consider adding another habit in this category'
        });
      }
    }

    return insights;
  }

  getOverallInsights(habits: Habit[], allLogs: HabitLog[]): HabitInsight[] {
    const insights: HabitInsight[] = [];

    // Overall completion rate
    const completedLogs = allLogs.filter(log => log.completed);
    const totalCompletionRate = allLogs.length > 0 ? 
      (completedLogs.length / allLogs.length) * 100 : 0;

    if (totalCompletionRate >= 75) {
      insights.push({
        id: 'overall-excellent',
        type: 'completion',
        title: 'Excellent Overall Progress',
        description: `${Math.round(totalCompletionRate)}% completion rate across all habits`,
        value: `${Math.round(totalCompletionRate)}%`,
        trend: 'up',
        actionable: false
      });
    }

    // Category insights
    const categoryStats = this.getCategoryStats(habits, allLogs);
    const bestCategory = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b.completionRate - a.completionRate)[0];

    if (bestCategory && bestCategory[1].completionRate > 80) {
      insights.push({
        id: 'best-category',
        type: 'recommendation',
        title: 'Strongest Category',
        description: `You excel at ${bestCategory[0]} habits`,
        value: `${Math.round(bestCategory[1].completionRate)}%`,
        trend: 'up',
        actionable: true,
        suggestion: 'Consider adding more habits in this successful category'
      });
    }

    return insights;
  }

  private getCategoryStats(habits: Habit[], logs: HabitLog[]): Record<string, { count: number; completionRate: number }> {
    const stats: Record<string, { count: number; completionRate: number }> = {};

    habits.forEach(habit => {
      const habitLogs = logs.filter(log => log.habitId === habit.id);
      const completedLogs = habitLogs.filter(log => log.completed);
      const completionRate = habitLogs.length > 0 ? 
        (completedLogs.length / habitLogs.length) * 100 : 0;

      if (!stats[habit.category]) {
        stats[habit.category] = { count: 0, completionRate: 0 };
      }

      stats[habit.category].count++;
      stats[habit.category].completionRate = 
        (stats[habit.category].completionRate * (stats[habit.category].count - 1) + completionRate) / 
        stats[habit.category].count;
    });

    return stats;
  }
}

export const habitAnalyticsService = new HabitAnalyticsService();
export default habitAnalyticsService; 