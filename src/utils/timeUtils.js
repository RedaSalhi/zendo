// src/utils/timeUtils.js

// Returns a motivational message based on the number of completed sessions
export function getMotivationalMessage(sessionsCompleted) {
  if (sessionsCompleted === 0) return "Breathe in, breathe out. Begin your journey.";
  if (sessionsCompleted < 3) return "Find your center. Stay present.";
  if (sessionsCompleted < 6) return "Each moment is a new beginning.";
  if (sessionsCompleted < 10) return "In stillness, find clarity.";
  return "Your presence is your power.";
}

// Formats a duration in minutes as "Xm" or "Xh Ym"
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Converts seconds to minutes (rounded)
export function secondsToMinutes(seconds) {
  return Math.round(seconds / 60);
} 