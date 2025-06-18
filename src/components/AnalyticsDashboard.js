import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
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
    subjectMetrics,
    learningPatterns,
    goals,
    peakProductivityHours,
    loadSavedData,
  } = useAnalyticsStore();

  const [selectedDate] = useState(new Date());
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    loadSavedData();
  }, []);

  // Validate and sanitize numerical data
  const sanitizeNumber = (value, fallback = 0) => {
    const num = parseFloat(value);
    return isNaN(num) || !isFinite(num) ? fallback : num;
  };

  // Ensure array has at least one valid data point
  const ensureValidData = (data, labels) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        labels: ['No Data'],
        data: [0],
      };
    }
    return {
      labels,
      data: data.map(val => sanitizeNumber(val)),
    };
  };

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

  // Goals Progress Data with validation
  const goalsData = {
    labels: ['Daily', 'Weekly', 'Streak'],
    data: [
      sanitizeNumber(goals?.daily?.achieved / (goals?.daily?.target || 1), 0),
      sanitizeNumber(goals?.weekly?.achieved / (goals?.weekly?.target || 1), 0),
      sanitizeNumber(goals?.streak?.achieved / (goals?.streak?.target || 1), 0),
    ].map(val => Math.min(1, Math.max(0, val))), // Ensure values are between 0 and 1
  };

  // Focus Quality Data with validation
  const focusQualityData = [
    {
      name: 'Deep Focus',
      population: sanitizeNumber(focusMetrics?.deepFocusPeriods),
      color: theme.success,
      legendFontColor: theme.textSecondary,
    },
    {
      name: 'Completed',
      population: sanitizeNumber(focusMetrics?.completed),
      color: theme.primary,
      legendFontColor: theme.textSecondary,
    },
    {
      name: 'Interrupted',
      population: sanitizeNumber(focusMetrics?.interruptions),
      color: theme.warning,
      legendFontColor: theme.textSecondary,
    },
    {
      name: 'Abandoned',
      population: sanitizeNumber(focusMetrics?.abandoned),
      color: theme.error,
      legendFontColor: theme.textSecondary,
    },
  ].filter(item => item.population > 0); // Only show non-zero values

  // Subject Performance Data with validation
  const subjectPerformanceData = {
    labels: Object.keys(subjectMetrics || {}),
    datasets: [
      {
        data: Object.values(subjectMetrics || {}).map(metrics => 
          sanitizeNumber(metrics?.averageScore)
        ),
        color: (opacity = 1) => getRGBA(theme.primary, opacity),
      },
    ],
  };

  // Ensure we have at least one data point
  if (subjectPerformanceData.labels.length === 0) {
    subjectPerformanceData.labels = ['No Data'];
    subjectPerformanceData.datasets[0].data = [0];
  }

  // Peak Hours Data with validation
  const peakHoursData = {
    labels: Object.keys(peakProductivityHours || {})
      .map(hour => `${hour}:00`)
      .slice(0, 8), // Limit to 8 hours for better visibility
    datasets: [
      {
        data: Object.values(peakProductivityHours || {})
          .map(metrics => sanitizeNumber(metrics?.averageFocusScore))
          .slice(0, 8),
      },
    ],
  };

  // Ensure we have at least one data point
  if (peakHoursData.labels.length === 0) {
    peakHoursData.labels = ['No Data'];
    peakHoursData.datasets[0].data = [0];
  }

  const renderLearningInsights = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: getRGBA(theme.textSecondary, 0.08) }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Learning Insights</Text>
        <View style={styles.insightsContainer}>
          <View style={styles.insightItem}>
            <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>Best Study Time</Text>
            <Text style={[styles.insightValue, { color: theme.text }]}>
              {learningPatterns?.bestTimeOfDay != null ? 
                `${learningPatterns.bestTimeOfDay}:00` : 
                'Not enough data'}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>Best Study Day</Text>
            <Text style={[styles.insightValue, { color: theme.text }]}>
              {learningPatterns?.bestDayOfWeek != null ? 
                dayNames[learningPatterns.bestDayOfWeek] : 
                'Not enough data'}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>Most Productive Subject</Text>
            <Text style={[styles.insightValue, { color: theme.text }]}>
              {learningPatterns?.mostProductiveSubject || 'Not enough data'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Check if we have any data to display
  const hasNoData = !studySessions || studySessions.length === 0;

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

        {hasNoData ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: getRGBA(theme.textSecondary, 0.08) }]}>
            <Text style={[styles.noDataText, { color: theme.text }]}>
              No study sessions recorded yet. Start a study session to see your analytics!
            </Text>
          </View>
        ) : (
          <>
            {/* Goals Progress */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: getRGBA(theme.textSecondary, 0.08) }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Goals Progress</Text>
              <View style={styles.chartContainer}>
                <ProgressChart
                  data={goalsData}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  hideLegend={false}
                  style={styles.chart}
                />
              </View>
              <View style={styles.goalsLegend}>
                <Text style={[styles.goalText, { color: theme.text }]}>
                  Daily: {sanitizeNumber(goals?.daily?.achieved)}/{goals?.daily?.target || 0} min
                </Text>
                <Text style={[styles.goalText, { color: theme.text }]}>
                  Weekly: {sanitizeNumber(goals?.weekly?.achieved)}/{goals?.weekly?.target || 0} min
                </Text>
                <Text style={[styles.goalText, { color: theme.text }]}>
                  Streak: {sanitizeNumber(goals?.streak?.achieved)}/{goals?.streak?.target || 0} days
                </Text>
              </View>
            </View>

            {/* Learning Insights */}
            {renderLearningInsights()}

            {/* Focus Quality */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: getRGBA(theme.textSecondary, 0.08) }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Focus Quality</Text>
              {focusQualityData.length > 0 ? (
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
              ) : (
                <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
                  No focus data available yet
                </Text>
              )}
              <View style={styles.focusStats}>
                <Text style={[styles.focusStat, { color: theme.text }]}>
                  Deep Focus Periods: {sanitizeNumber(focusMetrics?.deepFocusPeriods)}
                </Text>
                <Text style={[styles.focusStat, { color: theme.text }]}>
                  Total Focus Time: {Math.floor(sanitizeNumber(focusMetrics?.totalFocusTime) / 60)} minutes
                </Text>
              </View>
            </View>

            {/* Subject Performance */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: getRGBA(theme.textSecondary, 0.08) }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Subject Performance</Text>
              <View style={styles.chartContainer}>
                <BarChart
                  data={subjectPerformanceData}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  fromZero
                />
              </View>
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
              </View>
            </View>
          </>
        )}
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
  goalsLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '500',
  },
  insightsContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  insightItem: {
    marginBottom: 12,
  },
  insightLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  focusStats: {
    marginTop: 16,
    alignItems: 'center',
  },
  focusStat: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    padding: 20,
  },
});

export default AnalyticsDashboard; 