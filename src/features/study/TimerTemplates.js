import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

class TimerTemplateManager {
  constructor() {
    this.templates = this.getDefaultTemplates();
    this.customTemplates = [];
  }

  getDefaultTemplates() {
    return [
      {
        id: 'pomodoro_classic',
        name: 'Classic Pomodoro',
        description: '25 minutes focused work, 5 minutes break',
        workDuration: 25 * 60, // 25 minutes in seconds
        breakDuration: 5 * 60, // 5 minutes in seconds
        longBreakDuration: 15 * 60, // 15 minutes in seconds
        sessionsBeforeLongBreak: 4,
        category: 'focus',
        icon: '🍅',
        color: '#FF6B6B',
      },
      {
        id: 'deep_work',
        name: 'Deep Work Session',
        description: '90 minutes of uninterrupted focused work',
        workDuration: 90 * 60, // 90 minutes in seconds
        breakDuration: 15 * 60, // 15 minutes in seconds
        longBreakDuration: 30 * 60, // 30 minutes in seconds
        sessionsBeforeLongBreak: 1,
        category: 'focus',
        icon: '🧠',
        color: '#4ECDC4',
      },
      {
        id: 'quick_review',
        name: 'Quick Review',
        description: '15 minutes for rapid review and recall',
        workDuration: 15 * 60, // 15 minutes in seconds
        breakDuration: 3 * 60, // 3 minutes in seconds
        longBreakDuration: 10 * 60, // 10 minutes in seconds
        sessionsBeforeLongBreak: 3,
        category: 'review',
        icon: '⚡',
        color: '#45B7D1',
      },
      {
        id: 'exam_prep',
        name: 'Exam Preparation',
        description: '45 minutes study, 10 minutes break',
        workDuration: 45 * 60, // 45 minutes in seconds
        breakDuration: 10 * 60, // 10 minutes in seconds
        longBreakDuration: 20 * 60, // 20 minutes in seconds
        sessionsBeforeLongBreak: 2,
        category: 'exam',
        icon: '📚',
        color: '#96CEB4',
      },
      {
        id: 'reading_session',
        name: 'Reading Session',
        description: '30 minutes for reading and comprehension',
        workDuration: 30 * 60, // 30 minutes in seconds
        breakDuration: 8 * 60, // 8 minutes in seconds
        longBreakDuration: 15 * 60, // 15 minutes in seconds
        sessionsBeforeLongBreak: 3,
        category: 'reading',
        icon: '📖',
        color: '#FFEAA7',
      },
      {
        id: 'problem_solving',
        name: 'Problem Solving',
        description: '60 minutes for complex problem solving',
        workDuration: 60 * 60, // 60 minutes in seconds
        breakDuration: 12 * 60, // 12 minutes in seconds
        longBreakDuration: 25 * 60, // 25 minutes in seconds
        sessionsBeforeLongBreak: 2,
        category: 'problem-solving',
        icon: '🔢',
        color: '#DDA0DD',
      },
    ];
  }

  async addCustomTemplate(template) {
    const customTemplate = {
      ...template,
      id: `custom_${Date.now()}`,
      isCustom: true,
      createdAt: Date.now(),
    };

    this.customTemplates.push(customTemplate);
    await this.saveCustomTemplates();
    return customTemplate;
  }

  async deleteCustomTemplate(templateId) {
    this.customTemplates = this.customTemplates.filter(t => t.id !== templateId);
    await this.saveCustomTemplates();
  }

  async saveCustomTemplates() {
    await AsyncStorage.setItem('customTimerTemplates', JSON.stringify(this.customTemplates));
  }

  async loadCustomTemplates() {
    const templates = await AsyncStorage.getItem('customTimerTemplates');
    if (templates) {
      this.customTemplates = JSON.parse(templates);
    }
  }

  getAllTemplates() {
    return [...this.templates, ...this.customTemplates];
  }

