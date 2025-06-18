import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';

class VoiceNotesManager {
  constructor() {
    this.notes = [];
    this.recording = null;
    this.sound = null;
  }

  async addNote(content, subject, tags = []) {
    const note = {
      id: Date.now().toString(),
      content,
      subject,
      tags,
      createdAt: Date.now(),
      type: 'voice',
      duration: 0,
    };

    this.notes.push(note);
    await this.saveNotes();
    return note;
  }

  async saveNotes() {
    await AsyncStorage.setItem('voiceNotes', JSON.stringify(this.notes));
  }

  async loadNotes() {
    const notes = await AsyncStorage.getItem('voiceNotes');
    if (notes) {
      this.notes = JSON.parse(notes);
    }
  }

  async deleteNote(noteId) {
    this.notes = this.notes.filter(note => note.id !== noteId);
    await this.saveNotes();
  }

  getNotesBySubject(subject) {
    return this.notes.filter(note => note.subject === subject);
  }

  searchNotes(query) {
    return this.notes.filter(note => 
      note.content.toLowerCase().includes(query.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

const VoiceNotes = ({ subject, onClose }) => {
  const [voiceNotesManager] = useState(new VoiceNotesManager());
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [recording, setRecording] = useState(null);
  const [permission, requestPermission] = Audio.usePermissions();

  useEffect(() => {
    initializeVoiceNotes();
    setupAudio();
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const initializeVoiceNotes = async () => {
    await voiceNotesManager.loadNotes();
    const subjectNotes = voiceNotesManager.getNotesBySubject(subject);
    setNotes(subjectNotes);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  const startRecording = async () => {
    try {
      if (!permission.granted) {
        const permissionResult = await requestPermission();
        if (!permissionResult.granted) {
          Alert.alert('Permission required', 'Microphone permission is required to record voice notes.');
          return;
        }
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setIsListening(true);
      startPulseAnimation();
      
      // Simulate voice recognition (in a real app, you'd integrate with a speech-to-text API)
      setTimeout(() => {
        setTranscribedText('This is a simulated transcription. In a real app, this would be the actual transcribed text from your voice recording.');
        setIsListening(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      setIsRecording(false);
      stopPulseAnimation();
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const saveNote = async () => {
    if (!transcribedText.trim()) {
      Alert.alert('Error', 'Please record some content before saving');
      return;
    }

    await voiceNotesManager.addNote(transcribedText, subject);
    setTranscribedText('');
    initializeVoiceNotes();
    Alert.alert('Success', 'Note saved successfully!');
  };

  const deleteNote = async (noteId) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await voiceNotesManager.deleteNote(noteId);
            initializeVoiceNotes();
          },
        },
      ]
    );
  };

  const searchNotes = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const searchResults = voiceNotesManager.searchNotes(query);
      setNotes(searchResults);
    } else {
      const subjectNotes = voiceNotesManager.getNotesBySubject(subject);
      setNotes(subjectNotes);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Notes</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          value={searchQuery}
          onChangeText={searchNotes}
        />
      </View>

      {/* Recording Section */}
      <View style={styles.recordingSection}>
        <Animated.View
          style={[
            styles.recordButton,
            isRecording && { transform: [{ scale: pulseAnimation }] }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.recordButtonInner,
              isRecording && styles.recordingActive
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <LinearGradient
              colors={isRecording ? ['#FF3B30', '#FF6B6B'] : ['#007AFF', '#5AC8FA']}
              style={styles.recordGradient}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? '⏹️' : '🎤'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        <Text style={styles.recordStatus}>
          {isRecording ? 'Recording...' : 'Tap to start recording'}
        </Text>
        
        {isListening && (
          <Text style={styles.listeningStatus}>Listening and transcribing...</Text>
        )}
      </View>

      {/* Transcribed Text */}
      {transcribedText && (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionLabel}>Transcribed Text:</Text>
          <TextInput
            style={styles.transcriptionInput}
            value={transcribedText}
            onChangeText={setTranscribedText}
            multiline
            placeholder="Edit the transcribed text if needed..."
          />
          <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
            <Text style={styles.saveButtonText}>Save Note</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notes List */}
      <ScrollView style={styles.notesContainer}>
        <Text style={styles.notesTitle}>Your Notes ({notes.length})</Text>
        {notes.map((note) => (
          <View key={note.id} style={styles.noteItem}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteNote(note.id)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.noteContent}>{note.content}</Text>
            {note.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {note.tags.map((tag, index) => (
                  <Text key={index} style={styles.tag}>#{tag}</Text>
                ))}
              </View>
            )}
          </View>
        ))}
        {notes.length === 0 && (
          <Text style={styles.emptyNotes}>No notes yet. Start recording to create your first note!</Text>
        )}
      </ScrollView>

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
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButton: {
    marginBottom: 15,
  },
  recordButtonInner: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  recordingActive: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  recordGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: 30,
    color: '#fff',
  },
  recordStatus: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  listeningStatus: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  transcriptionContainer: {
    marginBottom: 20,
  },
  transcriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  transcriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesContainer: {
    flex: 1,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  noteItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  noteContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 5,
    marginBottom: 5,
  },
  emptyNotes: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
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

export default VoiceNotes; 