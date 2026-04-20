export type CardProgressState = {
  easeFactor: number;
  interval: number;
  repetitions: number;
};

export function calculateNextReview(
  state: CardProgressState,
  quality: number
): CardProgressState & { dueDate: Date; status: string } {
  let { easeFactor, interval, repetitions } = state;

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else if (quality === 3) {
    interval = 1;
  } else if (quality === 4 || quality === 5) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    if (quality === 5) {
      interval = Math.round(interval * 1.3);
    }
    repetitions += 1;
  }

  let status = "new";
  if (repetitions >= 5 && interval >= 21) {
    status = "mastered";
  } else if (repetitions > 0) {
    status = "learning";
  }

  const dueDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

  return { easeFactor, interval, repetitions, dueDate, status };
}
