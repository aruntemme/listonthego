import { HabitTemplate } from '../types';

class HabitTemplatesService {
  private templates: HabitTemplate[] = [
    // Popular Templates
    {
      id: 'template-1',
      name: 'Morning Meditation',
      description: 'Start your day with 10 minutes of mindfulness meditation',
      frequency: 'daily',
      category: 'Mindfulness',
      templateCategory: 'popular',
      goal: 30,
      color: '#6B7280',
      tags: ['mindfulness', 'morning', 'wellness'],
      difficulty: 'easy',
      estimatedTime: 10,
      benefits: ['Reduced stress', 'Better focus', 'Improved emotional regulation'],
      tips: ['Start with just 5 minutes', 'Use a meditation app', 'Create a quiet space']
    },
    {
      id: 'template-2',
      name: 'Daily Exercise',
      description: 'Get your body moving with 30 minutes of physical activity',
      frequency: 'daily',
      category: 'Fitness',
      templateCategory: 'popular',
      goal: 21,
      color: '#374151',
      tags: ['fitness', 'health', 'energy'],
      difficulty: 'medium',
      estimatedTime: 30,
      benefits: ['Improved cardiovascular health', 'Increased energy', 'Better sleep'],
      tips: ['Start with 15 minutes', 'Find activities you enjoy', 'Schedule it like an appointment']
    },
    {
      id: 'template-3',
      name: 'Read Daily',
      description: 'Expand your knowledge by reading for 20 minutes each day',
      frequency: 'daily',
      category: 'Learning',
      templateCategory: 'popular',
      goal: 50,
      color: '#4B5563',
      tags: ['learning', 'books', 'knowledge'],
      difficulty: 'easy',
      estimatedTime: 20,
      benefits: ['Expanded vocabulary', 'Increased knowledge', 'Better focus'],
      tips: ['Keep a book nearby', 'Set a specific time', 'Start with topics you enjoy']
    },

    // Health Templates
    {
      id: 'template-4',
      name: 'Drink 8 Glasses of Water',
      description: 'Stay hydrated throughout the day',
      frequency: 'daily',
      category: 'Health',
      templateCategory: 'health',
      goal: 30,
      color: '#000000',
      tags: ['hydration', 'health', 'wellness'],
      difficulty: 'easy',
      estimatedTime: 0,
      benefits: ['Better skin', 'Improved energy', 'Better digestion'],
      tips: ['Use a water bottle with markers', 'Set hourly reminders', 'Flavor with lemon']
    },
    {
      id: 'template-5',
      name: 'Take Vitamins',
      description: 'Remember to take your daily vitamins and supplements',
      frequency: 'daily',
      category: 'Health',
      templateCategory: 'health',
      goal: 90,
      color: '#000000',
      tags: ['vitamins', 'health', 'supplements'],
      difficulty: 'easy',
      estimatedTime: 1,
      benefits: ['Better immune system', 'Improved nutrition', 'Better energy'],
      tips: ['Set them next to your coffee', 'Use a pill organizer', 'Take with food']
    },
    {
      id: 'template-6',
      name: 'Sleep 8 Hours',
      description: 'Get quality sleep for optimal health',
      frequency: 'daily',
      category: 'Health',
      templateCategory: 'health',
      goal: 21,
      color: '#000000',
      tags: ['sleep', 'rest', 'recovery'],
      difficulty: 'medium',
      estimatedTime: 480,
      benefits: ['Better mood', 'Improved focus', 'Better immune system'],
      tips: ['Set a bedtime routine', 'No screens before bed', 'Keep room cool and dark']
    },

    // Productivity Templates
    {
      id: 'template-7',
      name: 'Plan Tomorrow',
      description: 'Spend 10 minutes planning your next day',
      frequency: 'daily',
      category: 'Productivity',
      templateCategory: 'productivity',
      goal: 30,
      color: '#4B5563',
      tags: ['planning', 'productivity', 'organization'],
      difficulty: 'easy',
      estimatedTime: 10,
      benefits: ['Better time management', 'Reduced stress', 'Clearer priorities'],
      tips: ['Do it before bed', 'Keep it simple', 'Focus on top 3 priorities']
    },
    {
      id: 'template-8',
      name: 'Deep Work Session',
      description: '2 hours of focused, uninterrupted work',
      frequency: 'daily',
      category: 'Productivity',
      templateCategory: 'productivity',
      goal: 14,
      color: '#4B5563',
      tags: ['focus', 'productivity', 'work'],
      difficulty: 'hard',
      estimatedTime: 120,
      benefits: ['Higher quality output', 'Faster progress', 'Reduced multitasking'],
      tips: ['Turn off notifications', 'Block distracting websites', 'Take breaks every 45 minutes']
    },

    // Mindfulness Templates
    {
      id: 'template-9',
      name: 'Gratitude Journal',
      description: 'Write down 3 things you\'re grateful for',
      frequency: 'daily',
      category: 'Mindfulness',
      templateCategory: 'mindfulness',
      goal: 30,
      color: '#6B7280',
      tags: ['gratitude', 'mindfulness', 'positivity'],
      difficulty: 'easy',
      estimatedTime: 5,
      benefits: ['Improved mood', 'Better relationships', 'Increased optimism'],
      tips: ['Be specific', 'Include why you\'re grateful', 'Do it at the same time daily']
    },
    {
      id: 'template-10',
      name: 'Digital Detox Hour',
      description: 'One hour without any digital devices',
      frequency: 'daily',
      category: 'Mindfulness',
      templateCategory: 'mindfulness',
      goal: 21,
      color: '#6B7280',
      tags: ['digital detox', 'mindfulness', 'presence'],
      difficulty: 'medium',
      estimatedTime: 60,
      benefits: ['Reduced anxiety', 'Better sleep', 'Increased presence'],
      tips: ['Start with 30 minutes', 'Have analog activities ready', 'Tell others about your detox time']
    },

    // Fitness Templates
    {
      id: 'template-11',
      name: '10,000 Steps',
      description: 'Walk at least 10,000 steps each day',
      frequency: 'daily',
      category: 'Fitness',
      templateCategory: 'fitness',
      goal: 30,
      color: '#374151',
      tags: ['walking', 'fitness', 'cardio'],
      difficulty: 'medium',
      estimatedTime: 90,
      benefits: ['Better cardiovascular health', 'Weight management', 'Improved mood'],
      tips: ['Park farther away', 'Take stairs', 'Walk during phone calls']
    },
    {
      id: 'template-12',
      name: 'Strength Training',
      description: 'Complete a strength training workout',
      frequency: 'weekly',
      category: 'Fitness',
      templateCategory: 'fitness',
      goal: 3,
      color: '#374151',
      tags: ['strength', 'fitness', 'muscle'],
      difficulty: 'medium',
      estimatedTime: 45,
      benefits: ['Increased strength', 'Better bone density', 'Improved metabolism'],
      tips: ['Start with bodyweight exercises', 'Focus on form', 'Progress gradually']
    },

    // Learning Templates
    {
      id: 'template-13',
      name: 'Learn a New Language',
      description: 'Practice a foreign language for 15 minutes',
      frequency: 'daily',
      category: 'Learning',
      templateCategory: 'learning',
      goal: 90,
      color: '#4B5563',
      tags: ['language', 'learning', 'culture'],
      difficulty: 'medium',
      estimatedTime: 15,
      benefits: ['Cognitive benefits', 'Cultural understanding', 'Career opportunities'],
      tips: ['Use language apps', 'Practice speaking', 'Immerse yourself in content']
    },
    {
      id: 'template-14',
      name: 'Learn Something New',
      description: 'Dedicate time to learning a new skill or topic',
      frequency: 'weekly',
      category: 'Learning',
      templateCategory: 'learning',
      goal: 4,
      color: '#4B5563',
      tags: ['skill', 'learning', 'growth'],
      difficulty: 'easy',
      estimatedTime: 60,
      benefits: ['Personal growth', 'Career development', 'Mental stimulation'],
      tips: ['Choose topics you\'re curious about', 'Use online courses', 'Practice regularly']
    }
  ];

