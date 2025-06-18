import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

const useAnalyticsStore = create((set, get) => ({
  studySessions: [],
  streaks: {
    current: 0,
    longest: 0,
    lastStudyDate: null,
  },
  focusMetrics: {
    completed: 0,
    abandoned: 0,
    interruptions: 0,
    totalFocusTime: 0,
    deepFocusPeriods: 0, // 25+ minutes of uninterrupted focus
  },
  subjectMetrics: {},
  learningPatterns: {
    bestTimeOfDay: null,
    bestDayOfWeek: null,
    averageSessionLength: 0,
    mostProductiveSubject: null,
  },
  goals: {
    daily: { target: 120, achieved: 0 }, // minutes
    weekly: { target: 600, achieved: 0 }, // minutes
    streak: { target: 5, achieved: 0 },
  },
  peakProductivityHours: {},
  
  // Add a new study session with enhanced metrics
  addStudySession: (session) => {
    set((state) => {
      const newSessions = [...state.studySessions, {
        ...session,
        timestamp: new Date().toISOString(),
        interruptions: session.interruptions || 0,
        focusScore: calculateFocusScore(session),
        deepFocusPeriods: calculateDeepFocusPeriods(session),
      }];

      // Update subject metrics
      const subjectMetrics = { ...state.subjectMetrics };
      const subject = session.subject;
      
      if (!subjectMetrics[subject]) {
        subjectMetrics[subject] = {
          totalTime: 0,
          sessionsCompleted: 0,
          averageScore: 0,
          improvement: 0,
          lastScore: 0,
        };
      }

      const metrics = subjectMetrics[subject];
      metrics.totalTime += session.duration;
      metrics.sessionsCompleted += 1;
      metrics.lastScore = session.focusScore;
      metrics.averageScore = (metrics.averageScore * (metrics.sessionsCompleted - 1) + session.focusScore) / metrics.sessionsCompleted;
      metrics.improvement = metrics.lastScore - metrics.averageScore;

      // Update learning patterns
      const patterns = analyzeLearningPatterns([...state.studySessions, session]);
      
      // Update goals
      const goals = updateGoals(state.goals, session);

      AsyncStorage.setItem('studySessions', JSON.stringify(newSessions));
      AsyncStorage.setItem('subjectMetrics', JSON.stringify(subjectMetrics));
      AsyncStorage.setItem('learningPatterns', JSON.stringify(patterns));
      AsyncStorage.setItem('goals', JSON.stringify(goals));

      return { 
        studySessions: newSessions,
        subjectMetrics,
        learningPatterns: patterns,
        goals,
      };
    });
  },

  // Update focus metrics with more detailed tracking
  updateFocusMetrics: (session) => {
    set((state) => {
      const newMetrics = {
        completed: state.focusMetrics.completed + (session.completed ? 1 : 0),
        abandoned: state.focusMetrics.abandoned + (session.completed ? 0 : 1),
        interruptions: state.focusMetrics.interruptions + (session.interruptions || 0),
        totalFocusTime: state.focusMetrics.totalFocusTime + session.duration,
        deepFocusPeriods: state.focusMetrics.deepFocusPeriods + calculateDeepFocusPeriods(session),
      };

      AsyncStorage.setItem('focusMetrics', JSON.stringify(newMetrics));
      return { focusMetrics: newMetrics };
    });
  },

  // Update streak with enhanced tracking
  updateStreak: (date) => {
    set((state) => {
      const lastDate = state.streaks.lastStudyDate;
      const currentStreak = state.streaks.current;
      
      let newStreak = currentStreak;
      if (lastDate) {
        const daysDiff = Math.floor((date - new Date(lastDate)) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          newStreak += 1;
        } else if (daysDiff > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const newStreaks = {
        current: newStreak,
        longest: Math.max(newStreak, state.streaks.longest),
        lastStudyDate: date.toISOString(),
      };

      // Update goals based on streak
      const goals = { ...state.goals };
      goals.streak.achieved = newStreak;

      AsyncStorage.setItem('streaks', JSON.stringify(newStreaks));
      AsyncStorage.setItem('goals', JSON.stringify(goals));
      return { 
        streaks: newStreaks,
        goals,
      };
    });
  },

  // Update peak productivity hours with enhanced analysis
  updatePeakProductivity: (session) => {
    set((state) => {
      const hour = new Date(session.startTime).getHours();
      const newPeakHours = { ...state.peakProductivityHours };
      
      if (!newPeakHours[hour]) {
        newPeakHours[hour] = {
          totalDuration: 0,
          sessions: 0,
          averageFocusScore: 0,
        };
      }

      const hourMetrics = newPeakHours[hour];
      hourMetrics.totalDuration += session.duration;
      hourMetrics.sessions += 1;
      hourMetrics.averageFocusScore = 
        (hourMetrics.averageFocusScore * (hourMetrics.sessions - 1) + session.focusScore) / hourMetrics.sessions;

      AsyncStorage.setItem('peakProductivityHours', JSON.stringify(newPeakHours));
      return { peakProductivityHours: newPeakHours };
    });
  },

  // Set goals
  setGoals: (newGoals) => {
    set((state) => {
      AsyncStorage.setItem('goals', JSON.stringify(newGoals));
      return { goals: newGoals };
    });
  },

  // Load saved data with enhanced metrics
  loadSavedData: async () => {
    try {
      const [
        sessions,
        metrics,
        streaks,
        peakHours,
        subjectMetrics,
        patterns,
        goals
      ] = await Promise.all([
        AsyncStorage.getItem('studySessions'),
        AsyncStorage.getItem('focusMetrics'),
        AsyncStorage.getItem('streaks'),
        AsyncStorage.getItem('peakProductivityHours'),
        AsyncStorage.getItem('subjectMetrics'),
        AsyncStorage.getItem('learningPatterns'),
        AsyncStorage.getItem('goals'),
      ]);

      set({
        studySessions: sessions ? JSON.parse(sessions) : [],
        focusMetrics: metrics ? JSON.parse(metrics) : {
          completed: 0,
          abandoned: 0,
          interruptions: 0,
          totalFocusTime: 0,
          deepFocusPeriods: 0,
        },
        streaks: streaks ? JSON.parse(streaks) : {
          current: 0,
          longest: 0,
          lastStudyDate: null,
        },
        peakProductivityHours: peakHours ? JSON.parse(peakHours) : {},
        subjectMetrics: subjectMetrics ? JSON.parse(subjectMetrics) : {},
        learningPatterns: patterns ? JSON.parse(patterns) : {
          bestTimeOfDay: null,
          bestDayOfWeek: null,
          averageSessionLength: 0,
          mostProductiveSubject: null,
        },
        goals: goals ? JSON.parse(goals) : {
          daily: { target: 120, achieved: 0 },
          weekly: { target: 600, achieved: 0 },
          streak: { target: 5, achieved: 0 },
        },
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  },
}));

// Helper functions for analytics calculations
const calculateFocusScore = (session) => {
  const baseScore = session.completed ? 100 : 50;
  const interruptionPenalty = (session.interruptions || 0) * 5;
  const durationBonus = Math.min(20, Math.floor(session.duration / (25 * 60) * 20));
  return Math.max(0, Math.min(100, baseScore - interruptionPenalty + durationBonus));
};

const calculateDeepFocusPeriods = (session) => {
  return Math.floor(session.duration / (25 * 60));
};

const analyzeLearningPatterns = (sessions) => {
  if (sessions.length === 0) {
    return {
      bestTimeOfDay: null,
      bestDayOfWeek: null,
      averageSessionLength: 0,
      mostProductiveSubject: null,
    };
  }

  // Group sessions by hour and calculate average focus score
  const hourlyScores = {};
  const dailyScores = {};
  const subjectScores = {};
  let totalDuration = 0;

  sessions.forEach(session => {
    const date = new Date(session.startTime);
    const hour = date.getHours();
    const day = date.getDay();
    const subject = session.subject;

    // Hourly analysis
    if (!hourlyScores[hour]) hourlyScores[hour] = { total: 0, count: 0 };
    hourlyScores[hour].total += session.focusScore;
    hourlyScores[hour].count += 1;

    // Daily analysis
    if (!dailyScores[day]) dailyScores[day] = { total: 0, count: 0 };
    dailyScores[day].total += session.focusScore;
    dailyScores[day].count += 1;

    // Subject analysis
    if (!subjectScores[subject]) subjectScores[subject] = { total: 0, count: 0 };
    subjectScores[subject].total += session.focusScore;
    subjectScores[subject].count += 1;

    totalDuration += session.duration;
  });

  // Find best time of day
  const bestTimeOfDay = Object.entries(hourlyScores)
    .map(([hour, scores]) => ({
      hour: parseInt(hour),
      average: scores.total / scores.count,
    }))
    .sort((a, b) => b.average - a.average)[0]?.hour;

  // Find best day of week
  const bestDayOfWeek = Object.entries(dailyScores)
    .map(([day, scores]) => ({
      day: parseInt(day),
      average: scores.total / scores.count,
    }))
    .sort((a, b) => b.average - a.average)[0]?.day;

  // Find most productive subject
  const mostProductiveSubject = Object.entries(subjectScores)
    .map(([subject, scores]) => ({
      subject,
      average: scores.total / scores.count,
    }))
    .sort((a, b) => b.average - a.average)[0]?.subject;

  return {
    bestTimeOfDay,
    bestDayOfWeek,
    averageSessionLength: totalDuration / sessions.length,
    mostProductiveSubject,
  };
};

const updateGoals = (currentGoals, session) => {
  const today = new Date();
  const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 });
  const endOfWeekDate = endOfWeek(today, { weekStartsOn: 1 });
  
  // Update daily goal
  const dailyMinutes = Math.floor(session.duration / 60);
  currentGoals.daily.achieved = Math.min(
    currentGoals.daily.target,
    currentGoals.daily.achieved + dailyMinutes
  );

  // Update weekly goal
  if (new Date(session.startTime) >= startOfWeekDate && new Date(session.startTime) <= endOfWeekDate) {
    currentGoals.weekly.achieved = Math.min(
      currentGoals.weekly.target,
      currentGoals.weekly.achieved + dailyMinutes
    );
  }

  return currentGoals;
};

export default useAnalyticsStore; 