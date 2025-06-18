import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

export default function SettingsScreen() {
  const [workDuration, setWorkDuration] = useState('25');
  const [breakDuration, setBreakDuration] = useState('5');
  const { colors } = useContext(ThemeContext);

  useEffect(() => {
    loadDurations();
  }, []);

  const loadDurations = async () => {
    try {
      const work = await AsyncStorage.getItem('workDuration');
      const rest = await AsyncStorage.getItem('breakDuration');
      if (work) setWorkDuration(work);
      if (rest) setBreakDuration(rest);
    } catch (e) {
      console.log('Failed to load durations');
    }
  };

  const saveDurations = async () => {
    try {
      await AsyncStorage.setItem('workDuration', workDuration);
      await AsyncStorage.setItem('breakDuration', breakDuration);
    } catch (e) {
      console.log('Failed to save durations');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Work Duration (minutes)</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.text }]}
          value={workDuration}
          onChangeText={setWorkDuration}
          keyboardType="numeric"
          placeholder="25"
          placeholderTextColor={colors.text}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Break Duration (minutes)</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.text }]}
          value={breakDuration}
          onChangeText={setBreakDuration}
          keyboardType="numeric"
          placeholder="5"
          placeholderTextColor={colors.text}
        />
      </View>

      <Button title="Save Settings" onPress={saveDurations} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
}); 