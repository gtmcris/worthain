import { GoogleGenAI, Type } from "@google/genai";

// vite.config.ts explicitly exposes process.env.GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface WordDetails {
  term: string;
  translation: string;
  meaning: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  grammar: {
    genus?: 'maskulin' | 'feminin' | 'neutrum';
    type?: string;
    plural?: string;
  };
  examples: { de: string; en: string }[];
  frequency: number;
  frequencyContext?: string;
  relatedWords: { term: string; translation: string }[];
  similarWords: string[];
  wordFamily: { term: string; translation: string }[];
}

// ─── Shared schema for WordDetails ───────────────────────────────────────────
const wordDetailsSchema = {
  type: Type.OBJECT,
  properties: {
    term: { type: Type.STRING },
    translation: { type: Type.STRING },
    meaning: { type: Type.STRING },
    level: { type: Type.STRING, enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
    grammar: {
      type: Type.OBJECT,
      properties: {
        genus: { type: Type.STRING, enum: ["maskulin", "feminin", "neutrum"] },
        type: { type: Type.STRING },
        plural: { type: Type.STRING },
      },
    },
    examples: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          de: { type: Type.STRING },
          en: { type: Type.STRING },
        },
        required: ["de", "en"],
      },
    },
    frequency: { type: Type.NUMBER },
    frequencyContext: { type: Type.STRING },
    relatedWords: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          translation: { type: Type.STRING },
        },
      },
    },
    similarWords: { type: Type.ARRAY, items: { type: Type.STRING } },
    wordFamily: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          translation: { type: Type.STRING },
        },
      },
    },
  },
  required: ["term", "translation", "meaning", "level", "grammar", "examples", "frequency"],
};

// ─── Word Lookup ─────────────────────────────────────────────────────────────
export async function fetchWordDetails(word: string): Promise<WordDetails> {
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: `Find detailed vocabulary information for the German word: "${word}". Provide English translations and context.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: wordDetailsSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from API');
    return JSON.parse(text);
  } catch (e: any) {
    console.warn('API Error, using fallback word details for', word, ':', e.message);
    return {
      term: word,
      translation: "(Mock Translation)",
      meaning: "Fallback meaning provided due to API rate limit/quota error.",
      level: "A1",
      grammar: { genus: "maskulin" },
      examples: [{ de: `Das ist ein ${word}.`, en: `This is a ${word}.` }],
      frequency: 5,
      relatedWords: [],
      similarWords: [],
      wordFamily: []
    };
  }
}

// ─── AI Exercise ─────────────────────────────────────────────────────────────
export interface Exercise {
  type: 'fill_blank' | 'translate' | 'multiple_choice';
  question: string;
  correctAnswer: string;
  options?: string[];
  hint?: string;
}

export async function generateExercise(
  term: string,
  translation: string,
  level: string
): Promise<Exercise> {
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set');

  const exerciseTypes: Exercise['type'][] = ['fill_blank', 'translate', 'multiple_choice'];
  const chosenType = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];

  const prompts: Record<string, string> = {
    fill_blank: `Create a fill-in-the-blank German sentence exercise for the word "${term}" (meaning: "${translation}", level: ${level}). The blank should replace "${term}" in a natural sentence. Give a short English hint.`,
    translate: `Create a translation exercise for the German word "${term}" (meaning: "${translation}", level: ${level}). Provide a short German sentence using "${term}" and its correct English translation.`,
    multiple_choice: `Create a multiple-choice exercise asking what "${term}" means in English (level: ${level}). Provide exactly 4 options where only one is correct ("${translation}"). Make the wrong options plausible German-adjacent words.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompts[chosenType],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["fill_blank", "translate", "multiple_choice"] },
            question: { type: Type.STRING },
            correctAnswer: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            hint: { type: Type.STRING },
          },
          required: ["type", "question", "correctAnswer"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty response');
    const parsed = JSON.parse(text);
    return { ...parsed, type: chosenType };
  } catch (e: any) {
    console.warn('API Error, using fallback exercise data for', term, ':', e.message);
    if (chosenType === 'fill_blank') {
      return { type: 'fill_blank', question: `Ich lerne das Wort _____.`, correctAnswer: term, hint: `Means: ${translation}` };
    } else if (chosenType === 'translate') {
      return { type: 'translate', question: `Translate: Das ist ein ${term}.`, correctAnswer: `This is a ${translation}.` };
    } else {
      return { type: 'multiple_choice', question: `What does "${term}" mean?`, correctAnswer: translation, options: [translation, 'wrong option 1', 'wrong option 2', 'wrong option 3'] };
    }
  }
}

// ─── Word Suggestion ─────────────────────────────────────────────────────────
export async function suggestRandomWord(): Promise<WordDetails> {
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set');

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: `Suggest a random, highly useful German vocabulary word for a learner at A2–B2 level. Do NOT use extremely basic words like "Hallo" or "danke". Provide complete vocabulary information with English translations and 2 example sentences.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: wordDetailsSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from API');
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse response:', text, e);
    throw new Error('Invalid dictionary data received');
  }
}
