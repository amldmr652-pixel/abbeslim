'use client';

import { useTranslation } from '@/app/hooks/useTranslation';

export default function SearchHero() {
  const { t } = useTranslation();

  return (
    <>
      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">
        {t('search.title')}
      </h1>
      <p className="text-gray-400 mb-12 text-center max-w-lg">
        {t('search.subtitle')}
      </p>
    </>
  );
}
