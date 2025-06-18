import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import useAnalyticsStore from '../store/analyticsStore';
import { useTheme } from '../context/ThemeContext';
import {
  getDailyStudyTimeBySubject,
  getWeeklyStudyTimeBySubject,
  getFocusQualityMetrics,
  getPeakProductivityHours,
  calculateStreak,
  formatDuration,
} from '../utils/analyticsUtils';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 64; // More padding for charts

const getRGBA = (hex, opacity = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
};

const AnalyticsDashboard = () => {
  const { theme } = useTheme();
  const {
    studySessions,
    focusMetrics,
    streaks,
    peakProductivityHours,
    loadSavedData,
  } = useAnalyticsStore();

  const [selectedDate] = useState(new Date());

  useEffect(() => {
    loadSavedData();
  }, []);

  const dailyStudyTime = getDailyStudyTimeBySubject(studySessions, selectedDate);
  const weeklyStudyTime = getWeeklyStudyTimeBySubject(studySessions, selectedDate);
  const focusQuality = getFocusQualityMetrics(studySessions);
  const peakHours = getPeakProductivityHours(studySessions);

  const chartConfig = {
    backgroundColor: theme.background,
    backgroundGradientFrom: theme.background,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => getRGBA(theme.primary, opacity),
    labelColor: (opacity = 1) => getRGBA(theme.text, opacity),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.primary,
    },
    propsForBackgroundLines: {
      stroke: getRGBA(theme.textSecondary, 0.15),
    },
    formatYLabel: (value) => {
      const num = parseFloat(value);
      return isNaN(num) ? '0' : Math.round(num).toString();
    },
  };

  // Prepare data for charts with validation
  const dailyStudyData = {
    labels: Object.keys(dailyStudyTime),
    datasets: [{
      data: Object.values(dailyStudyTime).map(value => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : Math.max(0, Math.round(num));
      }),
    }],
  };

  const focusQualityData = [
    {
      name: 'Completed',
      population: Math.max(0, Math.round(focusQuality.completed)),
      color: theme.success,
      legendFontColor: theme.textSecondary,
    },
    {
      name: 'Abandoned',
      population: Math.max(0, Math.round(focusQuality.abandoned)),
      color: theme.warning,
      legendFontColor: theme.textSecondary,
    },
  ];

  const peakHoursData = {
    labels: peakHours.slice(0, 6).map(hour => `${hour.hour}:00`),
    datasets: [{
      data: peakHours.slice(0, 6).map(hour => {
        const num = parseFloat(hour.duration);
        return isNaN(num) ? 0 : Math.max(0, Math.round(num));
      }),
    }],
  };

  // Ensure we have at least one data point for each chart
  const isEmptyDaily = dailyStudyData.datasets[0].data.length === 0 || dailyStudyData.datasets[0].data.every(v => v === 0);
  const isEmptyPeak = peakHoursData.datasets[0].data.length === 0 || peakHoursData.datasets[0].data.every(v => v === 0);

  if (isEmptyDaily) {
    dailyStudyData.datasets[0].data = [0];
    dailyStudyData.labels = ['No Data'];
  }
  if (isEmptyPeak) {
    peakHoursData.datasets[0].data = [0];
    peakHoursData.labels = ['No Data'];
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <LinearGradient
        colors={[theme.background, theme.surface]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={[styles.title, { color: theme.text }]}>Study Analytics</Text>

        {/* Study Streak */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: getRGBA(theme.textSecondary, 0.08) }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Study Streak</Text>
          <View style={styles.streakContainer}>
            <View style={styles.streakItem}>
              <Text style={[styles.streakNumber, { color: theme.primary }]}>
                {Math.max(0, Math.round(streaks.current))}
              </Text>
              <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>Current</Text>
            </View>
            <View style={styles.streakItem}>
              <Text style={[styles.streakNumber, { color: theme.primary }]}>
                {Math.max(0, Math.round(streaks.longest))}
              </Text>
              <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>Longest</Text>
            </View>
          </View>
        </View>

        {/* Daily Study Time */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: getRGBA(theme.textSecondary, 0.08) }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Study Time by Subject</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={dailyStudyData}
              width={chartWidth}
              height={220}
              yAxisLabel=""
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
            />
            {isEmptyDaily && (
              <Text style={[styles.emptyState, { color: theme.textSecondary }]}>No study sessions yet. Start a session to see analytics!</Text>
            )}
          </View>
        </View>

        {/* Focus Quality */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: getRGBA(theme.textSecondary, 0.08) }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Focus Quality</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={focusQualityData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
              hasLegend
            />
          </View>
          <Text style={[styles.completionRate, { color: theme.text }]}>Completion Rate: {Math.max(0, Math.min(100, Math.round(focusQuality.completionRate))).toFixed(1)}%</Text>
        </View>

        {/* Peak Productivity Hours */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: getRGBA(theme.textSecondary, 0.08) }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Peak Productivity Hours</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={peakHoursData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              bezier
              fromZero
            />
            {isEmptyPeak && (
              <Text style={[styles.emptyState, { color: theme.textSecondary }]}>No productivity data yet. Start a session to see analytics!</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    width: '100%',
  },
  chart: {
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  completionRate: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default AnalyticsDashboard; 