import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
  constructor() {
    this.initializeNotifications();
  }

  async initializeNotifications() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async scheduleStudyReminder(reminder) {
    const { title, body, date, type } = reminder;
    
    const trigger = new Date(date);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type },
      },
      trigger,
    });
  }

  async scheduleBreakReminder(duration, studySessionLength) {
    const breakTime = new Date(Date.now() + studySessionLength * 60 * 1000);
    
    await this.scheduleStudyReminder({
      title: 'Time for a Break!',
      body: `You've been studying for ${studySessionLength} minutes. Take a ${duration}-minute break to maintain focus.`,
      date: breakTime,
      type: 'break',
    });
  }

  async scheduleDeadlineAlert(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline.date);
    const timeUntilDeadline = deadlineDate - now;
    
    // Schedule alerts at different intervals
    const intervals = [
      { days: 7, message: '1 week until deadline' },
      { days: 3, message: '3 days until deadline' },
      { days: 1, message: '24 hours until deadline' },
    ];

    for (const interval of intervals) {
      const alertTime = new Date(deadlineDate.getTime() - interval.days * 24 * 60 * 60 * 1000);
      if (alertTime > now) {
        await this.scheduleStudyReminder({
          title: `Deadline Alert: ${deadline.title}`,
          body: interval.message,
          date: alertTime,
          type: 'deadline',
        });
      }
    }
  }

  async optimizeStudySchedule(energyLevel, availableTime) {
    // Simple algorithm to suggest study times based on energy level
    const studyDuration = Math.min(availableTime, energyLevel * 30); // 30 minutes per energy level
    const breakDuration = Math.floor(studyDuration / 4); // 15-minute break for every hour of study

    return {
      studyDuration,
      breakDuration,
      recommendedStartTime: new Date(),
    };
  }

  async saveNotificationPreferences(preferences) {
    try {
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  async getNotificationPreferences() {
    try {
      const preferences = await AsyncStorage.getItem('notificationPreferences');
      return preferences ? JSON.parse(preferences) : null;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }
}

export default new NotificationService(); 