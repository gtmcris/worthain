/**
 * CEFR Level Classification Service
 * Implements a Lexicon + Heuristics approach for determining word proficiency levels.
 */

type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Review';

export interface CEFRResult {
  level: CEFRLevel;
  confidence: 'high' | 'medium' | 'low';
  source: 'lexicon' | 'heuristic';
}

// 1. Lexicon Database (Exact Matches)
// In a production app, this would be imported from a massive JSON file.
const cefrLexicon: Record<string, CEFRLevel> = {
  // A1
  'hallo': 'A1', 'ich': 'A1', 'du': 'A1', 'er': 'A1', 'sie': 'A1', 'es': 'A1',
  'wir': 'A1', 'ihr': 'A1', 'sein': 'A1', 'haben': 'A1', 'werden': 'A1',
  'und': 'A1', 'oder': 'A1', 'aber': 'A1', 'ja': 'A1', 'nein': 'A1',
  'hund': 'A1', 'katze': 'A1', 'haus': 'A1', 'auto': 'A1', 'wasser': 'A1',
  'apfel': 'A1', 'brot': 'A1', 'frau': 'A1', 'mann': 'A1', 'kind': 'A1',
  'gut': 'A1', 'schlecht': 'A1', 'groß': 'A1', 'klein': 'A1', 'neu': 'A1',
  
  // A2
  'vielleicht': 'A2', 'immer': 'A2', 'nie': 'A2', 'oft': 'A2', 'manchmal': 'A2',
  'beruf': 'A2', 'urlaub': 'A2', 'krankheit': 'A2', 'termin': 'A2',
  
  // B1
  'erfahrung': 'B1', 'gesellschaft': 'B1', 'entwicklung': 'B1', 'regierung': 'B1',
  'unbedingt': 'B1', 'tatsächlich': 'B1', 'überraschung': 'B1',
  
  // B2
  'leidenschaft': 'B2', 'voraussetzung': 'B2', 'herausforderung': 'B2',
  'zusammenhang': 'B2', 'verantwortung': 'B2',
  
  // C1/C2
  'dementsprechend': 'C1', 'uneingeschränkt': 'C1', 'schlussfolgerung': 'C1',
  'quintessenz': 'C2', 'ubiquitär': 'C2'
};

// 2. Normalization
function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/[^a-zäöüß]/g, '');
}

// 3. Fallback Heuristics
// If a word isn't in our dictionary, we guess based on morphology and length.
function guessLevelByHeuristics(normalized: string): CEFRResult {
  const length = normalized.length;
  
  // Common complex suffixes usually indicating higher-level abstract nouns
  const b2c1Suffixes = ['schaft', 'keit', 'ung', 'heit', 'ismus', 'tät'];
  // Common basic prefixes/suffixes
  const a2b1Affixes = ['chen', 'lein', 'un', 'ver', 'be', 'ge', 'er', 'zer'];

  // Check complex suffixes first
  if (b2c1Suffixes.some(suffix => normalized.endsWith(suffix))) {
    return { level: 'B2', confidence: 'medium', source: 'heuristic' };
  }

  // Check basic affixes
  if (a2b1Affixes.some(affix => normalized.startsWith(affix) || normalized.endsWith(affix))) {
    return { level: 'B1', confidence: 'low', source: 'heuristic' };
  }

  // Length-based weak signals (German words get famously long at higher levels)
  if (length <= 5) return { level: 'A1', confidence: 'low', source: 'heuristic' };
  if (length <= 8) return { level: 'A2', confidence: 'low', source: 'heuristic' };
  if (length <= 12) return { level: 'B1', confidence: 'low', source: 'heuristic' };
  
  // Very long compound words are typically advanced
  return { level: 'C1', confidence: 'low', source: 'heuristic' };
}

// 4. Main Engine
export function determineCEFRLevel(word: string): CEFRResult {
  const normalized = normalizeWord(word);
  
  // 1. Exact Lexicon Match
  if (cefrLexicon[normalized]) {
    return {
      level: cefrLexicon[normalized],
      confidence: 'high',
      source: 'lexicon'
    };
  }
  
  // 2. Fallback Heuristics
  return guessLevelByHeuristics(normalized);
}
