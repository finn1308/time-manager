export type QuestionType =
  | "FLASHCARD"
  | "EN_TO_VI"
  | "VI_TO_EN"
  | "CONTEXT_IMAGE"
  | "LISTENING_TYPING"
  | "EN_TYPING_VI"
  | "VI_TYPING_EN"
  | "MATCHING";

export interface CardData {
  id: string;
  word: string;
  meaning: string;
  acceptableMeanings: string[];
  phonetic?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  exampleMeaning?: string;
  hint?: string;
  topic?: string;
  imageUrl?: string;
  audioUrl?: string;
  masteryLevel: number;
  correctCount: number;
  incorrectCount: number;
  status: string;
}

export interface MatchingPair {
  id: string;
  en: string;
  vi: string;
}

export interface StudyQuestion {
  id: string;
  cardId: string;
  type: QuestionType;
  prompt: string;
  targetWord: string;
  contextSentence?: string;
  contextTranslation?: string;
  options?: string[]; // 4 options for quiz
  correctAnswer: string;
  acceptableAnswers: string[];
  hint?: string;
  imageUrl?: string;
  phonetic?: string;
  partOfSpeech?: string;
  matchingPairs?: MatchingPair[]; // For matching mode
}

/**
 * Normalizes Vietnamese and English strings for fuzzy comparison:
 * lowercase, removes accents if needed, strips extra whitespace and punctuation.
 */
