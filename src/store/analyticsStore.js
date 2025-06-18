import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAnalyticsStore = create((set) => ({
  studySessions: [],
  streaks: {
    current: 0,
    longest: 0,
    lastStudyDate: null,
  },
  focusMetrics: {
    completed: 0,
    abandoned: 0,
  },
  peakProductivityHours: {},
  
  // Add a new study session
  addStudySession: (session) => {
    set((state) => {
      const newSessions = [...state.studySessions, session];
      AsyncStorage.setItem('studySessions', JSON.stringify(newSessions));
      return { studySessions: newSessions };
    });
  },

  // Update focus metrics
  updateFocusMetrics: (completed, abandoned) => {
    set((state) => {
      const newMetrics = {
        completed: state.focusMetrics.completed + completed,
        abandoned: state.focusMetrics.abandoned + abandoned,
      };
      AsyncStorage.setItem('focusMetrics', JSON.stringify(newMetrics));
      return { focusMetrics: newMetrics };
    });
  },

  // Update streak
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

      AsyncStorage.setItem('streaks', JSON.stringify(newStreaks));
      return { streaks: newStreaks };
    });
  },

  // Update peak productivity hours
  updatePeakProductivity: (hour, duration) => {
    set((state) => {
      const newPeakHours = { ...state.peakProductivityHours };
      newPeakHours[hour] = (newPeakHours[hour] || 0) + duration;
      AsyncStorage.setItem('peakProductivityHours', JSON.stringify(newPeakHours));
      return { peakProductivityHours: newPeakHours };
    });
  },

  // Load saved data
  loadSavedData: async () => {
    try {
      const [sessions, metrics, streaks, peakHours] = await Promise.all([
        AsyncStorage.getItem('studySessions'),
        AsyncStorage.getItem('focusMetrics'),
        AsyncStorage.getItem('streaks'),
        AsyncStorage.getItem('peakProductivityHours'),
      ]);

      set({
        studySessions: sessions ? JSON.parse(sessions) : [],
        focusMetrics: metrics ? JSON.parse(metrics) : { completed: 0, abandoned: 0 },
        streaks: streaks ? JSON.parse(streaks) : { current: 0, longest: 0, lastStudyDate: null },
        peakProductivityHours: peakHours ? JSON.parse(peakHours) : {},
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  },
}));

export default useAnalyticsStore; 