import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

class FlashcardManager {
  constructor() {
    this.cards = [];
    this.currentIndex = 0;
    this.reviewQueue = [];
  }

  async addCard(front, back, subject, tags = []) {
    const card = {
      id: Date.now().toString(),
      front,
      back,
      subject,
      tags,
      createdAt: Date.now(),
      lastReviewed: null,
      nextReview: Date.now(),
      interval: 1, // days
      easeFactor: 2.5,
      reviewCount: 0,
      consecutiveCorrect: 0,
    };

    this.cards.push(card);
    await this.saveCards();
    return card;
  }

  async getCardsForReview() {
    const now = Date.now();
    return this.cards.filter(card => card.nextReview <= now);
  }

  async reviewCard(cardId, quality) {
    const card = this.cards.find(c => c.id === cardId);
    if (!card) return;

    card.lastReviewed = Date.now();
    card.reviewCount++;

    // SuperMemo 2 algorithm
    if (quality >= 3) {
      card.consecutiveCorrect++;
      card.interval = card.interval * card.easeFactor;
    } else {
      card.consecutiveCorrect = 0;
      card.interval = Math.max(1, card.interval * 0.5);
    }

    // Update ease factor
    card.easeFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    // Calculate next review
    const daysToAdd = Math.round(card.interval);
    card.nextReview = Date.now() + (daysToAdd * 24 * 60 * 60 * 1000);

    await this.saveCards();
  }

  async saveCards() {
    await AsyncStorage.setItem('flashcards', JSON.stringify(this.cards));
  }

  async loadCards() {
    const cards = await AsyncStorage.getItem('flashcards');
    if (cards) {
      this.cards = JSON.parse(cards);
    }
  }
}

const FlashcardSystem = ({ subject, onClose }) => {
  const [flashcardManager] = useState(new FlashcardManager());
  const [currentCard, setCurrentCard] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewCards, setReviewCards] = useState([]);
  const [flipAnimation] = useState(new Animated.Value(0));
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({ front: '', back: '' });

  useEffect(() => {
    initializeFlashcards();
  }, []);

  const initializeFlashcards = async () => {
    await flashcardManager.loadCards();
    const cardsForReview = await flashcardManager.getCardsForReview();
    setReviewCards(cardsForReview);
    if (cardsForReview.length > 0) {
      setCurrentCard(cardsForReview[0]);
    }
  };

  const flipCard = () => {
    const toValue = showAnswer ? 0 : 1;
    Animated.spring(flipAnimation, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setShowAnswer(!showAnswer);
  };

  const handleReview = async (quality) => {
    if (!currentCard) return;

    await flashcardManager.reviewCard(currentCard.id, quality);
    
    const currentIndex = reviewCards.findIndex(card => card.id === currentCard.id);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < reviewCards.length) {
      setCurrentCard(reviewCards[nextIndex]);
    } else {
      // All cards reviewed
      setCurrentCard(null);
      setReviewCards([]);
    }
    
    setShowAnswer(false);
    flipAnimation.setValue(0);
  };

  const addNewCard = async () => {
    if (!newCard.front.trim() || !newCard.back.trim()) {
      Alert.alert('Error', 'Please fill in both front and back of the card');
      return;
    }

    await flashcardManager.addCard(newCard.front, newCard.back, subject);
    setNewCard({ front: '', back: '' });
    setIsAddingCard(false);
    initializeFlashcards();
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  if (isAddingCard) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Add New Flashcard</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Front (Question):</Text>
          <TextInput
            style={styles.input}
            value={newCard.front}
            onChangeText={(text) => setNewCard({ ...newCard, front: text })}
            placeholder="Enter question or prompt"
            multiline
          />
          <Text style={styles.label}>Back (Answer):</Text>
          <TextInput
            style={styles.input}
            value={newCard.back}
            onChangeText={(text) => setNewCard({ ...newCard, back: text })}
            placeholder="Enter answer or explanation"
            multiline
          />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={addNewCard}>
            <Text style={styles.buttonText}>Save Card</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={() => setIsAddingCard(false)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentCard && reviewCards.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Flashcards</Text>
        <Text style={styles.subtitle}>No cards to review!</Text>
        <TouchableOpacity style={styles.button} onPress={() => setIsAddingCard(true)}>
          <Text style={styles.buttonText}>Add New Card</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flashcard Review</Text>
      <Text style={styles.progress}>
        {reviewCards.findIndex(card => card.id === currentCard?.id) + 1} / {reviewCards.length}
      </Text>

      <TouchableOpacity style={styles.cardContainer} onPress={flipCard}>
        <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.cardGradient}
          >
            <Text style={styles.cardText}>{currentCard?.front}</Text>
            <Text style={styles.cardHint}>Tap to reveal answer</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            style={styles.cardGradient}
          >
            <Text style={styles.cardText}>{currentCard?.back}</Text>
            <Text style={styles.cardHint}>Tap to see question</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {showAnswer && (
        <View style={styles.reviewContainer}>
          <Text style={styles.reviewTitle}>How well did you know this?</Text>
          <View style={styles.qualityButtons}>
            <TouchableOpacity 
              style={[styles.qualityButton, styles.againButton]} 
              onPress={() => handleReview(1)}
            >
              <Text style={styles.qualityButtonText}>Again</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.qualityButton, styles.hardButton]} 
              onPress={() => handleReview(2)}
            >
              <Text style={styles.qualityButtonText}>Hard</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.qualityButton, styles.goodButton]} 
              onPress={() => handleReview(3)}
            >
              <Text style={styles.qualityButtonText}>Good</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.qualityButton, styles.easyButton]} 
              onPress={() => handleReview(4)}
            >
              <Text style={styles.qualityButtonText}>Easy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setIsAddingCard(true)}>
        <Text style={styles.addButtonText}>+ Add Card</Text>
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  progress: {
    fontSize: 16,
    textAlign: 'center',
    color: '#007AFF',
    marginBottom: 20,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width - 80,
    height: 300,
    borderRadius: 20,
    position: 'absolute',
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#667eea',
  },
  cardBack: {
    backgroundColor: '#f093fb',
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  cardHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  reviewContainer: {
    marginTop: 20,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  qualityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  qualityButton: {
    padding: 15,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  againButton: {
    backgroundColor: '#FF3B30',
  },
  hardButton: {
    backgroundColor: '#FF9500',
  },
  goodButton: {
    backgroundColor: '#34C759',
  },
  easyButton: {
    backgroundColor: '#007AFF',
  },
  qualityButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  closeButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FlashcardSystem; 