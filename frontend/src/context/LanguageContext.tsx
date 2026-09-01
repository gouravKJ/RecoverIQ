'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'hinglish';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  badge: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    badge: 'EN',
    flag: '🇺🇸',
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    badge: 'HI',
    flag: '🇮🇳',
  },
  {
    code: 'hinglish',
    label: 'Hinglish',
    nativeLabel: 'Hinglish (Hindi+EN)',
    badge: 'HI-EN',
    flag: '🇮🇳',
  },
];

export interface Translations {
  navDashboard: string;
  navTransactions: string;
  navDecisions: string;
  navPolicy: string;
  navAudit: string;
  navTitle: string;
  searchPlaceholder: string;
  loadBatch: string;
  loadingBatch: string;
  runEngine: string;
  runningEngine: string;
  demoMode: string;
  aiAgentTitle: string;
  aiAgentSubtitle: string;
  subBrand: string;
  copilotTitle: string;
  copilotLauncher: string;
  copilotSub: string;
  copilotPlaceholder: string;
  copilotWelcome: string;
  copilotWelcomeSub: string;
  suggestedPrompts: string;
  languageLabel: string;
  selectLanguage: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    navDashboard: 'Dashboard',
    navTransactions: 'Transactions',
    navDecisions: 'Recovery Decisions',
    navPolicy: 'Policy Center',
    navAudit: 'Audit Trail',
    navTitle: 'Console Navigation',
    searchPlaceholder: 'Search Transaction ID or Customer...',
    loadBatch: 'Load Batch',
    loadingBatch: 'Loading...',
    runEngine: 'Run Recovery Engine',
    runningEngine: 'Running Pipeline...',
    demoMode: 'SIMULATED DEMO',
    aiAgentTitle: 'AI Decision Agent',
    aiAgentSubtitle: 'EV Model + Constitution Active',
    subBrand: 'Autonomous Revenue Recovery',
    copilotTitle: 'RecoverIQ AI Operations Copilot',
    copilotLauncher: 'RecoverIQ Copilot',
    copilotSub: 'Ask anything · Voice · Hinglish · AI Explains. RecoverIQ Decides.',
    copilotPlaceholder: 'Ask RecoverIQ anything (English / Hinglish)...',
    copilotWelcome: 'Welcome to RecoverIQ Operations Copilot',
    copilotWelcomeSub: 'Ask me about transaction failure reasons, Expected Value decisions, PolicyGate blocks, or revenue leakage.',
    suggestedPrompts: 'Suggested Prompts:',
    languageLabel: 'Language',
    selectLanguage: 'Select Language',
  },
  hi: {
    navDashboard: 'डैशबोर्ड',
    navTransactions: 'लेनदेन (Transactions)',
    navDecisions: 'रिकवरी निर्णय',
    navPolicy: 'नीति केंद्र (Policy)',
    navAudit: 'ऑडिट ट्रेल',
    navTitle: 'कंसोल नेविगेशन',
    searchPlaceholder: 'ट्रांजैक्शन आईडी या ग्राहक खोजें...',
    loadBatch: 'बैच लोड करें',
    loadingBatch: 'लोड हो रहा है...',
    runEngine: 'रिकवरी इंजन चलाएं',
    runningEngine: 'पाइपलाइन चल रही है...',
    demoMode: 'सिम्युलेटेड डेमो',
    aiAgentTitle: 'AI निर्णय एजेंट',
    aiAgentSubtitle: 'EV मॉडल + नियम सक्रिय',
    subBrand: 'स्वायत्त राजस्व रिकवरी प्रणाली',
    copilotTitle: 'RecoverIQ AI ऑपरेशंस सह-पायलट',
    copilotLauncher: 'RecoverIQ Copilot',
    copilotSub: 'कुछ भी पूछें · आवाज · हिंदी · AI समझाएगा, RecoverIQ तय करेगा।',
    copilotPlaceholder: 'RecoverIQ से कुछ भी पूछें (हिंदी / English)...',
    copilotWelcome: 'RecoverIQ ऑपरेशंस सह-पायलट में आपका स्वागत है',
    copilotWelcomeSub: 'लेनदेन विफलता के कारण, EV निर्णय, पॉलिसी ब्लॉक या राजस्व रिसाव के बारे में पूछें।',
    suggestedPrompts: 'सुझाए गए प्रश्न:',
    languageLabel: 'भाषा',
    selectLanguage: 'भाषा चुनें',
  },
  hinglish: {
    navDashboard: 'Dashboard',
    navTransactions: 'Transactions',
    navDecisions: 'Recovery Decisions',
    navPolicy: 'Policy Center',
    navAudit: 'Audit Trail',
    navTitle: 'Console Navigation',
    searchPlaceholder: 'Transaction ID ya Customer search karein...',
    loadBatch: 'Batch Load Karein',
    loadingBatch: 'Load ho raha hai...',
    runEngine: 'Recovery Engine Chalayein',
    runningEngine: 'Pipeline chal rahi hai...',
    demoMode: 'SIMULATED DEMO',
    aiAgentTitle: 'AI Decision Agent',
    aiAgentSubtitle: 'EV Model + Rules Active',
    subBrand: 'Autonomous Revenue Recovery Engine',
    copilotTitle: 'RecoverIQ AI Operations Copilot',
    copilotLauncher: 'RecoverIQ Copilot',
    copilotSub: 'Kuch bhi poochhein · Voice · Hinglish · AI Explain Karega.',
    copilotPlaceholder: 'RecoverIQ se kuch bhi poochhein (Hinglish / English)...',
    copilotWelcome: 'RecoverIQ Operations Copilot me aapka swagat hai',
    copilotWelcomeSub: 'Txn failure reasons, EV decisions, PolicyGate blocks ya revenue leakage ke baare me poochhein.',
    suggestedPrompts: 'Suggested Prompts (Hinglish):',
    languageLabel: 'Language',
    selectLanguage: 'Language Select Karein',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  currentOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('recoveriq_lang') as Language;
    if (saved && ['en', 'hi', 'hinglish'].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('recoveriq_lang', lang);
  };

  const t = translations[language] || translations.en;
  const currentOption = LANGUAGE_OPTIONS.find((o) => o.code === language) || LANGUAGE_OPTIONS[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentOption }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
