'use client';

import { Mic, X, Sparkles } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  onRetryMic: () => void;
  micError: string;
  simulatedQuery: string;
  setSimulatedQuery: (q: string) => void;
}

export default function SimulationModal({
  isOpen, onClose, onSearch, onRetryMic, micError, simulatedQuery, setSimulatedQuery
}: SimulationModalProps) {
  const { t, language } = useTranslation();

  if (!isOpen) return null;

  const handleSimulatedSearch = (query: string) => {
    onClose();
    onSearch(query);
  };

  const samplesByLang: Record<string, string[]> = {
    'tr': ["Hücre bölünmesi nedir", "Mitoz bölünme evreleri", "Biyoloji notlarını aç"],
    'ar': ["ما هو انقسام الخلايا", "مراحل الانقسام المتساوي", "افتح ملاحظات الأحياء"],
    'en': ["What is cell division", "Mitosis division phases", "Open biology notes"]
  };

  const activeSamples = samplesByLang[language] || samplesByLang.tr;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-lg rounded-3xl p-8 relative animate-in fade-in zoom-in duration-200 border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-3 text-green-500 flex items-center gap-2">
          <Mic size={28} className="text-green-400 animate-pulse" /> {t('search.simulation.title')}
        </h2>
        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
          {t('search.simulation.desc').replace('{origin}', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001')}
        </p>

        {/* Mikrofon hata mesajı */}
        {micError && (
          <div className="bg-orange-900/50 text-orange-200 p-3 rounded-2xl mb-4 text-center border border-orange-500/30 flex items-center justify-center gap-3">
            <Sparkles size={16} className="text-yellow-400 flex-shrink-0" />
            <div className="text-xs leading-relaxed">{micError}</div>
          </div>
        )}

        {/* Gerçek Mikrofonu Yeniden Bağlamayı Dene Butonu */}
        <div className="mb-6 p-4 bg-green-950/30 border border-green-500/30 rounded-2xl flex items-center justify-between gap-4">
          <div className="text-sm text-green-200">
            {t('search.simulation.retryWarning')}
          </div>
          <button
            onClick={() => {
              onClose();
              onRetryMic();
            }}
            className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg flex-shrink-0 flex items-center gap-2 text-sm"
          >
            🔄 {t('search.simulation.retryButton')}
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            {t('search.simulation.chooseSample')}
          </label>
          <div className="flex flex-col gap-2.5">
            {activeSamples.map((q) => (
              <button
                key={q}
                onClick={() => handleSimulatedSearch(q)}
                className="w-full text-left glass p-3.5 px-5 rounded-2xl hover:bg-green-900/40 hover:border-green-500/50 transition-all text-white flex items-center justify-between group"
              >
                <span>🗣️ &quot;{q}&quot;</span>
                <span className="text-xs text-green-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('search.simulation.simulateBtn')} →
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            {t('search.simulation.customLabel')}
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={t('search.simulation.placeholder')}
              className="bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors flex-1"
              value={simulatedQuery}
              onChange={(e) => setSimulatedQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && simulatedQuery.trim()) handleSimulatedSearch(simulatedQuery); }}
            />
            <button
              onClick={() => { if (simulatedQuery.trim()) handleSimulatedSearch(simulatedQuery); }}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 rounded-2xl transition-colors shadow"
            >
              {t('common.search')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
