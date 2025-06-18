import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import NotificationService from '../services/NotificationService';
import { useTheme } from '../context/ThemeContext';

const NotificationManager = () => {
  const { theme } = useTheme();
  const [preferences, setPreferences] = useState({
    studyReminders: true,
    breakReminders: true,
    deadlineAlerts: true,
    energyBasedSuggestions: true,
    smartScheduling: true,
  });

  const [studyDuration, setStudyDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(15);
  const [energyLevel, setEnergyLevel] = useState('5');
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [notificationStats, setNotificationStats] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState(() => {
    // Initialize with a time 30 minutes from now
    const futureTime = new Date();
    futureTime.setMinutes(futureTime.getMinutes() + 30);
    futureTime.setSeconds(0);
    futureTime.setMilliseconds(0);
    return futureTime;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadPreferences();
    loadScheduledNotifications();
  }, []);

  const loadPreferences = async () => {
    const savedPreferences = await NotificationService.getNotificationPreferences();
    if (savedPreferences) {
      setPreferences(savedPreferences);
    }
  };

  const loadScheduledNotifications = async () => {
    const notifications = await NotificationService.getScheduledNotifications();
    const stats = await NotificationService.getNotificationStats();
    setScheduledNotifications(notifications);
    setNotificationStats(stats);
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await NotificationService.saveNotificationPreferences(newPreferences);
  };

  const validateAndSetStartTime = (newTime) => {
    const now = new Date();
    const minTime = new Date(now.getTime() + 60000); // 1 minute from now
    
    console.log('Validating time:', {
      newTime: newTime.toLocaleString(),
      now: now.toLocaleString(),
      minTime: minTime.toLocaleString(),
      newTimeMs: newTime.getTime(),
      nowMs: now.getTime(),
      minTimeMs: minTime.getTime(),
    });
    
    if (newTime <= now) {
      Alert.alert(
        'Invalid Time',
        'Please select a time in the future. Scheduling for past times is not allowed.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    if (newTime <= minTime) {
      Alert.alert(
        'Time Too Close',
        'Please select a time at least 1 minute from now to allow for proper scheduling.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    setSelectedStartTime(newTime);
    return true;
  };

  const scheduleStudySession = async () => {
    try {
      // Validate study duration
      if (studyDuration <= 0 || studyDuration > 480) { // Max 8 hours
        Alert.alert('Invalid Duration', 'Please enter a study duration between 1 and 480 minutes.');
        return;
      }

      // Validate energy level - use default if empty
      let validEnergyLevel = parseInt(energyLevel) || 5; // Default to 5 if empty or invalid
      if (validEnergyLevel < 1) {
        Alert.alert('Low Energy Level', 'Energy level is very low. Consider taking a break or scheduling for later.');
        validEnergyLevel = 1;
      } else if (validEnergyLevel > 10) {
        Alert.alert('High Energy Level', 'Energy level is very high. This will be capped at 10 for optimal scheduling.');
        validEnergyLevel = 10;
      }

      // Validate start time
      if (!validateAndSetStartTime(selectedStartTime)) {
        return;
      }

      // Use the exact time the user selected - ensure it's a proper Date object
      const userSelectedTime = new Date(selectedStartTime);
      
      console.log('Scheduling study session:', {
        duration: studyDuration,
        energyLevel: validEnergyLevel,
        selectedTime: userSelectedTime.toLocaleString(),
        selectedTimeISO: userSelectedTime.toISOString(),
      });
      
      const schedule = await NotificationService.optimizeStudySchedule(
        validEnergyLevel,
        studyDuration,
        userSelectedTime // Pass the exact time user selected
      );

      if (preferences.smartScheduling) {
        const scheduledIds = await NotificationService.scheduleRecurringStudySession(schedule);
        
        if (scheduledIds.length > 0) {
          Alert.alert(
            'Study Sessions Scheduled! 📚',
            `Successfully scheduled ${schedule.sessionIntervals.length} study sessions starting at ${format(userSelectedTime, 'HH:mm')}.\n\nSession breakdown:\n${schedule.sessionIntervals.map((duration, index) => `Session ${index + 1}: ${duration} minutes`).join('\n')}`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Scheduling Failed',
            'Unable to schedule study sessions. Please try again with a different time.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // For non-smart scheduling, schedule exactly at the user's selected time
        const notificationId = await NotificationService.scheduleStudyReminder({
          title: 'Study Session Starting 📚',
          body: `Your ${studyDuration}-minute study session is about to begin.`,
          date: userSelectedTime, // Use exact user time
          type: 'study',
        });

        if (notificationId) {
          Alert.alert(
            'Study Session Scheduled! 📚',
            `Your study session is scheduled for ${format(userSelectedTime, 'HH:mm')}.\n\nDuration: ${studyDuration} minutes\nEnergy Level: ${validEnergyLevel}/10`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Scheduling Failed',
            'Unable to schedule study session. Please try again with a different time.',
            [{ text: 'OK' }]
          );
        }
      }

      await loadScheduledNotifications();
    } catch (error) {
      console.error('Error scheduling study session:', error);
      Alert.alert('Error', 'Failed to schedule study session. Please try again.');
    }
  };

  const addDeadline = async () => {
    Alert.prompt(
      'Add Deadline',
      'Enter deadline title:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async (title) => {
            if (title) {
              const deadline = {
                title,
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              };
              
              const scheduledIds = await NotificationService.scheduleDeadlineAlert(deadline);
              
              if (scheduledIds.length > 0) {
                Alert.alert(
                  'Deadline Alerts Set! ⏰',
                  `Alerts scheduled for "${title}" deadline.\n\nAlerts will be sent:\n• 1 week before\n• 3 days before\n• 24 hours before\n• 6 hours before`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  'No Alerts Scheduled',
                  'Unable to schedule deadline alerts. The deadline might be too close or in the past.',
                  [{ text: 'OK' }]
                );
              }
              
              await loadScheduledNotifications();
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const cancelAllNotifications = async () => {
    Alert.alert(
      'Cancel All Notifications',
      'Are you sure you want to cancel all scheduled notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel All',
          style: 'destructive',
          onPress: async () => {
            await NotificationService.cancelAllNotifications();
            await loadScheduledNotifications();
            Alert.alert('Success', 'All notifications have been cancelled.');
          },
        },
      ]
    );
  };

  const renderNotificationStats = () => {
    if (!notificationStats) return null;

    return (
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Notification Overview</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>
              {notificationStats.total}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Scheduled</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.success }]}>
              {notificationStats.byType.study}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Study Sessions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.warning }]}>
              {notificationStats.byType.break}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Break Reminders</Text>
          </View>
        </View>
        {notificationStats.nextNotification && (
          <Text style={[styles.nextNotification, { color: theme.textSecondary }]}>
            Next: {notificationStats.nextNotification.title} at{' '}
            {format(new Date(notificationStats.nextNotification.date), 'HH:mm')}
          </Text>
        )}
      </View>
    );
  };

  const renderCurrentSettings = () => {
    return (
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Study Session Settings</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Study Duration (minutes)</Text>
          <TextInput
            style={[styles.input, { 
              color: theme.text, 
              borderColor: theme.border, 
              backgroundColor: theme.background,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              marginTop: 4,
            }]}
            keyboardType="numeric"
            value={studyDuration.toString()}
            onChangeText={(value) => setStudyDuration(parseInt(value) || 0)}
            placeholder="60"
            placeholderTextColor={theme.textSecondary}
          />
          <Text style={[styles.inputHint, { color: theme.textSecondary }]}>
            Recommended: 25-90 minutes per session
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Energy Level (1-10)</Text>
          <TextInput
            style={[styles.input, { 
              color: theme.text, 
              borderColor: theme.border, 
              backgroundColor: theme.background,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              marginTop: 4,
            }]}
            keyboardType="numeric"
            value={energyLevel}
            onChangeText={(value) => {
              // Allow empty input
              if (value === '') {
                setEnergyLevel('');
                return;
              }
              
              const numValue = parseInt(value);
              if (!isNaN(numValue)) {
                // Allow any number input
                setEnergyLevel(value);
              }
            }}
            placeholder="5"
            placeholderTextColor={theme.textSecondary}
            maxLength={2} // Limit to 2 digits
          />
          <Text style={[styles.inputHint, { color: theme.textSecondary }]}>
            1 = Very tired, 10 = Peak energy (leave empty for default: 5)
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Start Time</Text>
          <TouchableOpacity
            style={[styles.timeButton, { 
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              alignItems: 'center',
              marginTop: 4,
              backgroundColor: theme.background,
            }]}
            onPress={() => {
              console.log('Time picker button pressed');
              setShowTimePicker(true);
            }}
          >
            <Text style={[styles.timeButtonText, { color: theme.text }]}>
              {format(selectedStartTime, 'HH:mm')}
            </Text>
            <Text style={[styles.timeButtonHint, { color: theme.textSecondary }]}>
              Tap to change time
            </Text>
          </TouchableOpacity>
          <Text style={[styles.inputHint, { color: theme.textSecondary }]}>
            Must be at least 1 minute from now
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.scheduleButton, { backgroundColor: theme.primary }]}
          onPress={scheduleStudySession}
        >
          <Text style={[styles.scheduleButtonText, { color: theme.surface }]}>
            Schedule Study Session
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderScheduledNotifications = () => {
    if (scheduledNotifications.length === 0) return null;

    return (
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Scheduled Notifications</Text>
        <ScrollView style={styles.notificationsList}>
          {scheduledNotifications.slice(0, 5).map((notification) => (
            <View key={notification.id} style={styles.notificationItem}>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: theme.text }]}>
                  {notification.title}
                </Text>
                <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
                  {format(new Date(notification.date), 'MMM dd, HH:mm')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.error }]}
                onPress={() => {
                  NotificationService.cancelNotification(notification.id);
                  loadScheduledNotifications();
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.surface }]}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.background, theme.surface]}
        style={styles.backgroundGradient}
      />

      {/* Notification Stats */}
      {renderNotificationStats()}

      {/* Study Session Settings */}
      {renderCurrentSettings()}

      {/* Notification Settings */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Notification Settings</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Study Reminders</Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Get notified when it's time to start studying
            </Text>
          </View>
          <Switch
            value={preferences.studyReminders}
            onValueChange={(value) => handlePreferenceChange('studyReminders', value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={preferences.studyReminders ? theme.primary : theme.textSecondary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Break Reminders</Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Reminders to take breaks during study sessions
            </Text>
          </View>
          <Switch
            value={preferences.breakReminders}
            onValueChange={(value) => handlePreferenceChange('breakReminders', value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={preferences.breakReminders ? theme.primary : theme.textSecondary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Deadline Alerts</Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Get notified about upcoming deadlines
            </Text>
          </View>
          <Switch
            value={preferences.deadlineAlerts}
            onValueChange={(value) => handlePreferenceChange('deadlineAlerts', value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={preferences.deadlineAlerts ? theme.primary : theme.textSecondary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Smart Scheduling</Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Automatically optimize study times based on energy levels
            </Text>
          </View>
          <Switch
            value={preferences.smartScheduling}
            onValueChange={(value) => handlePreferenceChange('smartScheduling', value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={preferences.smartScheduling ? theme.primary : theme.textSecondary}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Quick Actions</Text>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.success }]}
          onPress={addDeadline}
        >
          <Text style={[styles.actionButtonText, { color: theme.surface }]}>
            Add Deadline Alert
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.warning }]}
          onPress={async () => {
            // Test notification - send in 10 seconds
            const testTime = new Date(Date.now() + 10000); // 10 seconds from now
            
            console.log('Scheduling test notification:', {
              testTime: testTime.toLocaleString(),
              testTimeISO: testTime.toISOString(),
              currentTime: new Date().toLocaleString(),
            });
            
            const testId = await NotificationService.scheduleStudyReminder({
              title: 'Test Notification 📚',
              body: 'This is a test notification to verify the system is working.',
              date: testTime,
              type: 'study',
            });
            
            if (testId) {
              Alert.alert(
                'Test Notification Scheduled',
                `A test notification will be sent at ${testTime.toLocaleTimeString()} (in 10 seconds). Please wait and check if you receive it.`,
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                'Test Failed',
                'Could not schedule test notification. Check console for errors.',
                [{ text: 'OK' }]
              );
            }
          }}
        >
          <Text style={[styles.actionButtonText, { color: theme.surface }]}>
            Test Notification (10s)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.error }]}
          onPress={cancelAllNotifications}
        >
          <Text style={[styles.actionButtonText, { color: theme.surface }]}>
            Cancel All Notifications
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scheduled Notifications */}
      {renderScheduledNotifications()}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedStartTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            console.log('Time picker onChange:', event, selectedDate);
            
            if (Platform.OS === 'android') {
              setShowTimePicker(false);
            }
            
            if (selectedDate && event.type !== 'dismissed') {
              // Create a new date with today's date but the selected time
              const now = new Date();
              const selectedTime = new Date(selectedDate);
              
              // Set the date to today but with the selected time
              const newTime = new Date();
              newTime.setHours(selectedTime.getHours());
              newTime.setMinutes(selectedTime.getMinutes());
              newTime.setSeconds(0);
              newTime.setMilliseconds(0);
              
              // If the selected time has already passed today, set it to tomorrow
              if (newTime <= now) {
                newTime.setDate(newTime.getDate() + 1);
              }
              
              console.log('New time selected:', {
                original: selectedTime.toLocaleString(),
                adjusted: newTime.toLocaleString(),
                now: now.toLocaleString(),
              });
              
              validateAndSetStartTime(newTime);
              
              if (Platform.OS === 'ios') {
                setShowTimePicker(false);
              }
            }
          }}
        />
      )}

      {/* iOS Time Picker Modal */}
      {Platform.OS === 'ios' && showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.iosTimePickerOverlay}>
            <View style={[styles.iosTimePickerContent, { backgroundColor: theme.surface }]}>
              <View style={styles.iosTimePickerHeader}>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(false)}
                  style={styles.iosTimePickerButton}
                >
                  <Text style={[styles.iosTimePickerButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.iosTimePickerTitle, { color: theme.text }]}>Select Time</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowTimePicker(false);
                    // Apply the same future date logic for iOS
                    const now = new Date();
                    const selectedTime = new Date(selectedStartTime);
                    
                    const newTime = new Date();
                    newTime.setHours(selectedTime.getHours());
                    newTime.setMinutes(selectedTime.getMinutes());
                    newTime.setSeconds(0);
                    newTime.setMilliseconds(0);
                    
                    if (newTime <= now) {
                      newTime.setDate(newTime.getDate() + 1);
                    }
                    
                    validateAndSetStartTime(newTime);
                  }}
                  style={styles.iosTimePickerButton}
                >
                  <Text style={[styles.iosTimePickerButtonText, { color: theme.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedStartTime}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setSelectedStartTime(selectedDate);
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  card: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  nextNotification: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationsList: {
    maxHeight: 200,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 2,
  },
  cancelButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 4,
  },
  timeButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeButtonHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  settingsPreview: {
    marginBottom: 16,
  },
  settingPreviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  settingPreviewLabel: {
    fontSize: 14,
  },
  settingPreviewValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  editSettingsButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editSettingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  iosTimePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  iosTimePickerContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  iosTimePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  iosTimePickerButton: {
    padding: 8,
  },
  iosTimePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iosTimePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scheduleButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationManager; 