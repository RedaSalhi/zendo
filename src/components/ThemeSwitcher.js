// src/components/ThemeSwitcher.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const themeIcons = {
  light: (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
      <Path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2"/>
    </Svg>
  ),
  dark: (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2"/>
    </Svg>
  ),
  zen: (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2"/>
      <Path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
    </Svg>
  ),
};

export default function ThemeSwitcher() {
  const { theme, themeName, availableThemes, cycleTheme } = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const handlePress = () => {
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1);
    });
    
    rotation.value = withTiming(rotation.value + 120, { duration: 300 });
    
    cycleTheme();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` }
    ],
  }));

  return (
    <View style={styles.container}>
      <AnimatedTouchableOpacity
        style={[styles.button, animatedStyle]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme.gradient}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.iconContainer, { color: 'white' }]}>
            {themeIcons[themeName]}
          </View>
        </LinearGradient>
      </AnimatedTouchableOpacity>
      
      <Text style={[styles.themeLabel, { color: theme.textSecondary }]}>
        {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    color: 'white',
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
});