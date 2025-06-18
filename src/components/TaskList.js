import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTask } from '../context/TaskContext';

const priorityColors = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
};

export default function TaskList() {
  const { theme } = useTheme();
  const { tasks, currentTask, setCurrentTask, deleteTask } = useTask();

  const handleTaskPress = (task) => {
    setCurrentTask(task);
  };

  const handleDeleteTask = (taskId) => {
    deleteTask(taskId);
  };

  const getProgressColor = (task) => {
    const progress = task.completedPomodoros / task.estimatedPomodoros;
    if (progress >= 1) return theme.success;
    if (progress >= 0.5) return theme.warning;
    return theme.primary;
  };

  return (
    <ScrollView style={styles.container}>
      {tasks.map((task) => (
        <TouchableOpacity
          key={task.id}
          style={[
            styles.taskCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderLeftColor: priorityColors[task.priority],
            },
          ]}
          onPress={() => handleTaskPress(task)}
        >
          <View style={styles.taskHeader}>
            <Text style={[styles.taskTitle, { color: theme.text }]}>
              {task.title}
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTask(task.id)}
            >
              <Text style={[styles.deleteButtonText, { color: theme.textSecondary }]}>
                ×
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskDetails}>
            <Text style={[styles.taskSubject, { color: theme.textSecondary }]}>
              {task.subject}
            </Text>
            <Text style={[styles.taskPriority, { color: priorityColors[task.priority] }]}>
              {task.priority}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.background }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(task.completedPomodoros / task.estimatedPomodoros) * 100}%`,
                    backgroundColor: getProgressColor(task),
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {task.completedPomodoros}/{task.estimatedPomodoros} pomodoros
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  taskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskSubject: {
    fontSize: 14,
  },
  taskPriority: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
}); 