  getTemplatesByCategory(category) {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  getTemplateById(id) {
    return this.getAllTemplates().find(t => t.id === id);
  }

  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

const TimerTemplates = ({ subject, onTemplateSelect, onClose }) => {
  const { theme } = useTheme();
  const [templateManager] = useState(new TimerTemplateManager());
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    workDuration: 25 * 60,
    breakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    sessionsBeforeLongBreak: 4,
    category: 'focus',
    icon: '⏰',
  });

  useEffect(() => {
    initializeTemplates();
  }, []);

  const initializeTemplates = async () => {
    await templateManager.loadCustomTemplates();
    setTemplates(templateManager.getAllTemplates());
  };

  const getCategories = () => {
    const categories = ['all', ...new Set(templates.map(t => t.category))];
    return categories;
  };

  const getCategoryName = (category) => {
    const names = {
      all: 'All',
      focus: 'Focus',
      review: 'Review',
      exam: 'Exam Prep',
      reading: 'Reading',
      'problem-solving': 'Problem Solving',
    };
    return names[category] || category;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      focus: '🎯',
      review: '🔄',
      exam: '📝',
      reading: '📚',
      'problem-solving': '🧮',
    };
    return icons[category] || '⏰';
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const createCustomTemplate = async () => {
    if (!newTemplate.name.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    if (newTemplate.workDuration < 60) {
      Alert.alert('Error', 'Work duration must be at least 1 minute');
      return;
    }

    await templateManager.addCustomTemplate(newTemplate);
    setNewTemplate({
      name: '',
      description: '',
      workDuration: 25 * 60,
      breakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      sessionsBeforeLongBreak: 4,
      category: 'focus',
      icon: '⏰',
    });
    setIsCreating(false);
    initializeTemplates();
    Alert.alert('Success', 'Custom template created successfully!');
  };

  const deleteCustomTemplate = async (templateId) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this custom template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await templateManager.deleteCustomTemplate(templateId);
            initializeTemplates();
          },
        },
      ]
    );
  };

  const handleTemplateSelect = (template) => {
    onTemplateSelect({
      ...template,
      subject,
      startTime: Date.now(),
    });
  };

  const updateDuration = (field, value) => {
    const numValue = parseInt(value) || 0;
    setNewTemplate({
      ...newTemplate,
      [field]: numValue * 60, // Convert minutes to seconds
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {getCategories().map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                { backgroundColor: theme.surface },
                selectedCategory === category && { backgroundColor: theme.primary }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <View style={styles.categoryContent}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
                <Text style={[
                  styles.categoryText,
                  { color: selectedCategory === category ? '#FFF' : theme.text }
                ]}>
                  {getCategoryName(category)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.mainContent}>
        {filteredTemplates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[styles.templateCard, { backgroundColor: theme.surface }]}
            onPress={() => handleTemplateSelect(template)}
          >
            <View style={styles.templateHeader}>
              <Text style={[styles.templateIcon]}>{template.icon}</Text>
              <View style={styles.templateInfo}>
                <Text style={[styles.templateName, { color: theme.text }]}>{template.name}</Text>
                <Text style={[styles.templateDescription, { color: theme.textSecondary }]}>
                  {template.description}
                </Text>
              </View>
            </View>
            
            <View style={[styles.templateDetails, { borderTopColor: theme.border }]}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Work</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {templateManager.formatDuration(template.workDuration)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Break</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {templateManager.formatDuration(template.breakDuration)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Sessions</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {template.sessionsBeforeLongBreak}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.primary }]}
        onPress={() => setIsCreating(true)}
      >
        <Text style={styles.buttonText}>Create Custom Template</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.closeButton, { backgroundColor: theme.surface }]}
        onPress={onClose}
      >
        <Text style={[styles.closeButtonText, { color: theme.text }]}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    paddingTop: 0,
  },
  topSection: {
    marginTop: 8,
  },
  categoryScroll: {
    height: 40,
  },
  categoryButton: {
    height: 40,
    paddingHorizontal: 14,
    marginRight: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mainContent: {
    marginTop: 8,
  },
  templateCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  templateDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  templateDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  createButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TimerTemplates; 