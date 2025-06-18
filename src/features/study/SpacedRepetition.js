class SpacedRepetition {
  constructor() {
    this.defaultEasiness = 2.5;
    this.defaultInterval = 1;
    this.defaultRepetitions = 0;
  }

  calculateNextReview(quality, previousEasiness, previousInterval, previousRepetitions) {
    // SuperMemo-2 Algorithm implementation
    const easiness = this.calculateEasiness(quality, previousEasiness);
    const repetitions = this.calculateRepetitions(quality, previousRepetitions);
    const interval = this.calculateInterval(repetitions, previousInterval, easiness);

    return {
      easiness,
      interval,
      repetitions,
      nextReview: new Date(Date.now() + interval * 24 * 60 * 60 * 1000) // Convert days to milliseconds
    };
  }

  calculateEasiness(quality, previousEasiness) {
    // Easiness factor calculation (EF)
    const newEasiness = previousEasiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    return Math.max(1.3, newEasiness); // Minimum easiness factor is 1.3
  }

  calculateRepetitions(quality, previousRepetitions) {
    // Repetition count calculation
    if (quality < 3) {
      return 0; // Reset repetitions if quality is poor
    }
    return previousRepetitions + 1;
  }

  calculateInterval(repetitions, previousInterval, easiness) {
    // Interval calculation
    if (repetitions === 0) {
      return 1;
    } else if (repetitions === 1) {
      return 6;
    } else {
      return Math.round(previousInterval * easiness);
    }
  }
}

export default SpacedRepetition; 