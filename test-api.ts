// Quick test to verify the Gemini API key works
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key present:', !!apiKey);
console.log('API Key starts with:', apiKey?.substring(0, 10) + '...');

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

async function test() {
  try {
    console.log('\n--- Testing gemini-2.0-flash-lite ---');
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: 'Say hello in German. Reply with just the word.',
    });
    console.log('SUCCESS:', response.text);
  } catch (err: any) {
    console.error('FAILED:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2));
  }

  try {
    console.log('\n--- Testing gemini-2.0-flash ---');
    const response2 = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Say hello in German. Reply with just the word.',
    });
    console.log('SUCCESS:', response2.text);
  } catch (err: any) {
    console.error('FAILED:', err.message);
  }
}

test();