  getTemplatesByCategory(category?: string): HabitTemplate[] {
    if (!category || category === 'all') {
      return this.templates;
    }
    return this.templates.filter(template => template.templateCategory === category);
  }

  getPopularTemplates(): HabitTemplate[] {
    return this.templates.filter(template => template.templateCategory === 'popular');
  }

  getTemplateById(id: string): HabitTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  searchTemplates(query: string): HabitTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return this.templates.filter(template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description?.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  getTemplateCategories(): string[] {
    return ['all', 'popular', 'health', 'productivity', 'mindfulness', 'fitness', 'learning'];
  }

  getDifficultyLevels(): string[] {
    return ['easy', 'medium', 'hard'];
  }

  getTemplatesByDifficulty(difficulty: string): HabitTemplate[] {
    return this.templates.filter(template => template.difficulty === difficulty);
  }

  getRandomTemplate(): HabitTemplate {
    const randomIndex = Math.floor(Math.random() * this.templates.length);
    return this.templates[randomIndex];
  }

  getTemplatesForBeginner(): HabitTemplate[] {
    return this.templates.filter(template => 
      template.difficulty === 'easy' && template.estimatedTime <= 15
    );
  }
}

export const habitTemplatesService = new HabitTemplatesService();
export default habitTemplatesService; 