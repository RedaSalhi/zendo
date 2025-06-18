import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

class StudyChecklistManager {
  constructor() {
    this.checklists = [];
    this.templates = this.getDefaultTemplates();
  }

  getDefaultTemplates() {
    return {
      preStudy: [
        { id: '1', text: 'Clear study space and remove distractions', category: 'environment' },
        { id: '2', text: 'Gather all necessary materials (books, notes, pens)', category: 'materials' },
        { id: '3', text: 'Set specific learning goals for this session', category: 'planning' },
        { id: '4', text: 'Review previous session notes or flashcards', category: 'review' },
        { id: '5', text: 'Set timer for focused study period', category: 'timing' },
        { id: '6', text: 'Have water and healthy snacks ready', category: 'wellness' },
      ],
      postStudy: [
        { id: '1', text: 'Summarize key points learned today', category: 'reflection' },
        { id: '2', text: 'Create flashcards for difficult concepts', category: 'review' },
        { id: '3', text: 'Plan next study session topics', category: 'planning' },
        { id: '4', text: 'Update study schedule if needed', category: 'organization' },
        { id: '5', text: 'Rate understanding of each topic (1-5)', category: 'assessment' },
        { id: '6', text: 'Note any questions for next session', category: 'questions' },
      ],
      examPrep: [
        { id: '1', text: 'Review all course materials and notes', category: 'review' },
        { id: '2', text: 'Practice with past exams or sample questions', category: 'practice' },
        { id: '3', text: 'Create summary sheets for each topic', category: 'organization' },
        { id: '4', text: 'Identify weak areas for focused study', category: 'assessment' },
        { id: '5', text: 'Plan study schedule leading up to exam', category: 'planning' },
        { id: '6', text: 'Prepare exam day materials and logistics', category: 'preparation' },
      ],
    };
  }

  async createChecklist(type, subject, customItems = []) {
    const template = this.templates[type] || [];
    const checklist = {
      id: Date.now().toString(),
      type,
      subject,
      items: [...template, ...customItems.map((item, index) => ({
        id: `custom_${index}`,
        text: item,
        category: 'custom',
        completed: false,
      }))].map(item => ({ ...item, completed: false })),
      createdAt: Date.now(),
      completedAt: null,
      progress: 0,
    };

    this.checklists.push(checklist);
    await this.saveChecklists();
    return checklist;
  }

  async toggleItem(checklistId, itemId) {
    const checklist = this.checklists.find(c => c.id === checklistId);
    if (!checklist) return;

    const item = checklist.items.find(i => i.id === itemId);
    if (item) {
      item.completed = !item.completed;
      checklist.progress = (checklist.items.filter(i => i.completed).length / checklist.items.length) * 100;
      
      if (checklist.progress === 100) {
        checklist.completedAt = Date.now();
      } else {
        checklist.completedAt = null;
      }

      await this.saveChecklists();
    }
  }

  async deleteChecklist(checklistId) {
    this.checklists = this.checklists.filter(c => c.id !== checklistId);
    await this.saveChecklists();
  }

  async saveChecklists() {
    await AsyncStorage.setItem('studyChecklists', JSON.stringify(this.checklists));
  }

  async loadChecklists() {
    const checklists = await AsyncStorage.getItem('studyChecklists');
    if (checklists) {
      this.checklists = JSON.parse(checklists);
    }
  }

  getChecklistsByType(type) {
    return this.checklists.filter(c => c.type === type);
  }

  getChecklistsBySubject(subject) {
    return this.checklists.filter(c => c.subject === subject);
  }

  getActiveChecklists() {
    return this.checklists.filter(c => !c.completedAt);
  }

  getCompletedChecklists() {
    return this.checklists.filter(c => c.completedAt);
  }
}