export function normalizeString(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Extracts acceptable Vietnamese meanings from free-form text.
 * E.g. "cái bàn, bàn / đồ nội thất" -> ["cái bàn", "bàn", "đồ nội thất"]
 */
export function extractAcceptableMeanings(meaningText: string): string[] {
  if (!meaningText) return [];
  // Split on commas, semicolons, slashes, or parentheses
  const firstSection = meaningText.split(/\n|Ví dụ:|Example:/i)[0] || meaningText;
  const parts = firstSection
    .split(/[,;\/\(\)]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("noun") && !s.startsWith("verb") && !s.startsWith("adj"));

  const normalized = Array.from(new Set(parts.map((p) => p.toLowerCase())));
  if (normalized.length === 0) {
    normalized.push(firstSection.trim().toLowerCase());
  }
  return normalized;
}

/**
 * Cleans and standardizes raw flashcard DB records into structured CardData.
 */
export function extractCardData(card: any): CardData {
  let word = card.front || "";
  let phonetic = card.phonetic || "";
  let partOfSpeech = card.partOfSpeech || "";

  // If front contains multiline information (e.g. "Ubiquitous\n/juː.../ (adj)")
  const frontLines = word.split("\n").map((s: string) => s.trim()).filter(Boolean);
  if (frontLines.length > 0) {
    word = frontLines[0];
    if (frontLines.length > 1 && !phonetic) {
      const matchIpa = frontLines[1].match(/\/([^\/]+)\//);
      if (matchIpa) phonetic = `/${matchIpa[1]}/`;
      const matchPos = frontLines[1].match(/\((noun|verb|adj|adv|prep|conj|phrase)\)/i);
      if (matchPos) partOfSpeech = matchPos[1].toLowerCase();
    }
  }

  // Parse meaning and example from back
  let rawBack = card.back || "";
  let exampleSentence = card.exampleSentence || "";
  let exampleMeaning = card.exampleMeaning || "";

  if (!exampleSentence && rawBack.includes("Ví dụ:")) {
    const splitEx = rawBack.split(/Ví dụ:|Example:/i);
    rawBack = splitEx[0].trim();
    if (splitEx[1]) {
      const exLines = splitEx[1].split("\n").map((s: string) => s.trim()).filter(Boolean);
      if (exLines.length > 0) exampleSentence = exLines[0];
      if (exLines.length > 1) exampleMeaning = exLines[1];
    }
  }

  // If example sentence is not yet defined, create a default context for household items
  if (!exampleSentence) {
    if (word.toLowerCase() === "table") {
      exampleSentence = "I put my laptop on the table.";
      exampleMeaning = "Tôi đặt máy tính xách tay của mình trên bàn.";
    } else if (word.toLowerCase() === "chair") {
      exampleSentence = "He sat down on the chair next to the window.";
      exampleMeaning = "Anh ấy ngồi xuống chiếc ghế cạnh cửa sổ.";
    } else if (word.toLowerCase() === "door") {
      exampleSentence = "Please close the door when you leave.";
      exampleMeaning = "Làm ơn đóng cửa khi bạn rời đi.";
    } else if (word.toLowerCase() === "window") {
      exampleSentence = "She opened the window to let fresh air in.";
      exampleMeaning = "Cô ấy mở cửa sổ để đón không khí trong lành.";
    } else if (word.toLowerCase() === "bed") {
      exampleSentence = "After a long day, he fell asleep in his bed.";
      exampleMeaning = "Sau một ngày dài, anh ấy ngủ thiếp đi trên chiếc giường.";
    } else {
      exampleSentence = `The ${word.toLowerCase()} is essential for everyday use.`;
      exampleMeaning = `${rawBack} rất cần thiết cho việc sử dụng hàng ngày.`;
    }
  }

  const acceptableMeanings = extractAcceptableMeanings(rawBack);

  return {
    id: card.id,
    word: word.trim(),
    meaning: rawBack.trim(),
    acceptableMeanings,
    phonetic: phonetic || undefined,
    partOfSpeech: partOfSpeech || undefined,
    exampleSentence,
    exampleMeaning,
    hint: card.hint || undefined,
    topic: card.topic || undefined,
    imageUrl: card.imageUrl || undefined,
    audioUrl: card.audioUrl || undefined,
    masteryLevel: card.masteryLevel || 0,
    correctCount: card.correctCount || 0,
    incorrectCount: card.incorrectCount || 0,
    status: card.status || "NEW",
  };
}

/**
 * Shuffles an array in place (Fisher-Yates)
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Selects 3 distinct distractor options from other cards in the same deck.
 */
function getDistractors(card: CardData, allCards: CardData[], key: "meaning" | "word"): string[] {
  const candidates = allCards
    .filter((c) => c.id !== card.id)
    .map((c) => c[key])
    .filter(Boolean);

  const shuffled = shuffle(Array.from(new Set(candidates)));
  const chosen = shuffled.slice(0, 3);

  // Fallback defaults if deck has fewer than 4 cards
  if (chosen.length < 3) {
    const defaults =
      key === "meaning"
        ? ["cái ghế", "cửa sổ", "đèn học", "cái giường", "gương soi"]
        : ["chair", "window", "desk", "bed", "mirror"];
    for (const d of defaults) {
      if (chosen.length >= 3) break;
      if (d !== card[key] && !chosen.includes(d)) chosen.push(d);
    }
  }

  return chosen.slice(0, 3);
}

// ==============================================================================
// QUESTION GENERATORS
// ==============================================================================

export function createFlashcardQuestion(card: CardData): StudyQuestion {
  return {
    id: `q-fc-${card.id}-${Math.random().toString(36).slice(2, 7)}`,
    cardId: card.id,
    type: "FLASHCARD",
    prompt: "Lật thẻ và tự đánh giá khả năng ghi nhớ",
    targetWord: card.word,
    correctAnswer: card.meaning,
    acceptableAnswers: card.acceptableMeanings,
    contextSentence: card.exampleSentence,
    contextTranslation: card.exampleMeaning,
    hint: card.hint,
    imageUrl: card.imageUrl,
    phonetic: card.phonetic,
    partOfSpeech: card.partOfSpeech,
  };
}

export function createEnToViQuiz(card: CardData, allCards: CardData[]): StudyQuestion {
  const distractors = getDistractors(card, allCards, "meaning");
  const options = shuffle([card.meaning, ...distractors]);

  return {
    id: `q-en2vi-${card.id}-${Math.random().toString(36).slice(2, 7)}`,
    cardId: card.id,
    type: "EN_TO_VI",
    prompt: `What does "${card.word}" mean?`,
    targetWord: card.word,
    options,
    correctAnswer: card.meaning,
    acceptableAnswers: [card.meaning, ...card.acceptableMeanings],
    contextSentence: card.exampleSentence,
    contextTranslation: card.exampleMeaning,
    hint: card.hint,
    phonetic: card.phonetic,
    partOfSpeech: card.partOfSpeech,
    imageUrl: card.imageUrl,
  };
}

export function createViToEnQuiz(card: CardData, allCards: CardData[]): StudyQuestion {
  const distractors = getDistractors(card, allCards, "word");
  const options = shuffle([card.word, ...distractors]);

  return {
    id: `q-vi2en-${card.id}-${Math.random().toString(36).slice(2, 7)}`,
    cardId: card.id,
    type: "VI_TO_EN",
    prompt: `"${card.meaning}" trong tiếng Anh là gì?`,
    targetWord: card.word,
    options,
    correctAnswer: card.word,
    acceptableAnswers: [card.word],
    contextSentence: card.exampleSentence,
    contextTranslation: card.exampleMeaning,
    hint: card.hint,
    phonetic: card.phonetic,
    partOfSpeech: card.partOfSpeech,
    imageUrl: card.imageUrl,
  };
}

export function createContextImageQuestion(card: CardData, allCards: CardData[]): StudyQuestion {
  let blankSentence = "";
  if (card.exampleSentence) {
    const regex = new RegExp(`\\b${card.word}\\b`, "gi");
    blankSentence = card.exampleSentence.replace(regex, "______");
    if (!blankSentence.includes("______")) {
      blankSentence = `${card.exampleSentence.slice(0, 30)} ______`;
    }
  } else {
    blankSentence = "I need to use the ______ right now.";
  }

  const distractors = getDistractors(card, allCards, "word");
  const options = shuffle([card.word, ...distractors]);

  return {
    id: `q-ctx-${card.id}-${Math.random().toString(36).slice(2, 7)}`,
    cardId: card.id,
    type: "CONTEXT_IMAGE",
    prompt: card.imageUrl
      ? "Nhìn ảnh và chọn từ vựng tiếng Anh tương ứng:"
      : "Đọc ngữ cảnh và điền từ thích hợp vào chỗ trống:",
    targetWord: card.word,
    contextSentence: blankSentence,
    contextTranslation: card.exampleMeaning,
    options,
    correctAnswer: card.word,
    acceptableAnswers: [card.word],
    hint: card.hint,
    imageUrl: card.imageUrl,
    phonetic: card.phonetic,
    partOfSpeech: card.partOfSpeech,
  };
}

export function createListeningQuestion(card: CardData): StudyQuestion {
  return {
    id: `q-lis-${card.id}-${Math.random().toString(36).slice(2, 7)}`,
    cardId: card.id,
    type: "LISTENING_TYPING",
    prompt: "Listen and type the word you hear:",
    targetWord: card.word,
    correctAnswer: card.word,
    acceptableAnswers: [card.word],
    contextSentence: card.exampleSentence,
    contextTranslation: card.exampleMeaning,
    hint: card.hint,
    phonetic: card.phonetic,
  };
}

export function createEnTypingViQuestion(card: CardData): StudyQuestion {
  return {
    id: `q-entyp-${card.id}-${Math.random().toString(36).slice(2, 7)}`,
    cardId: card.id,
    type: "EN_TYPING_VI",
    prompt: `Type the Vietnamese meaning of "${card.word}":`,
    targetWord: card.word,
    correctAnswer: card.meaning,
    acceptableAnswers: [card.meaning, ...card.acceptableMeanings],
    contextSentence: card.exampleSentence,
    contextTranslation: card.exampleMeaning,
    hint: card.hint,
    phonetic: card.phonetic,
  };
}

export function createViTypingEnQuestion(card: CardData): StudyQuestion {
  return {
    id: `q-vityp-${card.id}-${Math.random().toString(36).slice(2, 7)}`,
    cardId: card.id,
    type: "VI_TYPING_EN",
    prompt: `Dịch và gõ từ tiếng Anh cho "${card.meaning}":`,
    targetWord: card.word,
    correctAnswer: card.word,
    acceptableAnswers: [card.word],
    contextSentence: card.exampleSentence,
    contextTranslation: card.exampleMeaning,
    hint: card.hint,
    phonetic: card.phonetic,
  };
}

export function createMatchingQuestion(cards: CardData[]): StudyQuestion {
  const chosen = shuffle(cards).slice(0, Math.min(5, cards.length));
  const pairs: MatchingPair[] = chosen.map((c) => ({
    id: c.id,
    en: c.word,
    vi: c.acceptableMeanings[0] || c.meaning.slice(0, 20),
  }));

  return {
    id: `q-match-${Math.random().toString(36).slice(2, 7)}`,
    cardId: chosen[0]?.id || "",
    type: "MATCHING",
    prompt: "Nối các cặp từ tiếng Anh với nghĩa tiếng Việt tương ứng:",
    targetWord: "Matching Game",
    correctAnswer: "MATCH_ALL",
    acceptableAnswers: ["MATCH_ALL"],
    matchingPairs: pairs,
  };
}

// ==============================================================================
// STUDY SESSION QUESTION GENERATOR WITH ANTI-CLUSTERING
// ==============================================================================

export interface SessionConfig {
  mode?: "ALL" | "FLASHCARD" | "QUIZ" | "LISTENING" | "TYPING" | "MATCHING";
  count?: number;
  order?: "RANDOM" | "DEFAULT";
  filterStatus?: "ALL" | "NEW" | "LEARNING" | "MASTERED" | "WEAK";
}

export function generateStudySessionQuestions(
  rawCards: any[],
  config: SessionConfig = {}
): StudyQuestion[] {
  if (!rawCards || rawCards.length === 0) return [];

  let cards: CardData[] = rawCards.map(extractCardData);

  // Filter cards by status if requested
  if (config.filterStatus && config.filterStatus !== "ALL") {
    if (config.filterStatus === "WEAK") {
      cards = cards.filter((c) => c.incorrectCount > 0 || c.masteryLevel < 2);
    } else {
      cards = cards.filter((c) => c.status === config.filterStatus);
    }
  }

  // Fallback to all cards if filter leaves nothing
  if (cards.length === 0) cards = rawCards.map(extractCardData);

  const mode = config.mode || "ALL";
  const questionPool: StudyQuestion[] = [];

  if (mode === "ALL") {
    // Mini language course: cycle each card through diverse modes
    // 1. Flashcard
    // 2. EN -> VI Quiz
    // 3. Listening -> Typing
    // 4. VI -> EN Quiz
    // 5. Context + Image
    // 6. EN -> Typing VI
    // 7. VI -> Typing EN
    const generators = [
      (c: CardData) => createFlashcardQuestion(c),
      (c: CardData) => createEnToViQuiz(c, cards),
      (c: CardData) => createListeningQuestion(c),
      (c: CardData) => createViToEnQuiz(c, cards),
      (c: CardData) => createContextImageQuestion(c, cards),
      (c: CardData) => createEnTypingViQuestion(c),
      (c: CardData) => createViTypingEnQuestion(c),
    ];

    cards.forEach((card, cardIndex) => {
      // Pick 2-3 distinct question types per card to build a well-rounded session
      const offset = cardIndex % generators.length;
      const typeIndices = [offset, (offset + 2) % generators.length, (offset + 4) % generators.length];

      typeIndices.forEach((tIdx) => {
        questionPool.push(generators[tIdx](card));
      });
    });

    // Optionally add a matching question if there are enough cards
    if (cards.length >= 4) {
      questionPool.push(createMatchingQuestion(cards));
    }
  } else if (mode === "FLASHCARD") {
    cards.forEach((c) => questionPool.push(createFlashcardQuestion(c)));
  } else if (mode === "QUIZ") {
    cards.forEach((c) => {
      questionPool.push(createEnToViQuiz(c, cards));
      questionPool.push(createViToEnQuiz(c, cards));
    });
  } else if (mode === "LISTENING") {
    cards.forEach((c) => questionPool.push(createListeningQuestion(c)));
  } else if (mode === "TYPING") {
    cards.forEach((c) => {
      questionPool.push(createEnTypingViQuestion(c));
      questionPool.push(createViTypingEnQuestion(c));
    });
  } else if (mode === "MATCHING") {
    for (let i = 0; i < Math.ceil(cards.length / 4); i++) {
      questionPool.push(createMatchingQuestion(cards));
    }
  }

  // Anti-clustering Shuffle:
  // Prevent the exact same cardId from appearing within 2 consecutive positions,
  // and prevent the same questionType from repeating more than 2 times in a row.
  let pool = shuffle(questionPool);
  const arranged: StudyQuestion[] = [];

  while (pool.length > 0) {
    const last1 = arranged[arranged.length - 1];
    const last2 = arranged[arranged.length - 2];

    const nextIndex = pool.findIndex((candidate) => {
      // Condition 1: not the same card as last1 (if more than 1 distinct card remains)
      const sameCardAsLast = last1 && candidate.cardId && candidate.cardId === last1.cardId;
      // Condition 2: not the same type 3 times in a row
      const sameTypeAsLastTwo =
        last1 && last2 && candidate.type === last1.type && candidate.type === last2.type;

      return !sameCardAsLast && !sameTypeAsLastTwo;
    });

    if (nextIndex !== -1) {
      arranged.push(pool.splice(nextIndex, 1)[0]);
    } else {
      // If no candidate satisfies constraints, pop the first available
      arranged.push(pool.shift()!);
    }
  }

  // Limit count if requested (e.g. 10 questions, 20 questions)
  if (config.count && config.count > 0 && config.count < arranged.length) {
    return arranged.slice(0, config.count);
  }

  return arranged;
}

// ==============================================================================
// ANSWER VALIDATOR
// ==============================================================================

export function validateAnswer(
  question: StudyQuestion,
  userAnswer: string
): { isCorrect: boolean; feedback: string; matchedAnswer?: string } {
  if (question.type === "FLASHCARD") {
    // Handled by user rating (e.g. "KNOW" / "AGAIN")
    const isKnow = userAnswer === "KNOW" || userAnswer === "EASY" || userAnswer === "GOOD";
    return {
      isCorrect: isKnow,
      feedback: isKnow ? "Đã ghi nhớ!" : "Cần ôn tập lại thẻ này.",
    };
  }

  if (question.type === "MATCHING") {
    const isMatchCorrect = userAnswer === "MATCH_ALL" || userAnswer === "SUCCESS";
    return {
      isCorrect: isMatchCorrect,
      feedback: isMatchCorrect ? "Hoàn thành ghép cặp xuất sắc!" : "Chưa chính xác.",
    };
  }

  const normUser = normalizeString(userAnswer);

  if (!normUser) {
    return {
      isCorrect: false,
      feedback: `Chưa nhập câu trả lời. Đáp án đúng là: "${question.correctAnswer}"`,
    };
  }

  // Exact or normalized match against correct answer
  if (normUser === normalizeString(question.correctAnswer)) {
    return {
      isCorrect: true,
      feedback: "Chính xác! Xuất sắc.",
      matchedAnswer: question.correctAnswer,
    };
  }

  // Check acceptable answers (especially for Vietnamese synonyms)
  for (const acc of question.acceptableAnswers) {
    if (normUser === normalizeString(acc)) {
      return {
        isCorrect: true,
        feedback: "Chính xác!",
        matchedAnswer: acc,
      };
    }
  }

  // Fuzzy match for Vietnamese typing: if user input is contained in acceptable meaning
  // or acceptable meaning is contained in user input (e.g. "bàn" vs "cái bàn")
  if (question.type === "EN_TYPING_VI" || question.type === "EN_TO_VI") {
    for (const acc of question.acceptableAnswers) {
      const normAcc = normalizeString(acc);
      if (
        normAcc.length >= 3 &&
        (normUser.includes(normAcc) || normAcc.includes(normUser))
      ) {
        return {
          isCorrect: true,
          feedback: `Chính xác! (${acc})`,
          matchedAnswer: acc,
        };
      }
    }
  }

  return {
    isCorrect: false,
    feedback: `Chưa đúng. Đáp án chính xác là: "${question.correctAnswer}"`,
  };
}
