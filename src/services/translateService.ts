/**
 * Free Google Translate service using the public translate API.
 * Supports bidirectional translation: German ↔ English.
 * No API key required for basic translations.
 */

export interface TranslateResult {
  term: string;
  translation: string;
  detectedLanguage?: string;
  direction: 'de-en' | 'en-de';
}

/**
 * Auto-detect translation direction based on Google's language detection.
 * If the input is detected as English → translate to German.
 * If the input is detected as German (or unknown) → translate to English.
 */
export async function translateWord(term: string): Promise<TranslateResult> {
  const trimmed = term.trim();

  // Basic input validation — must contain actual letters
  if (!/[a-zA-ZäöüÄÖÜß]{2,}/.test(trimmed)) {
    throw new Error('No translation found');
  }

  // Step 1: Use auto-detect (sl=auto) to figure out the language first
  const detectUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`;
  const detectResponse = await fetch(detectUrl);
  if (!detectResponse.ok) {
    throw new Error('Translation failed');
  }

  const detectData = await detectResponse.json();
  const detectedLang: string = detectData[2] || '';

  // Step 2: Determine direction and translate accordingly
  let sourceLang: string;
  let targetLang: string;
  let direction: 'de-en' | 'en-de';

  if (detectedLang === 'en') {
    // English input → translate to German
    sourceLang = 'en';
    targetLang = 'de';
    direction = 'en-de';
  } else if (detectedLang === 'de' || detectedLang === '') {
    // German input (or unknown) → translate to English
    sourceLang = 'de';
    targetLang = 'en';
    direction = 'de-en';
  } else {
    // Not English or German → reject
    throw new Error('No translation found');
  }

  // Step 3: Get the actual translation in the correct direction
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Translation failed');
  }

  const data = await response.json();

  // Parse translation segments
  const translatedParts: string[] = [];
  if (Array.isArray(data[0])) {
    for (const segment of data[0]) {
      if (segment[0]) {
        translatedParts.push(segment[0]);
      }
    }
  }

  const translation = translatedParts.join('').trim();
  if (!translation) {
    throw new Error('No translation found');
  }

  // Validate: if the "translation" is identical to the input, Google didn't recognise it
  const normalise = (s: string) => s.toLowerCase().replace(/[^a-zäöüß]/g, '');
  if (normalise(trimmed) === normalise(translation)) {
    throw new Error('No translation found');
  }

  return {
    term: trimmed,
    translation,
    detectedLanguage: detectedLang || 'de',
    direction,
  };
}
