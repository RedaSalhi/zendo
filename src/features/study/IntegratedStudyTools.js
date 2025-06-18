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
    // Get stats from storage or return initial values
    const stats = {
      flashcards: { count: 0, lastUsed: 'Never' },
      checklists: { count: 0, lastUsed: 'Never' },
      templates: { count: 0, lastUsed: 'Never' }
    };
    return stats[toolId] || { count: 0, lastUsed: 'Never' };
  };

  const formatLastUsed = (timestamp) => {
    const now = new Date();
    const lastUsed = new Date(timestamp);
    const diffInMinutes = Math.floor((now - lastUsed) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return lastUsed.toLocaleDateString();
  };

  const renderToolCard = (tool) => {
    const stats = getToolStats(tool.id);
    return (
      <TouchableOpacity
        key={tool.id}
        style={[styles.toolCard, { backgroundColor: theme.surface }]}
        onPress={() => handleToolSelect(tool)}
      >
        <View style={styles.toolContent}>
          <Text style={[styles.toolName, { color: theme.text }]}>{tool.name}</Text>
          <Text style={[styles.toolDescription, { color: theme.textSecondary }]}>{tool.description}</Text>
          <View style={styles.toolStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.count}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Items</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.lastUsed}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Last Used</Text>
            </View>
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
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginBottom: 30,
    borderRadius: 15,
    padding: 20,
  },
  statsGradient: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    minWidth: 100,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  toolCard: {
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  toolContent: {
    padding: 20,
  },
  toolName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  toolDescription: {
    fontSize: 15,
    marginBottom: 20,
  },
  toolStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
    paddingTop: 15,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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