const StudyChecklists = ({ subject, onClose }) => {
  const { theme } = useTheme();
  const [checklistManager] = useState(new StudyChecklistManager());
  const [activeTab, setActiveTab] = useState('preStudy');
  const [checklists, setChecklists] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newChecklist, setNewChecklist] = useState({ type: 'preStudy', customItems: [] });
  const [customItem, setCustomItem] = useState('');
  const [slideAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    initializeChecklists();
  }, []);

  const initializeChecklists = async () => {
    await checklistManager.loadChecklists();
    const subjectChecklists = checklistManager.getChecklistsBySubject(subject);
    setChecklists(subjectChecklists);
  };

  const createNewChecklist = async () => {
    if (!newChecklist.type) {
      Alert.alert('Error', 'Please select a checklist type');
      return;
    }

    await checklistManager.createChecklist(
      newChecklist.type,
      subject,
      newChecklist.customItems
    );
    
    setNewChecklist({ type: 'preStudy', customItems: [] });
    setIsCreating(false);
    initializeChecklists();
    Alert.alert('Success', 'Checklist created successfully!');
  };

  const addCustomItem = () => {
    if (!customItem.trim()) return;
    
    setNewChecklist({
      ...newChecklist,
      customItems: [...newChecklist.customItems, customItem.trim()]
    });
    setCustomItem('');
  };

  const removeCustomItem = (index) => {
    const updatedItems = newChecklist.customItems.filter((_, i) => i !== index);
    setNewChecklist({ ...newChecklist, customItems: updatedItems });
  };

  const toggleItem = async (checklistId, itemId) => {
    await checklistManager.toggleItem(checklistId, itemId);
    initializeChecklists();
  };

  const deleteChecklist = async (checklistId) => {
    Alert.alert(
      'Delete Checklist',
      'Are you sure you want to delete this checklist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await checklistManager.deleteChecklist(checklistId);
            initializeChecklists();
          },
        },
      ]
    );
  };

  const getChecklistTypeName = (type) => {
    const names = {
      preStudy: 'Pre-Study',
      postStudy: 'Post-Study',
      examPrep: 'Exam Prep',
    };
    return names[type] || type;
  };

  const getCategoryColor = (category) => {
    const colors = {
      environment: '#FF9500',
      materials: '#007AFF',
      planning: '#34C759',
      review: '#AF52DE',
      timing: '#FF3B30',
      wellness: '#5856D6',
      reflection: '#FF2D92',
      organization: '#5AC8FA',
      assessment: '#FF9500',
      questions: '#FF3B30',
      practice: '#34C759',
      preparation: '#AF52DE',
      custom: '#8E8E93',
    };
    return colors[category] || '#8E8E93';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredChecklists = checklists.filter(c => c.type === activeTab);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Study Checklists</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'preStudy' && [styles.activeTab, { backgroundColor: theme.primary }]
          ]}
          onPress={() => setActiveTab('preStudy')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'preStudy' ? styles.activeTabText : { color: theme.text }
          ]}>Pre-Study</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'postStudy' && [styles.activeTab, { backgroundColor: theme.primary }]
          ]}
          onPress={() => setActiveTab('postStudy')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'postStudy' ? styles.activeTabText : { color: theme.text }
          ]}>Post-Study</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'examPrep' && [styles.activeTab, { backgroundColor: theme.primary }]
          ]}
          onPress={() => setActiveTab('examPrep')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'examPrep' ? styles.activeTabText : { color: theme.text }
          ]}>Exam Prep</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.primary }]}
        onPress={() => setIsCreating(true)}
      >
        <Text style={styles.createButtonText}>+ Create New Checklist</Text>
      </TouchableOpacity>

      {checklists.length === 0 && !isCreating && (
        <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
          No {activeTab === 'preStudy' ? 'pre-study' : activeTab === 'postStudy' ? 'post-study' : 'exam prep'} checklists yet. Create one to get started!
        </Text>
      )}

      <ScrollView style={styles.checklistsContainer}>
        {checklists
          .filter(checklist => checklist.type === activeTab)
          .map(checklist => (
            <View 
              key={checklist.id} 
              style={[styles.checklistCard, { backgroundColor: theme.surface }]}
            >
              <View style={styles.checklistHeader}>
                <Text style={[styles.checklistTitle, { color: theme.text }]}>
                  {subject} - {getChecklistTypeName(checklist.type)}
                </Text>
                <TouchableOpacity
                  onPress={() => deleteChecklist(checklist.id)}
                  style={styles.deleteButton}
                >
                  <Text style={[styles.deleteButtonText, { color: theme.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>

              {checklist.items.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.checklistItem,
                    { borderBottomColor: theme.border }
                  ]}
                  onPress={() => toggleItem(checklist.id, item.id)}
                >
                  <View style={[
                    styles.checkbox,
                    item.completed && { backgroundColor: theme.primary },
                    { borderColor: theme.primary }
                  ]} />
                  <Text style={[
                    styles.itemText,
                    { color: theme.text },
                    item.completed && styles.completedItemText
                  ]}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      backgroundColor: theme.primary,
                      width: `${checklist.progress}%` 
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
      </ScrollView>

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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 15,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '600',
  },
  createButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 15,
    marginTop: 20,
  },
  checklistsContainer: {
    flex: 1,
  },
  checklistCard: {
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 14,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 11,
    marginRight: 12,
  },
  itemText: {
    fontSize: 15,
    flex: 1,
  },
  completedItemText: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  closeButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default StudyChecklists; 