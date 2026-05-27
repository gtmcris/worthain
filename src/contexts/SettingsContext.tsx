import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'de' | 'en';

interface SettingsContextType {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  de: {
    // Navigation
    'nav.dashboard': 'START',
    'nav.search': 'FINDER',
    'nav.practice': 'CARDS',
    'nav.stats': 'STATS',
    'nav.profile': 'PROFIL',

    // Profile
    'profile.title': 'Herzlich Willkommen',
    'profile.vocab': 'Mein Vokabular',
    'profile.learning': 'Zu lernende Wörter',
    'profile.favorites': 'Favoriten',
    'profile.notes': 'Notizen',
    'profile.settings': 'Einstellungen',
    'profile.darkmode': 'Dark Mode',
    'profile.language': 'App Sprache',
    'profile.sync': 'Geräte & Synchronisation',
    'profile.support': 'Hilfe & Support',
    'profile.logout': 'Abmelden',
    'profile.words': 'Wörter',
    'profile.active': 'Aktiviert',
    'profile.inactive': 'Deaktiviert',

    // Dashboard
    'dash.welcome': 'Herzlich Willkommen',
    'dash.hello': 'Hallo',
    'dash.subtitle': 'Bereit für deine tägliche Dosis Wissen?',
    'dash.today': 'Heutiges Ziel',
    'dash.vocab': 'Vokabeln',
    'dash.saved': 'Gespeichert',
    'dash.tolearn': 'Zu lernen',
    'dash.streak': 'Serien',
    'dash.days': 'Tage',
    'dash.correct': 'Richtige Antworten',
    'dash.last7': 'Letzte 7 Tage',
    'dash.focus': 'Fokus-Bereiche',
    'dash.verbs': 'Verben',
    'dash.nouns': 'Nomen',
    'dash.adjs': 'Adjektive',

    // Search
    'search.placeholder': 'Deutsch oder Englisch suchen...',
    'search.subtitle': 'Vault durchsuchen oder neues Wort hinzufügen',
    'search.history': 'Suchverlauf',
    'search.clear': 'Leeren',
    'search.online_lookup': 'Tippe Enter, um online nachzuschlagen',
    'search.save_vault': 'In Vault speichern',
    'search.delete_confirm': 'Wort löschen?',
    'search.level': 'Niv.',
    'search.favorite': 'Favorit',
    'search.mastered': 'Gelernt',
    'search.empty': 'Dein Vault ist leer',
    'search.empty_sub': 'Suche nach einem Wort oben, um loszulegen.',
    'search.all': 'Alle',
    'search.verbs': 'Verben',
    'search.nouns': 'Nomen',
    'search.adjs': 'Adjektive',
    'search.saving': 'Speichern...',
    'search.ai_error': 'Das tägliche Suchlimit wurde erreicht.',
    'search.ai_error2': 'Konnte kein Wort finden.',
    'search.tab_all': 'Alle',
    'search.tab_learning': 'Zu lernen',
    'search.tab_mastered': 'Gelernt',
    'search.tab_favorites': 'Favoriten',
    'search.results': 'Ergebnisse',
    'search.all_vocab': 'Alle Vokabeln',
    'search.not_in_vault': 'nicht in deinem Vault',
    'search.translate_prompt': 'Übersetzen und zu deinem Vault hinzufügen?',
    'search.translate_btn': 'Übersetzen',
    'search.translating': 'Übersetze',
    'search.no_translation': 'Übersetzung nicht gefunden',
    'search.no_translation_detail': 'Keine Übersetzung gefunden. Überprüfe die Schreibweise oder versuche ein anderes Wort.',
    'search.network_error': 'Übersetzung fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.',
    'search.add_tip': 'Tipp: Du kannst das Wort auch manuell über "Add Word" hinzufügen.',
    'search.direction_de_en': 'Deutsch → Englisch',
    'search.direction_en_de': 'Englisch → Deutsch',
    'search.add_word': 'Wort hinzufügen',
    'search.word': 'Wort',
    'search.translation': 'Übersetzung',
    'search.meaning': 'Bedeutung',
    'search.level_input': 'Niveau (A1, A2…)',
    'search.grammar_type': 'Wortart',
    'search.genus': 'Genus (optional)',
    'search.add_btn': 'Hinzufügen',
    'search.cancel': 'Abbrechen',
    'search.full_details': 'Volle Details anzeigen',
    'search.delete_word': 'Wort löschen?',

