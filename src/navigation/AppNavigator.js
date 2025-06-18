// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StudyScreen from '../screens/StudyScreen';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import NotificationManager from '../components/NotificationManager';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { theme, themeName } = useTheme();

  const screenOptions = {
    headerStyle: {
      backgroundColor: theme.background,
      shadowOpacity: 0,
      elevation: 0,
    },
    headerTintColor: theme.text,
    headerTitleStyle: {
      fontWeight: '600',
      fontSize: 18,
    },
    headerBackTitleVisible: false,
    contentStyle: {
      backgroundColor: theme.background,
    },
    animation: 'slide_from_right',
  };

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Study" 
        component={StudyScreen}
        options={{
          title: 'Study Techniques',
          headerStyle: {
            backgroundColor: theme.background,
          },
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: '',
          headerTransparent: true,
          headerStyle: {
            backgroundColor: 'transparent',
          },
        }}
      />
      <Stack.Screen 
        name="Analytics" 
        component={AnalyticsDashboard}
        options={{
          title: 'Study Analytics',
          headerStyle: {
            backgroundColor: theme.background,
          },
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationManager}
        options={{
          title: 'Smart Notifications',
          headerStyle: {
            backgroundColor: theme.background,
          },
        }}
      />
    </Stack.Navigator>
  );
}