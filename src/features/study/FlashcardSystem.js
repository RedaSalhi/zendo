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
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();
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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Add New Flashcard</Text>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Front (Question):</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.border
            }]}
            value={newCard.front}
            onChangeText={(text) => setNewCard({ ...newCard, front: text })}
            placeholder="Enter question or prompt"
            placeholderTextColor={theme.textSecondary}
            multiline
          />
          <Text style={[styles.label, { color: theme.text }]}>Back (Answer):</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.border
            }]}
            value={newCard.back}
            onChangeText={(text) => setNewCard({ ...newCard, back: text })}
            placeholder="Enter answer or explanation"
            placeholderTextColor={theme.textSecondary}
            multiline
          />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]} 
            onPress={addNewCard}
          >
            <Text style={styles.buttonText}>Save Card</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.surface }]} 
            onPress={() => setIsAddingCard(false)}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentCard) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Flashcards</Text>
        {reviewCards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No cards due for review.
            </Text>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => setIsAddingCard(true)}
            >
              <Text style={styles.buttonText}>Create New Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading cards...
          </Text>
        )}
        <TouchableOpacity 
          style={[styles.closeButton, { backgroundColor: theme.surface }]}
          onPress={onClose}
        >
          <Text style={[styles.closeButtonText, { color: theme.text }]}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Flashcards</Text>
      <View style={styles.cardContainer}>
        <Animated.View 
          style={[
            styles.card,
            frontAnimatedStyle,
            { backgroundColor: theme.surface }
          ]}
        >
          <Text style={[styles.cardText, { color: theme.text }]}>{currentCard.front}</Text>
        </Animated.View>
        <Animated.View 
          style={[
            styles.card,
            styles.cardBack,
            backAnimatedStyle,
            { backgroundColor: theme.surface }
          ]}
        >
          <Text style={[styles.cardText, { color: theme.text }]}>{currentCard.back}</Text>
        </Animated.View>
      </View>

      <TouchableOpacity 
        style={[styles.flipButton, { backgroundColor: theme.primary }]}
        onPress={flipCard}
      >
        <Text style={styles.buttonText}>Flip Card</Text>
      </TouchableOpacity>

      {showAnswer && (
        <View style={styles.ratingContainer}>
          <TouchableOpacity 
            style={[styles.ratingButton, { backgroundColor: theme.error }]}
            onPress={() => handleReview(1)}
          >
            <Text style={styles.buttonText}>Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.ratingButton, { backgroundColor: theme.warning }]}
            onPress={() => handleReview(3)}
          >
            <Text style={styles.buttonText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.ratingButton, { backgroundColor: theme.success }]}
            onPress={() => handleReview(5)}
          >
            <Text style={styles.buttonText}>Easy</Text>
          </TouchableOpacity>
        </View>
      )}

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
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  card: {
    width: width - 40,
    height: 200,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    transform: [{ rotateY: '180deg' }],
  },
  cardText: {
    fontSize: 18,
    textAlign: 'center',
  },
  flipButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  ratingButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '30%',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    flex: 1,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.48,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default FlashcardSystem; 