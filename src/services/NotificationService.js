import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
  constructor() {
    this.initializeNotifications();
    this.scheduledNotifications = new Map();
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

    // Configure notification behavior with updated properties
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Load existing scheduled notifications
    await this.loadScheduledNotifications();
  }

  async loadScheduledNotifications() {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      scheduled.forEach(notification => {
        this.scheduledNotifications.set(notification.identifier, notification);
      });
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  }

  async scheduleStudyReminder(reminder) {
    const { title, body, date, type, identifier } = reminder;
    
    const trigger = new Date(date);
    const now = new Date();
    
    console.log('Scheduling notification:', {
      title,
      body,
      triggerTime: trigger.toISOString(),
      currentTime: now.toISOString(),
      timeDifference: trigger.getTime() - now.getTime(),
      triggerLocal: trigger.toLocaleString(),
      currentLocal: now.toLocaleString(),
    });
    
    // Don't schedule if the time has already passed or is too close (within 1 minute)
    if (trigger <= new Date(now.getTime() + 60000)) {
      console.log('Cannot schedule notification for past time or too close to current time');
      console.log('Trigger time:', trigger.toLocaleString());
      console.log('Current time:', now.toLocaleString());
      console.log('Time difference (ms):', trigger.getTime() - now.getTime());
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type, ...reminder },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: trigger,
        },
      });

      console.log('Notification scheduled successfully with ID:', notificationId);

      this.scheduledNotifications.set(notificationId, { ...reminder, identifier: notificationId });
      await this.saveScheduledNotifications();
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async scheduleBreakReminder(duration, studySessionLength, startTime) {
    const breakTime = new Date(startTime.getTime() + studySessionLength * 60 * 1000);
    const now = new Date();
    
    // Don't schedule if break time is in the past
    if (breakTime <= now) {
      console.log('Break time is in the past, cannot schedule');
      return null;
    }
    
    return await this.scheduleStudyReminder({
      title: 'Time for a Break! 🎯',
      body: `You've been studying for ${studySessionLength} minutes. Take a ${duration}-minute break to maintain focus and energy.`,
      date: breakTime,
      type: 'break',
    });
  }

  async scheduleDeadlineAlert(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline.date);
    const timeUntilDeadline = deadlineDate - now;
    
    // Don't schedule if deadline is in the past
    if (timeUntilDeadline <= 0) {
      console.log('Deadline is in the past, cannot schedule alerts');
      return [];
    }
    
    // Schedule alerts at different intervals based on deadline urgency
    const intervals = [
      { days: 7, message: `⏰ 1 week until "${deadline.title}" deadline` },
      { days: 3, message: `⚠️ 3 days until "${deadline.title}" deadline` },
      { days: 1, message: `🚨 24 hours until "${deadline.title}" deadline` },
      { hours: 6, message: `🔥 6 hours until "${deadline.title}" deadline` },
    ];

    const scheduledIds = [];

    for (const interval of intervals) {
      let alertTime;
      if (interval.days) {
        alertTime = new Date(deadlineDate.getTime() - interval.days * 24 * 60 * 60 * 1000);
      } else if (interval.hours) {
        alertTime = new Date(deadlineDate.getTime() - interval.hours * 60 * 60 * 1000);
      }

      // Only schedule if alert time is in the future and at least 1 minute from now
      if (alertTime > new Date(now.getTime() + 60000)) {
        const id = await this.scheduleStudyReminder({
          title: `Deadline Alert: ${deadline.title}`,
          body: interval.message,
          date: alertTime,
          type: 'deadline',
        });
        if (id) scheduledIds.push(id);
      }
    }

    return scheduledIds;
  }

  async optimizeStudySchedule(energyLevel, availableTime, preferredStartTime = null) {
    // If preferred time is provided, use it directly
    if (preferredStartTime) {
      const recommendedStartTime = new Date(preferredStartTime);
      const now = new Date();
      
      // Ensure the time is at least 1 minute from now
      if (recommendedStartTime <= new Date(now.getTime() + 60000)) {
        recommendedStartTime.setTime(now.getTime() + 60000);
      }
      
      // Calculate session intervals based on energy level
      const sessionIntervals = this.calculateSessionIntervals(availableTime, energyLevel);
      
      // Calculate break duration
      const breakDuration = this.calculateOptimalBreakDuration(availableTime, energyLevel);

      return {
        studyDuration: availableTime,
        breakDuration,
        recommendedStartTime,
        sessionIntervals,
        energyMultiplier: this.getEnergyMultiplier(energyLevel),
      };
    }

    // Only use optimal scheduling if no preferred time is provided
    const energyMultiplier = this.getEnergyMultiplier(energyLevel);
    const optimalStudyDuration = Math.min(availableTime, Math.floor(energyLevel * 25 * energyMultiplier));
    
    // Calculate break duration based on study duration and energy level
    const breakDuration = this.calculateOptimalBreakDuration(optimalStudyDuration, energyLevel);
    
    // Determine optimal start time based on energy level and preferences
    const recommendedStartTime = this.getOptimalStartTime(energyLevel, preferredStartTime);
    
    // Calculate session intervals
    const sessionIntervals = this.calculateSessionIntervals(optimalStudyDuration, energyLevel);

    return {
      studyDuration: optimalStudyDuration,
      breakDuration,
      recommendedStartTime,
      sessionIntervals,
      energyMultiplier,
    };
  }

  getEnergyMultiplier(energyLevel) {
    // Energy multipliers based on research on productivity and energy levels
    const multipliers = {
      1: 0.5,   // Very low energy - 50% efficiency
      2: 0.6,   // Low energy - 60% efficiency
      3: 0.7,   // Below average - 70% efficiency
      4: 0.8,   // Average - 80% efficiency
      5: 0.9,   // Above average - 90% efficiency
      6: 1.0,   // Good - 100% efficiency
      7: 1.1,   // Very good - 110% efficiency
      8: 1.2,   // High - 120% efficiency
      9: 1.3,   // Very high - 130% efficiency
      10: 1.4,  // Peak - 140% efficiency
    };
    return multipliers[energyLevel] || 1.0;
  }

  calculateOptimalBreakDuration(studyDuration, energyLevel) {
    // Break duration calculation based on study duration and energy level
    const baseBreakRatio = 0.25; // 15-minute break per hour
    const energyAdjustment = (10 - energyLevel) * 0.02; // More breaks for lower energy
    const adjustedRatio = baseBreakRatio + energyAdjustment;
    
    return Math.max(5, Math.floor(studyDuration * adjustedRatio));
  }

  getOptimalStartTime(energyLevel, preferredTime = null) {
    const now = new Date();
    
    // If preferred time is provided and it's in the future, use it
    if (preferredTime && preferredTime > new Date(now.getTime() + 60000)) {
      return preferredTime;
    }
    
    const currentHour = now.getHours();
    
    // Optimal study times based on energy level and circadian rhythms
    const optimalTimes = {
      1: [10, 14, 16], // Low energy - avoid early morning
      2: [9, 13, 15],
      3: [9, 12, 14],
      4: [8, 11, 13],
      5: [8, 10, 12, 14],
      6: [7, 9, 11, 13, 15],
      7: [7, 8, 10, 12, 14, 16],
      8: [6, 8, 10, 12, 14, 16],
      9: [6, 7, 9, 11, 13, 15, 17],
      10: [6, 7, 8, 10, 12, 14, 16, 18],
    };

    const optimalHours = optimalTimes[energyLevel] || optimalTimes[5];
    
    // Find the next optimal time
    let nextOptimalHour = optimalHours.find(hour => hour > currentHour);
    if (!nextOptimalHour) {
      // If no optimal time today, schedule for tomorrow
      nextOptimalHour = optimalHours[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(nextOptimalHour, 0, 0, 0);
      return tomorrow;
    }

    const optimalTime = new Date(now);
    optimalTime.setHours(nextOptimalHour, 0, 0, 0);
    
    return optimalTime;
  }

  calculateSessionIntervals(studyDuration, energyLevel) {
    // Calculate optimal session intervals based on energy level
    const maxSessionLength = Math.min(studyDuration, energyLevel * 30);
    const sessions = [];
    let remainingTime = studyDuration;
    
    while (remainingTime > 0) {
      const sessionLength = Math.min(maxSessionLength, remainingTime);
      sessions.push(sessionLength);
      remainingTime -= sessionLength;
    }
    
    return sessions;
  }

  async scheduleRecurringStudySession(schedule) {
    const { studyDuration, breakDuration, recommendedStartTime, sessionIntervals } = schedule;
    const scheduledIds = [];
    
    let currentTime = new Date(recommendedStartTime);
    const now = new Date();
    
    // Ensure the first session starts at least 1 minute from now
    if (currentTime <= new Date(now.getTime() + 60000)) {
      currentTime = new Date(now.getTime() + 60000);
    }
    
    for (let i = 0; i < sessionIntervals.length; i++) {
      const sessionLength = sessionIntervals[i];
      
      // Schedule study session start
      const studyId = await this.scheduleStudyReminder({
        title: `Study Session ${i + 1} Starting 📚`,
        body: `Time to focus! Your ${sessionLength}-minute study session is about to begin.`,
        date: currentTime,
        type: 'study',
        sessionNumber: i + 1,
      });
      
      if (studyId) scheduledIds.push(studyId);
      
      // Schedule break reminder
      const breakTime = new Date(currentTime.getTime() + sessionLength * 60 * 1000);
      const breakId = await this.scheduleBreakReminder(breakDuration, sessionLength, currentTime);
      
      if (breakId) scheduledIds.push(breakId);
      
      // Move to next session time
      currentTime = new Date(breakTime.getTime() + breakDuration * 60 * 1000);
    }
    
    return scheduledIds;
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
      await this.saveScheduledNotifications();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  async cancelNotification(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      this.scheduledNotifications.delete(identifier);
      await this.saveScheduledNotifications();
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async getScheduledNotifications() {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled.map(notification => ({
        id: notification.identifier,
        title: notification.content.title,
        body: notification.content.body,
        date: notification.trigger.date,
        type: notification.content.data?.type,
      }));
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async saveScheduledNotifications() {
    try {
      const notificationsArray = Array.from(this.scheduledNotifications.values());
      await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(notificationsArray));
    } catch (error) {
      console.error('Error saving scheduled notifications:', error);
    }
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

  // New method to get notification statistics
  async getNotificationStats() {
    const scheduled = await this.getScheduledNotifications();
    const stats = {
      total: scheduled.length,
      byType: {
        study: scheduled.filter(n => n.type === 'study').length,
        break: scheduled.filter(n => n.type === 'break').length,
        deadline: scheduled.filter(n => n.type === 'deadline').length,
      },
      nextNotification: scheduled.length > 0 ? 
        scheduled.sort((a, b) => new Date(a.date) - new Date(b.date))[0] : null,
    };
    return stats;
  }
}

export default new NotificationService(); 