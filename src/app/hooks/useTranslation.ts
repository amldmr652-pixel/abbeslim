'use client';

import { useI18nStore } from '@/stores/useI18nStore';
import tr from '@/locales/tr.json';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';

const dictionaries = { tr, en, ar };

type DictKey = keyof typeof tr;

export function useTranslation() {
  const { language, setLanguage } = useI18nStore();
  const dict = dictionaries[language] || dictionaries.tr;

  // t('namespace.key') kullanımı
  const t = (path: string): string => {
    const keys = path.split('.');
    let result: any = dict;
    
    for (const key of keys) {
      if (result[key] === undefined) {
        console.warn(`Translation missing for key: ${path} in lang: ${language}`);
        return path;
      }
      result = result[key];
    }
    
    return result as string;
  };

  return { t, language, setLanguage };
}
