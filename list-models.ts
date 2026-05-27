import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

async function listModels() {
  try {
    // There isn't a direct listModels in the simple SDK usually, 
    // but let's try to just test gemini-1.5-flash with the right name.
    const model = 'gemini-1.5-flash';
    console.log(`Testing ${model}...`);
    const response = await ai.models.generateContent({
      model: model,
      contents: 'Say hi',
    });
    console.log('SUCCESS:', response.text);
  } catch (err: any) {
    console.error('FAILED:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2));
  }
}

listModels();
