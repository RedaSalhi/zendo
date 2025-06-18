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
    <View style={styles.container}>
      <Text style={styles.title}>Study Checklists</Text>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {Object.keys(checklistManager.templates).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.tab, activeTab === type && styles.activeTab]}
            onPress={() => setActiveTab(type)}
          >
            <Text style={[styles.tabText, activeTab === type && styles.activeTabText]}>
              {getChecklistTypeName(type)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Create New Checklist */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setIsCreating(true)}
      >
        <LinearGradient
          colors={['#007AFF', '#5AC8FA']}
          style={styles.createGradient}
        >
          <Text style={styles.createButtonText}>+ Create New Checklist</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Checklists List */}
      <ScrollView style={styles.checklistsContainer}>
        {filteredChecklists.map((checklist) => (
          <View key={checklist.id} style={styles.checklistItem}>
            <View style={styles.checklistHeader}>
              <Text style={styles.checklistTitle}>
                {getChecklistTypeName(checklist.type)} Checklist
              </Text>
              <View style={styles.checklistActions}>
                <Text style={styles.progressText}>
                  {Math.round(checklist.progress)}%
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteChecklist(checklist.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${checklist.progress}%` }
                ]} 
              />
            </View>

            {checklist.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistItemRow}
                onPress={() => toggleItem(checklist.id, item.id)}
              >
                <View style={[
                  styles.checkbox,
                  item.completed && styles.checkboxCompleted
                ]}>
                  {item.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[
                  styles.itemText,
                  item.completed && styles.itemTextCompleted
                ]}>
                  {item.text}
                </Text>
                <View style={[
                  styles.categoryBadge,
                  { backgroundColor: getCategoryColor(item.category) }
                ]}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text style={styles.checklistDate}>
              Created: {formatDate(checklist.createdAt)}
            </Text>
          </View>
        ))}

        {filteredChecklists.length === 0 && (
          <Text style={styles.emptyText}>
            No {getChecklistTypeName(activeTab).toLowerCase()} checklists yet. Create one to get started!
          </Text>
        )}
      </ScrollView>

      {/* Create Checklist Modal */}
      {isCreating && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Create New Checklist</Text>
            
            <Text style={styles.label}>Checklist Type:</Text>
            <View style={styles.typeSelector}>
              {Object.keys(checklistManager.templates).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    newChecklist.type === type && styles.selectedType
                  ]}
                  onPress={() => setNewChecklist({ ...newChecklist, type })}
                >
                  <Text style={[
                    styles.typeText,
                    newChecklist.type === type && styles.selectedTypeText
                  ]}>
                    {getChecklistTypeName(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Custom Items (Optional):</Text>
            <View style={styles.customItemContainer}>
              <TextInput
                style={styles.customItemInput}
                value={customItem}
                onChangeText={setCustomItem}
                placeholder="Add custom checklist item..."
                onSubmitEditing={addCustomItem}
              />
              <TouchableOpacity style={styles.addItemButton} onPress={addCustomItem}>
                <Text style={styles.addItemButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {newChecklist.customItems.length > 0 && (
              <View style={styles.customItemsList}>
                {newChecklist.customItems.map((item, index) => (
                  <View key={index} style={styles.customItemRow}>
                    <Text style={styles.customItemText}>{item}</Text>
                    <TouchableOpacity onPress={() => removeCustomItem(index)}>
                      <Text style={styles.removeItemText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsCreating(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createModalButton]}
                onPress={createNewChecklist}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 5,
  },
  tab: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
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
  checklistsContainer: {
    flex: 1,
  },
  checklistItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checklistActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 10,
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  checklistDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
  },
  selectedTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  customItemContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  customItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  addItemButton: {
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addItemButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  customItemsList: {
    marginBottom: 20,
  },
  customItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 5,
  },
  customItemText: {
    flex: 1,
    fontSize: 14,
  },
  removeItemText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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

export default StudyChecklists; 