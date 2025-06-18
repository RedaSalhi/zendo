// src/context/TimerContext.js
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useTask } from './TaskContext';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  // Timer durations in seconds
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [longBreakDuration, setLongBreakDuration] = useState(15 * 60);
  
  // Timer state
  const [currentTime, setCurrentTime] = useState(workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isWork, setIsWork] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  
  // Timer interval reference
  const timerRef = useRef(null);

  // Initialize currentTime when component mounts
  useEffect(() => {
    setCurrentTime(workDuration);
  }, [workDuration]);

  // Load saved settings
  useEffect(() => {
    loadSettings();
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('timerSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setWorkDuration(settings.workDuration);
        setBreakDuration(settings.breakDuration);
        setLongBreakDuration(settings.longBreakDuration);
        setSessionsCompleted(settings.sessionsCompleted || 0);
        setTotalSessions(settings.totalSessions || 0);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to load timer settings. Using default values.',
        [{ text: 'OK' }]
      );
      console.error('Failed to load timer settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        workDuration,
        breakDuration,
        longBreakDuration,
        sessionsCompleted,
        totalSessions,
      };
      await AsyncStorage.setItem('timerSettings', JSON.stringify(settings));
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save timer settings.',
        [{ text: 'OK' }]
      );
      console.error('Failed to save timer settings:', error);
    }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    
    // Initialize time if it's 0
    if (currentTime === 0) {
      setCurrentTime(isWork ? workDuration : breakDuration);
    }
    
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setCurrentTime((prevTime) => {
        if (prevTime <= 0) {
          handleTimerComplete();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
  };

  const resetTimer = () => {
    pauseTimer();
    setCurrentTime(isWork ? workDuration : breakDuration);
  };

  const handleTimerComplete = () => {
    pauseTimer();
    
    if (isWork) {
      setSessionsCompleted(prev => prev + 1);
      setTotalSessions(prev => prev + 1);
      setIsWork(false);
      setCurrentTime(breakDuration);

      // Update task progress if there's a current task
      const { currentTask, completePomodoro } = useTask();
      if (currentTask) {
        completePomodoro(currentTask.id);
      }
    } else {
      setIsWork(true);
      setCurrentTime(workDuration);
    }
    
    saveSettings();
  };

  const updateDurations = (workMins, breakMins, longBreakMins) => {
    setWorkDuration(workMins * 60);
    setBreakDuration(breakMins * 60);
    setLongBreakDuration(longBreakMins * 60);
    setCurrentTime(isWork ? workMins * 60 : breakMins * 60);
    saveSettings();
  };

  const value = {
    workDuration,
    breakDuration,
    longBreakDuration,
    currentTime,
    isRunning,
    isWork,
    sessionsCompleted,
    totalSessions,
    startTimer,
    pauseTimer,
    resetTimer,
    updateDurations,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}; 