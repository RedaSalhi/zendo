// src/screens/HomeScreen.js
import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  StatusBar,
  ScrollView
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

import StartPauseButton from '../components/StartPauseButton';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useTheme } from '../context/ThemeContext';
import { useTimer } from '../context/TimerContext';
import { getMotivationalMessage } from '../utils/timeUtils';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { theme, themeName } = useTheme();
  const { sessionsCompleted, isWork, currentTime } = useTimer();
  
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animations
    headerOpacity.value = withTiming(1, { duration: 800 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));

    return () => {
      // Cleanup animations
      headerOpacity.value = 0;
      contentOpacity.value = 0;
    };
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background}
      />
      
      {/* Background gradient */}
      <LinearGradient
        colors={[theme.background, theme.surface]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        accessible={false}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]} entering={FadeIn.delay(100)}>
          <View style={styles.titleContainer}>
            <Text 
              style={[styles.appTitle, { color: theme.text }]}
              accessibilityRole="header"
            >
              Zendo
            </Text>
            <Text 
              style={[styles.subtitle, { color: theme.textSecondary }]}
              accessibilityRole="text"
            >
              Mindful Focus
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: theme.surface, shadowOpacity: 0.05, elevation: 1 }]}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Settings"
            accessibilityHint="Opens settings screen"
            accessibilityRole="button"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                stroke={theme.textSecondary}
                strokeWidth="2"
              />
              <Path
                d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
                stroke={theme.textSecondary}
                strokeWidth="2"
              />
            </Svg>
          </TouchableOpacity>
        </Animated.View>

        {/* Main content */}
        <Animated.View 
          style={[styles.content, contentStyle]} 
          entering={SlideInUp.delay(300)}
          accessible={true}
          accessibilityRole="main"
        >
          {/* Timer section */}
          <View style={{alignItems: 'center', marginVertical: 32}}>
            <Text style={{fontSize: 48, fontWeight: 'bold', color: theme.primary}}>
              {Math.floor(currentTime / 60).toString().padStart(2, '0')}:{(currentTime % 60).toString().padStart(2, '0')}
            </Text>
            <Text style={{color: theme.textSecondary, marginTop: 4}}>
              {isWork ? 'Focus' : 'Break'}
            </Text>
          </View>

          {/* Theme Switcher above tabs */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <ThemeSwitcher />
          </View>

          {/* Control buttons */}
          <View 
            style={styles.controlsContainer}
            accessible={true}
            accessibilityRole="toolbar"
          >
            <StartPauseButton />
          </View>

          {/* Main action tabs as vertical stack */}
          <View style={styles.verticalTabsContainer}>
            <TouchableOpacity
              style={[styles.verticalTabButton, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate('Study')}
              activeOpacity={0.8}
              accessible={true}
              accessibilityLabel="Study Techniques"
              accessibilityHint="Opens evidence-based study techniques"
              accessibilityRole="button"
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke={theme.textSecondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={[styles.verticalTabText, { color: theme.textSecondary }]}>Study</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.verticalTabButton, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate('Analytics')}
              activeOpacity={0.8}
              accessible={true}
              accessibilityLabel="Study Analytics"
              accessibilityHint="Opens analytics dashboard"
              accessibilityRole="button"
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M2 2h20v20H2zM6 12l4 4 8-8"
                  stroke={theme.textSecondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={[styles.verticalTabText, { color: theme.textSecondary }]}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.verticalTabButton, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
              accessible={true}
              accessibilityLabel="Smart Notifications"
              accessibilityHint="Opens notification settings"
              accessibilityRole="button"
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                  stroke={theme.textSecondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={[styles.verticalTabText, { color: theme.textSecondary }]}>Notifications</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  titleContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  settingsButton: {
    padding: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  controlsContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  sessionInfo: {
    marginHorizontal: 24,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sessionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  verticalTabsContainer: {
    marginTop: 24,
    gap: 16,
  },
  verticalTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  verticalTabText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
});