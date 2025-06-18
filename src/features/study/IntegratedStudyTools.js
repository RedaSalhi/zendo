import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import FlashcardSystem from './FlashcardSystem';
import VoiceNotes from './VoiceNotes';
import StudyChecklists from './StudyChecklists';
import TimerTemplates from './TimerTemplates';

const { width } = Dimensions.get('window');

const IntegratedStudyTools = ({ subject, onClose, onStartSession }) => {
  const { theme } = useTheme();
  const [activeTool, setActiveTool] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    flashcardsReviewed: 0,
    notesCreated: 0,
    checklistsCompleted: 0,
    totalStudyTime: 0,
  });

  const tools = [
    {
      id: 'flashcards',
      name: 'Flashcards',
      description: 'Review cards with spaced repetition',
      icon: '',
      color: theme.primary,
      gradient: [theme.primary, theme.primary],
      component: FlashcardSystem,
    },
    {
      id: 'voiceNotes',
      name: 'Voice Notes',
      description: 'Quick voice-to-text note capture',
      icon: '',
      color: theme.accent,
      gradient: [theme.accent, theme.accent],
      component: VoiceNotes,
    },
    {
      id: 'checklists',
      name: 'Study Checklists',
      description: 'Pre and post-study organization',
      icon: '',
      color: theme.success,
      gradient: [theme.success, theme.success],
      component: StudyChecklists,
    },
    {
      id: 'templates',
      name: 'Timer Templates',
      description: 'Pre-configured study sessions',
      icon: '',
      color: theme.warning,
      gradient: [theme.warning, theme.warning],
      component: TimerTemplates,
    },
  ];

  const handleToolSelect = (tool) => {
    setActiveTool(tool);
  };

  const handleToolClose = () => {
    setActiveTool(null);
  };

  const handleTemplateSelect = (template) => {
    onStartSession(template);
    setActiveTool(null);
  };

  const getToolStats = (toolId) => {
    // In a real app, you'd fetch these from your data store
    const stats = {
      flashcards: { count: 12, lastUsed: '2 hours ago' },
      voiceNotes: { count: 5, lastUsed: '1 day ago' },
      checklists: { count: 3, lastUsed: '3 hours ago' },
      templates: { count: 8, lastUsed: '5 hours ago' },
    };
    return stats[toolId] || { count: 0, lastUsed: 'Never' };
  };

  const renderToolCard = (tool) => {
    const stats = getToolStats(tool.id);
    return (
      <TouchableOpacity
        key={tool.id}
        style={[styles.toolCard, { backgroundColor: theme.surface }]}
        onPress={() => handleToolSelect(tool)}
      >
        <View style={styles.toolGradient}>
          <View style={styles.toolHeader}>
            <Text style={styles.toolIcon}>{tool.icon}</Text>
            <View style={styles.toolInfo}>
              <Text style={[styles.toolName, { color: theme.text }]}>{tool.name}</Text>
              <Text style={[styles.toolDescription, { color: theme.textSecondary }]}>{tool.description}</Text>
            </View>
          </View>
          <View style={styles.toolStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Items</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.count}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Last Used</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.lastUsed}</Text>
            </View>
          </View>
          <View style={styles.toolFooter}>
            <Text style={[styles.toolAction, { color: theme.textSecondary }]}>Tap to open →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderActiveTool = () => {
    if (!activeTool) return null;

    const ToolComponent = activeTool.component;
    
    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }] }>
          <View style={[styles.modalHeader, { backgroundColor: theme.surface }] }>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleToolClose}
            >
              <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{activeTool.name}</Text>
            <View style={{ width: 60 }} />
          </View>
          
          <ToolComponent
            subject={subject}
            onClose={handleToolClose}
            onTemplateSelect={handleTemplateSelect}
          />
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }] }>
      <View style={[styles.header, { backgroundColor: theme.surface }] }>
        <Text style={[styles.title, { color: theme.text }]}>Study Tools</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Integrated tools for focused learning</Text>
      </View>

      {/* Quick Stats */}
      <View style={[styles.statsContainer, { backgroundColor: theme.surface }] }>
        <View style={styles.statsGradient}>
          <Text style={[styles.statsTitle, { color: theme.text }]}>Today's Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{sessionStats.flashcardsReviewed}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Cards Reviewed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{sessionStats.notesCreated}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Notes Created</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{sessionStats.checklistsCompleted}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Checklists Done</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{Math.floor(sessionStats.totalStudyTime / 60)}m</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Study Time</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tools Grid */}
      <ScrollView style={styles.toolsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Available Tools</Text>
        {tools.map(renderToolCard)}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.surface }]}
          onPress={() => handleToolSelect(tools[3])}
        >
          <View style={styles.quickActionGradient}>
            <Text style={[styles.quickActionText, { color: theme.text }]}>Start Session</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.secondary }]} onPress={onClose}>
        <Text style={[styles.closeButtonText, { color: theme.text }]}>Close</Text>
      </TouchableOpacity>

      {renderActiveTool()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  statsContainer: {
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 80) / 2 - 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  toolsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  toolCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolGradient: {
    padding: 20,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  toolIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  toolDescription: {
    fontSize: 14,
  },
  toolStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  toolFooter: {
    alignItems: 'center',
  },
  toolAction: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  quickActions: {
    padding: 20,
  },
  quickActionButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default IntegratedStudyTools; 