// src/context/TaskContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const TaskContext = createContext();

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);

  // Load tasks from AsyncStorage on mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem('tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to load tasks. Using empty task list.',
        [{ text: 'OK' }]
      );
      console.error('Failed to load tasks:', error);
    }
  };

  const saveTasks = async (updatedTasks) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save tasks.',
        [{ text: 'OK' }]
      );
      console.error('Failed to save tasks:', error);
    }
  };

  const addTask = async (task) => {
    const newTask = {
      id: Date.now().toString(),
      title: task.title,
      subject: task.subject,
      priority: task.priority,
      estimatedPomodoros: task.estimatedPomodoros,
      completedPomodoros: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: 'pending'
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    return newTask;
  };

  const updateTask = async (taskId, updates) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const deleteTask = async (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const completePomodoro = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const completedPomodoros = task.completedPomodoros + 1;
    const status = completedPomodoros >= task.estimatedPomodoros ? 'completed' : 'pending';
    const completedAt = status === 'completed' ? new Date().toISOString() : null;

    await updateTask(taskId, {
      completedPomodoros,
      status,
      completedAt
    });
  };

  const value = {
    tasks,
    currentTask,
    setCurrentTask,
    addTask,
    updateTask,
    deleteTask,
    completePomodoro
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}; 