    // Flashcards
    'cards.session': 'Training Session',
    'cards.empty': 'Keine Karten zum Üben',
    'cards.empty_sub': 'Speichere zuerst ein paar Vokabeln, um mit dem Training zu beginnen.',
    'cards.find': 'Vokabeln suchen',
    'cards.generate': 'Neues Wort generieren',
    'cards.german': 'German Word',
    'cards.translation': 'Translation',
    'cards.tap': 'Tap to flip',
    'cards.again': 'Again',
    'cards.mastered': 'Mastered',
    'cards.ai_title': 'AI Suggestion',
    'cards.generating': 'Generiere ein neues Wort...',
    'cards.save': 'In Vault speichern',
    'cards.exercise': 'Übung',
    'cards.check': 'Prüfen',
    'cards.correct': 'Richtig!',
    'cards.wrong': 'Leider falsch',
    'cards.next': 'Weiter',
    'cards.skip': 'Überspringen',
    'cards.hint': 'Hinweis',
    'cards.your_answer': 'Deine Antwort...',

    // Stats
    'stats.title': 'Statistiken',
    'stats.learned': 'Gelernt',
    'stats.practiced': 'Geübt',
    'stats.correct': 'Richtig',
    'stats.by_level': 'Nach Niveau',
    'stats.by_level_sub': 'Deine Vokabeln nach CEFR-Niveau',
    'stats.progress': 'Fortschritt',
    'stats.progress_sub': 'Wörter über die Zeit',
    'stats.words': 'Wörter',
    'stats.total': 'Gesamt',
    'stats.no_data': 'Noch keine Daten',
    'stats.no_data_sub': 'Füge Vokabeln hinzu und übe, um Statistiken zu sehen.',

    // Dashboard
    'dash.wotd': 'Wort des Tages',
    'dash.wotd_add': 'Hinzufügen',
    'dash.wotd_refresh': 'Neues Wort',

