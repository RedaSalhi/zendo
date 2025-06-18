import SpacedRepetition from './SpacedRepetition';
import AsyncStorage from '@react-native-async-storage/async-storage';

class StudySessionManager {
  constructor() {
    this.spacedRepetition = new SpacedRepetition();
    this.currentSession = null;
    this.breakInterval = 25 * 60 * 1000; // 25 minutes in milliseconds
    this.breakDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  async startSession(subject, topics) {
    this.currentSession = {
      subject,
      topics,
      startTime: Date.now(),
      currentTopicIndex: 0,
      breaks: [],
      activeRecallPrompts: this.generateActiveRecallPrompts(topics),
      feynmanExercises: this.generateFeynmanExercises(topics)
    };

    await this.saveSession();
    return this.currentSession;
  }

  generateActiveRecallPrompts(topics) {
    return topics.map(topic => ({
      question: `What are the key points about ${topic.title}?`,
      topic: topic.id,
      type: 'recall'
    }));
  }

  generateFeynmanExercises(topics) {
    return topics.map(topic => ({
      instruction: `Explain ${topic.title} as if you were teaching it to someone who has no prior knowledge.`,
      topic: topic.id,
      type: 'feynman'
    }));
  }

  async takeBreak() {
    if (!this.currentSession) return null;

    const breakStart = Date.now();
    this.currentSession.breaks.push({
      start: breakStart,
      end: breakStart + this.breakDuration
    });

    await this.saveSession();
    return {
      start: breakStart,
      end: breakStart + this.breakDuration,
      activeRecallPrompt: this.getRandomActiveRecallPrompt()
    };
  }

  getRandomActiveRecallPrompt() {
    if (!this.currentSession) return null;
    const prompts = this.currentSession.activeRecallPrompts;
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  async switchTopic() {
    if (!this.currentSession) return null;

    const nextIndex = (this.currentSession.currentTopicIndex + 1) % this.currentSession.topics.length;
    this.currentSession.currentTopicIndex = nextIndex;

    await this.saveSession();
    return this.currentSession.topics[nextIndex];
  }

  async endSession() {
    if (!this.currentSession) return null;

    const session = {
      ...this.currentSession,
      endTime: Date.now()
    };

    await this.saveSession();
    this.currentSession = null;
    return session;
  }

  async saveSession() {
    if (!this.currentSession) return;
    await AsyncStorage.setItem('currentStudySession', JSON.stringify(this.currentSession));
  }

  async loadSession() {
    const session = await AsyncStorage.getItem('currentStudySession');
    if (session) {
      this.currentSession = JSON.parse(session);
    }
    return this.currentSession;
  }

  getCurrentTopic() {
    if (!this.currentSession) return null;
    return this.currentSession.topics[this.currentSession.currentTopicIndex];
  }

  getNextReviewDate(topicId) {
    // Implement logic to get the next review date for a specific topic
    // This would integrate with the spaced repetition system
    return null;
  }
}

export default StudySessionManager; 