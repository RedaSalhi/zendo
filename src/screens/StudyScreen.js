import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import StudySession from '../features/study/StudySession';
import IntegratedStudyTools from '../features/study/IntegratedStudyTools';

const StudyScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topics, setTopics] = useState([]);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showStudyTools, setShowStudyTools] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', description: '' });
  const [sessionTemplate, setSessionTemplate] = useState(null);

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Literature',
    'History',
    'Psychology',
  ];

  const handleStartSession = (template = null) => {
    if (!selectedSubject) {
      Alert.alert('Select Subject', 'Please select a subject to start studying.');
      return;
    }
    if (topics.length === 0) {
      Alert.alert('Add Topics', 'Please add at least one topic to study.');
      return;
    }
    
    if (template) {
      setSessionTemplate(template);
    }
    setIsSessionActive(true);
  };

  const handleEndSession = (sessionData) => {
    setIsSessionActive(false);
    setSessionTemplate(null);
    Alert.alert(
      'Session Complete!',
      `Great job! You studied ${topics.length} topics for ${Math.floor((sessionData.endTime - sessionData.startTime) / 60000)} minutes.`,
      [{ text: 'OK' }]
    );
  };

  const addTopic = () => {
    if (newTopic.title.trim() && newTopic.description.trim()) {
      setTopics([...topics, { ...newTopic, id: Date.now() }]);
      setNewTopic({ title: '', description: '' });
      setShowTopicModal(false);
    }
  };

  const removeTopic = (topicId) => {
    setTopics(topics.filter(topic => topic.id !== topicId));
  };

  if (isSessionActive) {
    return (
      <StudySession
        subject={selectedSubject}
        topics={topics}
        onSessionEnd={handleEndSession}
        template={sessionTemplate}
      />
    );
  }

  if (showStudyTools) {
    return (
      <IntegratedStudyTools
        subject={selectedSubject}
        onClose={() => setShowStudyTools(false)}
        onStartSession={handleStartSession}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.background, theme.surface]}
        style={styles.backgroundGradient}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Evidence-Based Study
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Master learning with proven techniques
          </Text>
        </View>

        {/* Subject Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Choose Subject
          </Text>
          <View style={styles.subjectGrid}>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject}
                style={[
                  styles.subjectButton,
                  { backgroundColor: theme.surface },
                  selectedSubject === subject && { backgroundColor: theme.primary }
                ]}
                onPress={() => setSelectedSubject(subject)}
              >
                <Text
                  style={[
                    styles.subjectText,
                    { color: selectedSubject === subject ? '#fff' : theme.text }
                  ]}
                >
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Topics Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Study Topics
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowTopicModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Topic</Text>
            </TouchableOpacity>
          </View>

          {topics.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                No topics added yet. Add your first topic to begin studying!
              </Text>
            </View>
          ) : (
            <View style={styles.topicsList}>
              {topics.map((topic) => (
                <View
                  key={topic.id}
                  style={[styles.topicItem, { backgroundColor: theme.surface }]}
                >
                  <View style={styles.topicContent}>
                    <Text style={[styles.topicTitle, { color: theme.text }]}>
                      {topic.title}
                    </Text>
                    <Text style={[styles.topicDescription, { color: theme.textSecondary }]}>
                      {topic.description}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeTopic(topic.id)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Study Tools Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Integrated Study Tools
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Access flashcards, voice notes, checklists, and timer templates
          </Text>
          
          <TouchableOpacity
            style={[styles.studyToolsButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowStudyTools(true)}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.studyToolsGradient}
            >
              <Text style={styles.studyToolsText}>Open Study Tools</Text>
              <Text style={styles.studyToolsSubtext}>Flashcards • Voice Notes • Checklists • Templates</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Study Techniques Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Study Techniques
          </Text>
          <View style={styles.techniquesList}>
            <View style={[styles.techniqueItem, { backgroundColor: theme.surface }]}>
              <Text style={[styles.techniqueTitle, { color: theme.text }]}>
                Active Recall
              </Text>
              <Text style={[styles.techniqueDescription, { color: theme.textSecondary }]}>
                Built-in question prompts during breaks to strengthen memory
              </Text>
            </View>
            <View style={[styles.techniqueItem, { backgroundColor: theme.surface }]}>
              <Text style={[styles.techniqueTitle, { color: theme.text }]}>
                Spaced Repetition
              </Text>
              <Text style={[styles.techniqueDescription, { color: theme.textSecondary }]}>
                Intelligent review scheduling for optimal retention
              </Text>
            </View>
            <View style={[styles.techniqueItem, { backgroundColor: theme.surface }]}>
              <Text style={[styles.techniqueTitle, { color: theme.text }]}>
                Feynman Technique
              </Text>
              <Text style={[styles.techniqueDescription, { color: theme.textSecondary }]}>
                Guided teaching-back exercises to deepen understanding
              </Text>
            </View>
            <View style={[styles.techniqueItem, { backgroundColor: theme.surface }]}>
              <Text style={[styles.techniqueTitle, { color: theme.text }]}>
                Interleaving
              </Text>
              <Text style={[styles.techniqueDescription, { color: theme.textSecondary }]}>
                Automatic subject switching for better learning
              </Text>
            </View>
            <View style={[styles.techniqueItem, { backgroundColor: theme.surface }]}>
              <Text style={[styles.techniqueTitle, { color: theme.text }]}>
                Flashcard System
              </Text>
              <Text style={[styles.techniqueDescription, { color: theme.textSecondary }]}>
                Spaced repetition flashcards for efficient memorization
              </Text>
            </View>
            <View style={[styles.techniqueItem, { backgroundColor: theme.surface }]}>
              <Text style={[styles.techniqueTitle, { color: theme.text }]}>
                Voice Notes
              </Text>
              <Text style={[styles.techniqueDescription, { color: theme.textSecondary }]}>
                Quick voice-to-text capture during study sessions
              </Text>
            </View>
          </View>
        </View>

        {/* Start Session Button */}
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: theme.primary }]}
          onPress={() => handleStartSession()}
        >
          <Text style={styles.startButtonText}>Start Study Session</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Topic Modal */}
      <Modal
        visible={showTopicModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTopicModal(false)}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Add New Topic
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Topic title"
              placeholderTextColor={theme.textSecondary}
              value={newTopic.title}
              onChangeText={(text) => setNewTopic({ ...newTopic, title: text })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Topic description"
              placeholderTextColor={theme.textSecondary}
              value={newTopic.description}
              onChangeText={(text) => setNewTopic({ ...newTopic, description: text })}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.background }]}
                onPress={() => setShowTopicModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={addTopic}
              >
                <Text style={styles.modalButtonText}>Add Topic</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subjectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 14,
  },
  topicsList: {
    gap: 12,
  },
  topicItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  studyToolsButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  studyToolsGradient: {
    padding: 25,
    alignItems: 'center',
  },
  studyToolsIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  studyToolsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  studyToolsSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  techniquesList: {
    gap: 12,
  },
  techniqueItem: {
    padding: 16,
    borderRadius: 12,
  },
  techniqueTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  techniqueDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  startButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default StudyScreen; 