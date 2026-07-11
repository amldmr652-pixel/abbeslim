'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'tr' | 'en' | 'ar';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      language: 'tr',
      setLanguage: (lang) => {
        set({ language: lang });
        // Dil değiştiğinde HTML dir attribute'unu da güncelle
        if (typeof document !== 'undefined') {
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = lang;
        }
      },
    }),
    {
      name: 'lifeos-language',
    }
  )
);
