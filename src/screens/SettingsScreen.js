// src/screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Slider from '@react-native-community/slider';

import { useTheme } from '../context/ThemeContext';
import { useTimer } from '../context/TimerContext';
import { useTask } from '../context/TaskContext';
import { formatDuration, secondsToMinutes } from '../utils/timeUtils';
import TaskInput from '../components/TaskInput';
import TaskList from '../components/TaskList';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const PresetButton = ({ duration, label, onPress, isSelected, theme }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    onPress(duration);
  };

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.presetButton,
        animatedStyle,
        {
          backgroundColor: isSelected ? theme.primary : theme.surface,
          borderColor: theme.border,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.presetButtonText,
          { color: isSelected ? 'white' : theme.text },
        ]}
      >
        {label}
      </Text>
    </AnimatedTouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { theme, themeName, switchTheme, availableThemes } = useTheme();
  const { 
    workDuration, 
    breakDuration, 
    longBreakDuration,
    updateDurations,
    sessionsCompleted,
    totalSessions 
  } = useTimer();
  const { tasks } = useTask();

  const [workMins, setWorkMins] = useState(secondsToMinutes(workDuration));
  const [breakMins, setBreakMins] = useState(secondsToMinutes(breakDuration));
  const [longBreakMins, setLongBreakMins] = useState(secondsToMinutes(longBreakDuration));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showTaskInput, setShowTaskInput] = useState(false);

  useEffect(() => {
    setWorkMins(secondsToMinutes(workDuration));
    setBreakMins(secondsToMinutes(breakDuration));
    setLongBreakMins(secondsToMinutes(longBreakDuration));
  }, [workDuration, breakDuration, longBreakDuration]);

  const handleSave = () => {
    updateDurations(workMins, breakMins, longBreakMins);
  };

  const workPresets = [15, 20, 25, 30, 45, 60];
  const breakPresets = [5, 10, 15, 20];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.background, theme.surface]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View style={styles.header} entering={FadeIn.delay(100)}>
            <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Customize your meditation experience
            </Text>
          </Animated.View>

          {/* Timer Settings */}
          <Animated.View 
            style={[styles.section, { backgroundColor: theme.surface }]}
            entering={SlideInRight.delay(200)}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Timer Duration
            </Text>

            {/* Work Duration */}
            <View style={styles.durationContainer}>
              <Text style={[styles.durationLabel, { color: theme.textSecondary }]}>
                Work Duration
              </Text>
              <View style={styles.presetsContainer}>
                {workPresets.map((mins) => (
                  <PresetButton
                    key={mins}
                    duration={mins}
                    label={`${mins}m`}
                    onPress={() => setWorkMins(mins)}
                    isSelected={workMins === mins}
                    theme={theme}
                  />
                ))}
              </View>
            </View>

            {/* Break Duration */}
            <View style={styles.durationContainer}>
              <Text style={[styles.durationLabel, { color: theme.textSecondary }]}>
                Break Duration
              </Text>
              <View style={styles.presetsContainer}>
                {breakPresets.map((mins) => (
                  <PresetButton
                    key={mins}
                    duration={mins}
                    label={`${mins}m`}
                    onPress={() => setBreakMins(mins)}
                    isSelected={breakMins === mins}
                    theme={theme}
                  />
                ))}
              </View>
            </View>

            {/* Long Break Duration */}
            <View style={styles.durationContainer}>
              <Text style={[styles.durationLabel, { color: theme.textSecondary }]}>
                Long Break Duration
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={15}
                maximumValue={30}
                step={5}
                value={longBreakMins}
                onValueChange={setLongBreakMins}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.primary}
              />
              <Text style={[styles.sliderValue, { color: theme.textSecondary }]}>
                {longBreakMins} minutes
              </Text>
            </View>
          </Animated.View>

          {/* Task Management */}
          <Animated.View 
            style={[styles.section, { backgroundColor: theme.surface }]}
            entering={SlideInRight.delay(300)}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Task Management
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowTaskInput(true)}
              >
                <Text style={[styles.addButtonText, { color: 'white' }]}>+ Add Task</Text>
              </TouchableOpacity>
            </View>

            <TaskList />
          </Animated.View>

          {/* Progress Stats */}
          <Animated.View 
            style={[styles.section, { backgroundColor: theme.surface }]}
            entering={SlideInRight.delay(400)}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Your Progress
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: theme.primary }]}>
                  {sessionsCompleted}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Sessions Completed
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: theme.success }]}>
                  {Math.floor(sessionsCompleted / 4)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Full Cycles
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: theme.accent }]}>
                  {Math.round((sessionsCompleted * workMins) / 60)}h
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Focus Time
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: 'white' }]}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <TaskInput visible={showTaskInput} onClose={() => setShowTaskInput(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  section: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  durationContainer: {
    marginBottom: 24,
  },
  durationLabel: {
    fontSize: 16,
    marginBottom: 12,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    textAlign: 'center',
    marginTop: 8,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  saveButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});