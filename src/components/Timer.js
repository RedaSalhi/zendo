// src/components/Timer.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

export default function Timer({ isRunning, duration = 25 * 60, onComplete }) {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const soundRef = useRef();

  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning && secondsLeft !== 0) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleComplete = async () => {
    clearInterval();

    // Play sound
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/chime.mp3') // place a chime sound here
    );
    soundRef.current = sound;
    await sound.playAsync();

    if (onComplete) {
      onComplete();
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const secsRemain = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${secsRemain}`;
  };

  return (
    <View style={styles.timerContainer}>
      <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    marginVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#333',
  },
});
