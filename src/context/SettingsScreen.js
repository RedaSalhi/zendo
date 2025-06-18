// src/screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [workDuration, setWorkDuration] = useState('25');
  const [breakDuration, setBreakDuration] = useState('5');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const work = await AsyncStorage.getItem('workDuration');
        const rest = await AsyncStorage.getItem('breakDuration');
        if (work !== null) setWorkDuration(work);
        if (rest !== null) setBreakDuration(rest);
      } catch (e) {
        console.log('Failed to load settings');
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('workDuration', workDuration);
      await AsyncStorage.setItem('breakDuration', breakDuration);
      Alert.alert('Settings Saved');
    } catch (e) {
      console.log('Failed to save settings');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Work Duration (minutes)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={workDuration}
        onChangeText={setWorkDuration}
      />

      <Text style={styles.label}>Break Duration (minutes)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={breakDuration}
        onChangeText={setBreakDuration}
      />

      <Button title="Save Settings" onPress={saveSettings} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
  },
  input: {
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
    borderRadius: 8,
  },
});
