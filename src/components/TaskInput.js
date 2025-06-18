import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTask } from '../context/TaskContext';

const PRIORITIES = ['High', 'Medium', 'Low'];
const SUBJECTS = ['Math', 'Science', 'History', 'Language', 'Other'];

export default function TaskInput({ visible, onClose }) {
  const { theme } = useTheme();
  const { addTask } = useTask();
  
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState('1');

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const task = {
      title: title.trim(),
      subject: subject || 'Other',
      priority,
      estimatedPomodoros: parseInt(estimatedPomodoros) || 1,
    };

    await addTask(task);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setPriority('Medium');
    setEstimatedPomodoros('1');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: `${theme.background}99` }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>Add New Task</Text>
          
          <ScrollView style={styles.form}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Task Title</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              placeholderTextColor={theme.textSecondary}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Subject</Text>
            <View style={styles.optionsContainer}>
              {SUBJECTS.map((subj) => (
                <TouchableOpacity
                  key={subj}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: subject === subj ? theme.primary : theme.background,
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => setSubject(subj)}
                >
                  <Text style={[
                    styles.optionText,
                    { color: subject === subj ? 'white' : theme.text }
                  ]}>
                    {subj}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Priority</Text>
            <View style={styles.optionsContainer}>
              {PRIORITIES.map((pri) => (
                <TouchableOpacity
                  key={pri}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: priority === pri ? theme.primary : theme.background,
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => setPriority(pri)}
                >
                  <Text style={[
                    styles.optionText,
                    { color: priority === pri ? 'white' : theme.text }
                  ]}>
                    {pri}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Estimated Pomodoros</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={estimatedPomodoros}
              onChangeText={setEstimatedPomodoros}
              keyboardType="numeric"
              placeholder="Enter number of pomodoros"
              placeholderTextColor={theme.textSecondary}
            />
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.background }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
            >
              <Text style={[styles.buttonText, { color: 'white' }]}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    maxHeight: '70%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 