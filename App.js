// App.js
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { TimerProvider } from './src/context/TimerContext';
import { TaskProvider } from './src/context/TaskContext';
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Handle notifications when app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      // Show alert for study session notifications
      if (notification.request.content.data?.type === 'study') {
        Alert.alert(
          'Study Session Starting! 📚',
          notification.request.content.body,
          [
            {
              text: 'Start Session',
              onPress: () => {
                // Navigate to study screen or start timer
                console.log('Starting study session from notification');
                // You can add navigation logic here
              },
            },
            {
              text: 'Dismiss',
              style: 'cancel',
            },
          ]
        );
      }
    });

    // Handle notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      if (data?.type === 'study') {
        // Navigate to study screen or start timer
        console.log('Starting study session from notification tap');
        // You can add navigation logic here
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TaskProvider>
          <TimerProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <AppNavigator />
            </NavigationContainer>
          </TimerProvider>
        </TaskProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}