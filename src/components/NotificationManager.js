import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import NotificationService from '../services/NotificationService';
import { useTheme } from '../context/ThemeContext';

const NotificationManager = () => {
  const { theme } = useTheme();
  const [preferences, setPreferences] = useState({
    studyReminders: true,
    breakReminders: true,
    deadlineAlerts: true,
    energyBasedSuggestions: true,
  });

  const [studyDuration, setStudyDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(15);
  const [energyLevel, setEnergyLevel] = useState(5);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const savedPreferences = await NotificationService.getNotificationPreferences();
    if (savedPreferences) {
      setPreferences(savedPreferences);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await NotificationService.saveNotificationPreferences(newPreferences);
  };

  const scheduleStudySession = async () => {
    if (preferences.studyReminders) {
      const schedule = await NotificationService.optimizeStudySchedule(
        energyLevel,
        studyDuration
      );

      await NotificationService.scheduleStudyReminder({
        title: 'Study Session Starting',
        body: `Your ${schedule.studyDuration}-minute study session is about to begin.`,
        date: schedule.recommendedStartTime,
        type: 'study',
      });

      if (preferences.breakReminders) {
        await NotificationService.scheduleBreakReminder(
          schedule.breakDuration,
          schedule.studyDuration
        );
      }
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Notification Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={{ color: theme.text }}>Study Reminders</Text>
          <Switch
            value={preferences.studyReminders}
            onValueChange={(value) => handlePreferenceChange('studyReminders', value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={preferences.studyReminders ? theme.primary : theme.textSecondary}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={{ color: theme.text }}>Break Reminders</Text>
          <Switch
            value={preferences.breakReminders}
            onValueChange={(value) => handlePreferenceChange('breakReminders', value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={preferences.breakReminders ? theme.primary : theme.textSecondary}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={{ color: theme.text }}>Deadline Alerts</Text>
          <Switch
            value={preferences.deadlineAlerts}
            onValueChange={(value) => handlePreferenceChange('deadlineAlerts', value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={preferences.deadlineAlerts ? theme.primary : theme.textSecondary}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={{ color: theme.text }}>Energy-based Suggestions</Text>
          <Switch
            value={preferences.energyBasedSuggestions}
            onValueChange={(value) => handlePreferenceChange('energyBasedSuggestions', value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={preferences.energyBasedSuggestions ? theme.primary : theme.textSecondary}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Study Session Settings</Text>
        
        <View style={styles.inputGroup}>
          <Text style={{ color: theme.text }}>Study Duration (minutes)</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            keyboardType="numeric"
            value={studyDuration.toString()}
            onChangeText={(value) => setStudyDuration(parseInt(value) || 0)}
            placeholder="60"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={{ color: theme.text }}>Break Duration (minutes)</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            keyboardType="numeric"
            value={breakDuration.toString()}
            onChangeText={(value) => setBreakDuration(parseInt(value) || 0)}
            placeholder="15"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={{ color: theme.text }}>Energy Level (1-10)</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            keyboardType="numeric"
            value={energyLevel.toString()}
            onChangeText={(value) => setEnergyLevel(Math.min(10, Math.max(1, parseInt(value) || 1)))}
            placeholder="5"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={scheduleStudySession}
        >
          <Text style={[styles.buttonText, { color: theme.surface }]}>Schedule Study Session</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NotificationManager; 