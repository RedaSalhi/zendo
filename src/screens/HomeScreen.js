// src/screens/HomeScreen.js
import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Timer from '../components/Timer';
import StartPauseButton from '../components/StartPauseButton';
import { ThemeContext } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);

  const [isRunning, setIsRunning] = useState(false);
  const [isWork, setIsWork] = useState(true);
  const { isDark, colors, toggleTheme } = useContext(ThemeContext);

  useFocusEffect(
    useCallback(() => {
      const loadDurations = async () => {
        try {
          const work = await AsyncStorage.getItem('workDuration');
          const rest = await AsyncStorage.getItem('breakDuration');

          if (work) setWorkDuration(parseInt(work) * 60);
          if (rest) setBreakDuration(parseInt(rest) * 60);
        } catch (e) {
          console.log('Failed to load durations');
        }
      };

      loadDurations();
    }, [])
  );

  const handlePress = () => setIsRunning((prev) => !prev);

  const handleComplete = () => {
    setIsRunning(false);
    setIsWork((prev) => !prev);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Zendo</Text>
      <Text style={[styles.sessionLabel, { color: colors.text }]}>
        {isWork ? 'Work Session' : 'Break Time'}
      </Text>

      <Timer
        isRunning={isRunning}
        duration={isWork ? workDuration : breakDuration}
        onComplete={handleComplete}
      />

      <StartPauseButton isRunning={isRunning} onPress={handlePress} />
      <View style={{ marginTop: 20 }}>
        <Button title="Toggle Theme" onPress={toggleTheme} />
        <View style={{ marginTop: 10 }}>
          <Button
            title="Settings"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  sessionLabel: {
    fontSize: 20,
    marginTop: 10,
  },
});
