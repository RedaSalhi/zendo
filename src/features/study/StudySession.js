import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import StudySessionManager from './StudySessionManager';
import FlashcardSystem from './FlashcardSystem';
import VoiceNotes from './VoiceNotes';
import StudyChecklists from './StudyChecklists';

const StudySession = ({ subject, topics, onSessionEnd, template }) => {
  const [sessionManager] = useState(new StudySessionManager());
  const [currentTopic, setCurrentTopic] = useState(null);
  const [isBreak, setIsBreak] = useState(false);
  const [breakPrompt, setBreakPrompt] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [showStudyTools, setShowStudyTools] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [workTime, setWorkTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Use template settings if provided
  const workDuration = template ? template.workDuration : 25 * 60; // 25 minutes default
  const breakDuration = template ? template.breakDuration : 5 * 60; // 5 minutes default
  const longBreakDuration = template ? template.longBreakDuration : 15 * 60; // 15 minutes default
  const sessionsBeforeLongBreak = template ? template.sessionsBeforeLongBreak : 4;

  useEffect(() => {
    initializeSession();
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
      if (!isBreak) {
        setWorkTime(prev => prev + 1);
      } else {
        setBreakTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isBreak]);

  const initializeSession = async () => {
    const session = await sessionManager.startSession(subject, topics);
    setCurrentTopic(session.topics[0]);
  };

  const handleBreak = async () => {
    const breakInfo = await sessionManager.takeBreak();
    setIsBreak(true);
    setBreakPrompt(breakInfo.activeRecallPrompt);
    setBreakTime(0);

    // Auto-end break after duration
    setTimeout(() => {
      setIsBreak(false);
      setBreakPrompt(null);
      setSessionsCompleted(prev => prev + 1);
    }, breakDuration);
  };

  const handleTopicSwitch = async () => {
    const nextTopic = await sessionManager.switchTopic();
    setCurrentTopic(nextTopic);
  };

  const handleEndSession = async () => {
    const session = await sessionManager.endSession();
    onSessionEnd(session);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentBreakDuration = () => {
    if (sessionsCompleted > 0 && sessionsCompleted % sessionsBeforeLongBreak === 0) {
      return longBreakDuration;
    }
    return breakDuration;
  };

  const getBreakProgress = () => {
    const currentBreakDuration = getCurrentBreakDuration();
    return (breakTime / currentBreakDuration) * 100;
  };

  const getWorkProgress = () => {
    return (workTime / workDuration) * 100;
  };

  const openStudyTool = (tool) => {
    setActiveTool(tool);
    setShowStudyTools(false);
  };

  const closeStudyTool = () => {
    setActiveTool(null);
  };

  const renderStudyTools = () => {
    const tools = [
      {
        id: 'flashcards',
        name: 'Flashcards',
        icon: '',
        component: FlashcardSystem,
      },
      {
        id: 'voiceNotes',
        name: 'Voice Notes',
        icon: '',
        component: VoiceNotes,
      },
      {
        id: 'checklists',
        name: 'Checklists',
        icon: '',
        component: StudyChecklists,
      },
    ];

    return (
      <Modal
        visible={showStudyTools}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Study Tools</Text>
            <Text style={styles.modalSubtitle}>Use these tools during your break</Text>
            
            {tools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={styles.toolButton}
                onPress={() => openStudyTool(tool)}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.toolGradient}
                >
                  <Text style={styles.toolIcon}>{tool.icon}</Text>
                  <Text style={styles.toolName}>{tool.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowStudyTools(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
        <View style={styles.toolModalContainer}>
          <View style={styles.toolModalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={closeStudyTool}
            >
              <Text style={styles.backButtonText}>← Back to Break</Text>
            </TouchableOpacity>
            <Text style={styles.toolModalTitle}>{activeTool.name}</Text>
            <View style={{ width: 100 }} />
          </View>
          
          <ToolComponent
            subject={subject}
            onClose={closeStudyTool}
          />
        </View>
      </Modal>
    );
  };

  if (isBreak) {
    const breakProgress = getBreakProgress();
    const isLongBreak = sessionsCompleted > 0 && sessionsCompleted % sessionsBeforeLongBreak === 0;
    
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={isLongBreak ? ['#4ecdc4', '#44a08d'] : ['#ff9a9e', '#fecfef']}
          style={styles.breakGradient}
        >
          <Text style={styles.breakTitle}>
            {isLongBreak ? 'Long Break!' : 'Break Time!'}
          </Text>
          
          {breakPrompt && (
            <View style={styles.promptContainer}>
              <Text style={styles.promptLabel}>Active Recall Question:</Text>
              <Text style={styles.promptText}>{breakPrompt.question}</Text>
            </View>
          )}

          <View style={styles.breakProgressContainer}>
            <View style={styles.breakProgressBar}>
              <View 
                style={[
                  styles.breakProgressFill, 
                  { width: `${breakProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.breakTimer}>
              {formatTime(getCurrentBreakDuration() - breakTime)} remaining
            </Text>
          </View>

          <View style={styles.breakActions}>
            <TouchableOpacity
              style={styles.studyToolsButton}
              onPress={() => setShowStudyTools(true)}
            >
              <Text style={styles.studyToolsButtonText}>📚 Study Tools</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sessionInfo}>
            Session {sessionsCompleted + 1} • {formatTime(workTime)} work time
          </Text>
        </LinearGradient>

        {renderStudyTools()}
        {renderActiveTool()}
      </View>
    );
  }

  const workProgress = getWorkProgress();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.workGradient}
      >
        <Text style={styles.timer}>{formatTime(workTime)}</Text>
        <Text style={styles.sessionTimer}>Total: {formatTime(sessionTime)}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${workProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(workProgress)}% complete
          </Text>
        </View>

        <View style={styles.topicContainer}>
          <Text style={styles.topicTitle}>{currentTopic?.title}</Text>
          <Text style={styles.topicDescription}>{currentTopic?.description}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleBreak}>
            <Text style={styles.buttonText}>Take Break</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={handleTopicSwitch}>
            <Text style={styles.buttonText}>Switch Topic</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.endButton]} 
            onPress={handleEndSession}
          >
            <Text style={styles.buttonText}>End Session</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sessionInfo}>
          Sessions completed: {sessionsCompleted} • Next long break: {sessionsBeforeLongBreak - (sessionsCompleted % sessionsBeforeLongBreak)} sessions
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  workGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  sessionTimer: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 30,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  topicContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '80%',
  },
  topicTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  topicDescription: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  endButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  breakTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  promptContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    maxWidth: '90%',
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  promptText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  breakProgressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  breakProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 10,
  },
  breakProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  breakTimer: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  breakActions: {
    marginBottom: 20,
  },
  studyToolsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  studyToolsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  toolButton: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  toolGradient: {
    padding: 20,
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  toolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeModalButton: {
    backgroundColor: '#8E8E93',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toolModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  toolModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StudySession; 