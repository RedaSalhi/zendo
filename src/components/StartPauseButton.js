// src/components/StartPauseButton.js
import React from 'react';
import { TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useTimer } from '../context/TimerContext';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = 80;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Play icon path
const PLAY_PATH = "M20 12L8 6v12l12-6z";
// Pause icon paths
const PAUSE_PATH_1 = "M10 4h4v16h-4z";
const PAUSE_PATH_2 = "M10 4h4v16h-4z";

export default function StartPauseButton() {
  const { theme } = useTheme();
  const { isRunning, startTimer, pauseTimer, resetTimer } = useTimer();
  
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const handlePress = () => {
    // Scale animation
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });

    // Toggle timer
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const handleLongPress = () => {
    // Rotation animation for reset
    rotation.value = withTiming(360, { duration: 300 }, () => {
      rotation.value = 0;
    });
    
    resetTimer();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` }
    ],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { 
        rotateY: withTiming(isRunning ? '180deg' : '0deg', { duration: 300 })
      }
    ],
  }));

  return (
    <AnimatedTouchableOpacity
      style={[styles.container, animatedStyle]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={800}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={theme.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <Svg
            width={32}
            height={32}
            viewBox="0 0 24 24"
            fill="none"
          >
            {isRunning ? (
              <>
                <Path
                  d="M6 4h4v16H6z"
                  fill="white"
                />
                <Path
                  d="M14 4h4v16h-4z"
                  fill="white"
                />
              </>
            ) : (
              <Path
                d="M8 5v14l11-7z"
                fill="white"
              />
            )}
          </Svg>
        </Animated.View>
      </LinearGradient>
      
      {/* Shadow/glow effect */}
      <LinearGradient
        colors={[`${theme.primary}40`, 'transparent']}
        style={styles.shadow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginVertical: 30,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    bottom: -10,
    width: BUTTON_SIZE + 20,
    height: 20,
    borderRadius: 10,
    zIndex: -1,
  },
});