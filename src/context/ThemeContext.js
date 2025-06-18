// src/context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const themes = {
  light: {
    name: 'light',
    background: '#f8fafc',
    surface: '#ffffff',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    gradient: ['#6366f1', '#8b5cf6'],
    shadowColor: '#000000',
    shadowOpacity: 0.1,
  },
  dark: {
    name: 'dark',
    background: '#0f172a',
    surface: '#1e293b',
    primary: '#818cf8',
    secondary: '#a78bfa',
    accent: '#22d3ee',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    success: '#34d399',
    warning: '#fbbf24',
    gradient: ['#818cf8', '#a78bfa'],
    shadowColor: '#000000',
    shadowOpacity: 0.3,
  },
  zen: {
    name: 'zen',
    background: '#f0f9ff',
    surface: '#ffffff',
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    accent: '#14b8a6',
    text: '#0c4a6e',
    textSecondary: '#0369a1',
    border: '#bae6fd',
    success: '#059669',
    warning: '#d97706',
    gradient: ['#0ea5e9', '#06b6d4'],
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.15,
  },
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme && themes[savedTheme]) {
        setCurrentTheme(savedTheme);
      }
    } catch (error) {
      Alert.alert(
        'Theme Error',
        'Failed to load theme settings. Using default theme.',
        [{ text: 'OK' }]
      );
      console.error('Failed to load theme:', error);
    }
  };

  const saveTheme = async (themeName) => {
    try {
      await AsyncStorage.setItem('theme', themeName);
    } catch (error) {
      Alert.alert(
        'Theme Error',
        'Failed to save theme settings. Your changes may not persist.',
        [{ text: 'OK' }]
      );
      console.error('Failed to save theme:', error);
    }
  };

  const switchTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      saveTheme(themeName);
    } else {
      Alert.alert(
        'Invalid Theme',
        'The selected theme is not available.',
        [{ text: 'OK' }]
      );
      console.error('Invalid theme name:', themeName);
    }
  };

  const cycleTheme = () => {
    try {
      const themeNames = Object.keys(themes);
      const currentIndex = themeNames.indexOf(currentTheme);
      const nextIndex = (currentIndex + 1) % themeNames.length;
      switchTheme(themeNames[nextIndex]);
    } catch (error) {
      Alert.alert(
        'Theme Error',
        'Failed to cycle theme. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Failed to cycle theme:', error);
    }
  };

  const value = {
    theme: themes[currentTheme],
    themeName: currentTheme,
    switchTheme,
    cycleTheme,
    availableThemes: Object.keys(themes),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};