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
    color: '#007AFF',
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
      color: '#007AFF',
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
    <View style={styles.container}>
      <Text style={styles.title}>Timer Templates</Text>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        {getCategories().map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategory
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.selectedCategoryText
            ]}>
              {category === 'all' ? '📋' : getCategoryIcon(category)} {getCategoryName(category)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create Custom Template Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setIsCreating(true)}
      >
        <LinearGradient
          colors={['#007AFF', '#5AC8FA']}
          style={styles.createGradient}
        >
          <Text style={styles.createButtonText}>+ Create Custom Template</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Templates List */}
      <ScrollView style={styles.templatesContainer}>
        {filteredTemplates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateItem}
            onPress={() => handleTemplateSelect(template)}
          >
            <LinearGradient
              colors={[template.color, `${template.color}80`]}
              style={styles.templateGradient}
            >
              <View style={styles.templateHeader}>
                <Text style={styles.templateIcon}>{template.icon}</Text>
                <Text style={styles.templateName}>{template.name}</Text>
                {template.isCustom && (
                  <TouchableOpacity
                    style={styles.deleteTemplateButton}
                    onPress={() => deleteCustomTemplate(template.id)}
                  >
                    <Text style={styles.deleteTemplateText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={styles.templateDescription}>{template.description}</Text>
              
              <View style={styles.templateDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Work:</Text>
                  <Text style={styles.detailValue}>
                    {templateManager.formatDuration(template.workDuration)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Break:</Text>
                  <Text style={styles.detailValue}>
                    {templateManager.formatDuration(template.breakDuration)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Long Break:</Text>
                  <Text style={styles.detailValue}>
                    {templateManager.formatDuration(template.longBreakDuration)}
                  </Text>
                </View>
              </View>

              <View style={styles.templateFooter}>
                <Text style={styles.categoryTag}>
                  {getCategoryName(template.category)}
                </Text>
                {template.isCustom && (
                  <Text style={styles.customTag}>Custom</Text>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {filteredTemplates.length === 0 && (
          <Text style={styles.emptyText}>
            No templates found for {getCategoryName(selectedCategory).toLowerCase()}.
          </Text>
        )}
      </ScrollView>

      {/* Create Template Modal */}
      <Modal
        visible={isCreating}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Create Custom Template</Text>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.label}>Template Name:</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.name}
                onChangeText={(text) => setNewTemplate({ ...newTemplate, name: text })}
                placeholder="Enter template name"
              />

              <Text style={styles.label}>Description:</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.description}
                onChangeText={(text) => setNewTemplate({ ...newTemplate, description: text })}
                placeholder="Enter description"
                multiline
              />

              <Text style={styles.label}>Category:</Text>
              <View style={styles.categorySelector}>
                {['focus', 'review', 'exam', 'reading', 'problem-solving'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      newTemplate.category === category && styles.selectedCategoryOption
                    ]}
                    onPress={() => setNewTemplate({ ...newTemplate, category })}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      newTemplate.category === category && styles.selectedCategoryOptionText
                    ]}>
                      {getCategoryIcon(category)} {getCategoryName(category)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Durations (in minutes):</Text>
              <View style={styles.durationContainer}>
                <View style={styles.durationItem}>
                  <Text style={styles.durationLabel}>Work:</Text>
                  <TextInput
                    style={styles.durationInput}
                    value={String(newTemplate.workDuration / 60)}
                    onChangeText={(text) => updateDuration('workDuration', text)}
                    keyboardType="numeric"
                    placeholder="25"
                  />
                </View>
                <View style={styles.durationItem}>
                  <Text style={styles.durationLabel}>Break:</Text>
                  <TextInput
                    style={styles.durationInput}
                    value={String(newTemplate.breakDuration / 60)}
                    onChangeText={(text) => updateDuration('breakDuration', text)}
                    keyboardType="numeric"
                    placeholder="5"
                  />
                </View>
                <View style={styles.durationItem}>
                  <Text style={styles.durationLabel}>Long Break:</Text>
                  <TextInput
                    style={styles.durationInput}
                    value={String(newTemplate.longBreakDuration / 60)}
                    onChangeText={(text) => updateDuration('longBreakDuration', text)}
                    keyboardType="numeric"
                    placeholder="15"
                  />
                </View>
              </View>

              <Text style={styles.label}>Sessions before long break:</Text>
              <TextInput
                style={styles.input}
                value={String(newTemplate.sessionsBeforeLongBreak)}
                onChangeText={(text) => setNewTemplate({
                  ...newTemplate,
                  sessionsBeforeLongBreak: parseInt(text) || 4
                })}
                keyboardType="numeric"
                placeholder="4"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsCreating(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createModalButton]}
                onPress={createCustomTemplate}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  createButton: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  createGradient: {
    padding: 15,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  templatesContainer: {
    flex: 1,
  },
  templateItem: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  templateGradient: {
    padding: 20,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  templateIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  templateName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteTemplateButton: {
    padding: 5,
  },
  deleteTemplateText: {
    fontSize: 16,
  },
  templateDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 15,
  },
  templateDetails: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  customTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalContent: {
    maxHeight: 400,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  durationContainer: {
    marginBottom: 10,
  },
  durationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 80,
  },
  durationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
  },
  createModalButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#8E8E93',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TimerTemplates; 