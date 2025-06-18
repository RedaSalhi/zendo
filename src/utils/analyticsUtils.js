import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';

// Calculate daily study time by subject
export const getDailyStudyTimeBySubject = (sessions, date) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const daySessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return sessionDate >= dayStart && sessionDate <= dayEnd;
  });

  return daySessions.reduce((acc, session) => {
    const subject = session.subject;
    acc[subject] = (acc[subject] || 0) + session.duration;
    return acc;
  }, {});
};

// Calculate weekly study time by subject
export const getWeeklyStudyTimeBySubject = (sessions, date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  const weekSessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return sessionDate >= weekStart && sessionDate <= weekEnd;
  });

  return weekSessions.reduce((acc, session) => {
    const subject = session.subject;
    acc[subject] = (acc[subject] || 0) + session.duration;
    return acc;
  }, {});
};

// Calculate focus quality metrics
export const getFocusQualityMetrics = (sessions) => {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(session => session.completed).length;
  const abandonedSessions = totalSessions - completedSessions;

  return {
    total: totalSessions,
    completed: completedSessions,
    abandoned: abandonedSessions,
    completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
  };
};

// Identify peak productivity hours
export const getPeakProductivityHours = (sessions) => {
  const hourlyData = sessions.reduce((acc, session) => {
    const hour = new Date(session.startTime).getHours();
    acc[hour] = (acc[hour] || 0) + session.duration;
    return acc;
  }, {});

  // Convert to array and sort by duration
  const sortedHours = Object.entries(hourlyData)
    .map(([hour, duration]) => ({ hour: parseInt(hour), duration }))
    .sort((a, b) => b.duration - a.duration);

  return sortedHours;
};

// Calculate study streak
export const calculateStreak = (sessions) => {
  if (sessions.length === 0) return 0;

  const dates = sessions
    .map(session => format(new Date(session.startTime), 'yyyy-MM-dd'))
    .sort();

  let currentStreak = 1;
  let longestStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = parseISO(dates[i - 1]);
    const currDate = parseISO(dates[i]);
    const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return {
    current: currentStreak,
    longest: longestStreak,
  };
};

// Format duration in minutes to hours and minutes
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}; 