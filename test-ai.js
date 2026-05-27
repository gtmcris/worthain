import * as dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: `Suggest a random, highly useful German vocabulary word for a learner (A2 to B2 level). Do not use extremely basic words like "Hallo". Provide detailed vocabulary information, including English translations and context.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
                plural: { type: Type.STRING }
              }
            },
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  de: { type: Type.STRING },
                  en: { type: Type.STRING }
                },
                required: ["de", "en"]
              }
            },
            frequency: { type: Type.NUMBER },
            frequencyContext: { type: Type.STRING },
            relatedWords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  translation: { type: Type.STRING }
                }
              }
            },
            similarWords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            wordFamily: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  translation: { type: Type.STRING }
                }
              }
            }
          },
          required: ["term", "translation", "meaning", "level", "grammar", "examples", "frequency"]
        }
      }
    });

    console.log(response.text);
  } catch (error) {
    console.error("ERROR:");
    console.error(error.message);
  }
}

run();