    // Word Details
    'word.overview': 'Übersicht',
    'word.grammar': 'Grammatik',
    'word.examples': 'Beispiele',
    'word.lingo': 'Linguistic Data',
    'word.freq': 'Frequency Matrix',
    'word.usecases': 'Example Use Cases',
    'word.learning': 'Learning Notes',
    'word.delete': 'Wort löschen',
    'word.no_examples': 'Keine Beispielsätze verfügbar.',
    'word.definition': 'Definition'
  },
  en: {
    // Navigation
    'nav.dashboard': 'HOME',
    'nav.search': 'SEARCH',
    'nav.practice': 'CARDS',
    'nav.stats': 'STATS',
    'nav.profile': 'PROFILE',

    // Profile
    'profile.title': 'Welcome',
    'profile.vocab': 'My Vocabulary',
    'profile.learning': 'Words to Learn',
    'profile.favorites': 'Favorites',
    'profile.notes': 'Notes',
    'profile.settings': 'Settings',
    'profile.darkmode': 'Dark Mode',
    'profile.language': 'App Language',
    'profile.sync': 'Devices & Sync',
    'profile.support': 'Help & Support',
    'profile.logout': 'Logout',
    'profile.words': 'Words',
    'profile.active': 'Enabled',
    'profile.inactive': 'Disabled',

    // Dashboard
    'dash.welcome': 'Welcome Back',
    'dash.hello': 'Hello',
    'dash.subtitle': 'Ready for your daily dose of knowledge?',
    'dash.today': 'Daily Goal',
    'dash.vocab': 'Vocabulary',
    'dash.saved': 'Saved',
    'dash.tolearn': 'To Learn',
    'dash.streak': 'Streak',
    'dash.days': 'Days',
    'dash.correct': 'Correct Answers',
    'dash.last7': 'Last 7 Days',
    'dash.focus': 'Focus Areas',
    'dash.verbs': 'Verbs',
    'dash.nouns': 'Nouns',
    'dash.adjs': 'Adjectives',

    // Search
    'search.placeholder': 'Search German or English...',
    'search.subtitle': 'Search your vault or add a new word',
    'search.history': 'Search History',
    'search.clear': 'Clear',
    'search.online_lookup': 'Press Enter to look up online',
    'search.save_vault': 'Save to Vault',
    'search.delete_confirm': 'Delete word?',
    'search.level': 'Lvl',
    'search.favorite': 'Favorite',
    'search.mastered': 'Mastered',
    'search.empty': 'Your Vault is empty',
    'search.empty_sub': 'Search for a word above to get started.',
    'search.all': 'All',
    'search.verbs': 'Verbs',
    'search.nouns': 'Nouns',
    'search.adjs': 'Adjectives',
    'search.saving': 'Saving...',
    'search.ai_error': 'Daily search limit reached.',
    'search.ai_error2': 'Could not find word.',
    'search.tab_all': 'All',
    'search.tab_learning': 'Learning',
    'search.tab_mastered': 'Mastered',
    'search.tab_favorites': 'Favorites',
    'search.results': 'Results',
    'search.all_vocab': 'All Vocabulary',
    'search.not_in_vault': 'not in your Vault',
    'search.translate_prompt': 'Translate and add to your Vault?',
    'search.translate_btn': 'Translate',
    'search.translating': 'Translating',
    'search.no_translation': 'Translation not found',
    'search.no_translation_detail': 'No translation found. Check the spelling or try a different word.',
    'search.network_error': 'Translation failed. Please check your internet connection and try again.',
    'search.add_tip': 'Tip: You can also add the word manually via "Add Word".',
    'search.direction_de_en': 'German → English',
    'search.direction_en_de': 'English → German',
    'search.add_word': 'Add Word',
    'search.word': 'Word',
    'search.translation': 'Translation',
    'search.meaning': 'Meaning',
    'search.level_input': 'Level (A1, A2…)',
    'search.grammar_type': 'Word type',
    'search.genus': 'Genus (optional)',
    'search.add_btn': 'Add',
    'search.cancel': 'Cancel',
    'search.full_details': 'View Full Details',
    'search.delete_word': 'Delete word?',

    // Flashcards
    'cards.session': 'Training Session',
    'cards.empty': 'No cards to practice',
    'cards.empty_sub': 'Save some vocabulary first to start training.',
    'cards.find': 'Find Vocabulary',
    'cards.generate': 'Generate New Word',
    'cards.german': 'German Word',
    'cards.translation': 'Translation',
    'cards.tap': 'Tap to flip',
    'cards.again': 'Again',
    'cards.mastered': 'Mastered',
    'cards.ai_title': 'AI Suggestion',
    'cards.generating': 'Generating a new word...',
    'cards.save': 'Save to Vault',
    'cards.exercise': 'Exercise',
    'cards.check': 'Check',
    'cards.correct': 'Correct!',
    'cards.wrong': 'Not quite',
    'cards.next': 'Next',
    'cards.skip': 'Skip',
    'cards.hint': 'Hint',
    'cards.your_answer': 'Your answer...',

    // Stats
    'stats.title': 'Statistics',
    'stats.learned': 'Learned',
    'stats.practiced': 'Practiced',
    'stats.correct': 'Correct',
    'stats.by_level': 'By Level',
    'stats.by_level_sub': 'Your vocabulary by CEFR level',
    'stats.progress': 'Progress',
    'stats.progress_sub': 'Words over time',
    'stats.words': 'Words',
    'stats.total': 'Total',
    'stats.no_data': 'No data yet',
    'stats.no_data_sub': 'Add vocabulary and practice to see statistics.',

    // Dashboard
    'dash.wotd': 'Word of the Day',
    'dash.wotd_add': 'Add',
    'dash.wotd_refresh': 'New Word',

    // Word Details
    'word.overview': 'Overview',
    'word.grammar': 'Grammar',
    'word.examples': 'Examples',
    'word.lingo': 'Linguistic Data',
    'word.freq': 'Frequency Matrix',
    'word.usecases': 'Example Use Cases',
    'word.learning': 'Learning Notes',
    'word.delete': 'Delete Word',
    'word.no_examples': 'No example sentences available.',
    'word.definition': 'Definition'
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'de';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ isDarkMode, setIsDarkMode, language, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
