import { ListFilter, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface PageMatchInfo {
  page: string;
  count: number;
  snippet?: string;
}

interface PageMatchPanelProps {
  query: string | null;
  hasMatches: boolean;
  isAnalyzing: boolean;
  pageMatches: PageMatchInfo[];
  totalMatchCount: number;
  currentMatchIndex: number;
  setIsPanelOpen: (v: boolean) => void;
  goToMatch: (idx: number) => void;
  goPrevMatch: () => void;
  goNextMatch: () => void;
}

export default function PageMatchPanel({
  query,
  hasMatches,
  isAnalyzing,
  pageMatches,
  totalMatchCount,
  currentMatchIndex,
  setIsPanelOpen,
  goToMatch,
  goPrevMatch,
  goNextMatch
}: PageMatchPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-[73px] h-[calc(100vh-73px)] w-72 shrink-0 bg-black/60 backdrop-blur-xl border-l border-green-900/30 flex flex-col overflow-hidden z-40 transition-all duration-300">
      {/* Panel Başlığı */}
      <div className="p-4 border-b border-green-900/30 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
            <ListFilter size={16} />
            {t('viewer.locationsTitle') || 'Konu Konumları'}
          </div>
          {query && (
            <div className="text-gray-500 text-xs mt-1 truncate">"{query}"</div>
          )}
        </div>
        <button
          onClick={() => setIsPanelOpen(false)}
          className="p-1.5 hover:bg-green-900/30 rounded-xl transition-colors text-gray-500 hover:text-gray-300"
        >
          <X size={16} />
        </button>
      </div>

      {/* Özet badge */}
      {hasMatches && (
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-green-950/60 border border-green-800/40 text-center">
          <div className="text-2xl font-bold text-green-400">{totalMatchCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">{t('viewer.totalMatches') || 'toplam eşleşme'}</div>
          <div className="text-xs text-green-600 mt-1">{pageMatches.length} {t('viewer.differentPages') || 'farklı sayfa'}</div>
        </div>
      )}

      {/* Analiz Yükleniyor */}
      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <Loader2 className="animate-spin text-green-500" size={28} />
          <div className="text-gray-400 text-sm">{t('viewer.analyzingPdf') || 'PDF analiz ediliyor…'}</div>
          <div className="text-gray-600 text-xs">{t('viewer.scanningAllPages') || 'Tüm sayfalar taranıyor'}</div>
        </div>
      )}

      {/* Eşleşme Listesi */}
      {hasMatches && !isAnalyzing && (
        <div className="flex-1 overflow-y-auto location-panel-scrollbar p-3 space-y-2 mt-2">
          {pageMatches.map((pm, idx) => (
            <button
              key={pm.page}
              onClick={() => goToMatch(idx)}
              className={`w-full text-left p-3 rounded-2xl border transition-all group ${
                currentMatchIndex === idx
                  ? 'bg-green-900/50 border-green-500/50 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                  : 'bg-black/30 border-green-900/20 hover:bg-green-950/40 hover:border-green-700/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    currentMatchIndex === idx ? 'bg-green-500 text-black' : 'bg-green-900/60 text-green-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`font-semibold text-sm ${
                    currentMatchIndex === idx ? 'text-green-300' : 'text-gray-300'
                  }`}>
                    {t('search.pageNumber').replace('{page}', pm.page)}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  currentMatchIndex === idx
                    ? 'bg-green-600/40 text-green-300'
                    : 'bg-gray-800/60 text-gray-500'
                }`}>
                  {pm.count}×
                </span>
              </div>
              {pm.snippet && (
                <div className="text-gray-500 text-xs leading-relaxed line-clamp-2 pl-8 group-hover:text-gray-400 transition-colors">
                  {pm.snippet}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Eşleşme yok */}
      {!hasMatches && !isAnalyzing && query && (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center flex-1">
          <div className="text-4xl">🔍</div>
          <div className="text-gray-400 text-sm">{t('viewer.noMatchesFound') || 'Bu PDF\'de eşleşme bulunamadı.'}</div>
          <div className="text-gray-600 text-xs">
            {t('viewer.queryNotPresent')
              ? t('viewer.queryNotPresent').replace('{query}', query)
              : `"${query}" konusu bu belgede geçmiyor`}
          </div>
        </div>
      )}

      {/* Gezinme butonları (alt kısım) */}
      {hasMatches && (
        <div className="p-3 border-t border-green-900/30 flex gap-2">
          <button
            onClick={goPrevMatch}
            disabled={currentMatchIndex === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-950/60 border border-green-800/40 text-green-400 text-xs font-semibold hover:bg-green-900/40 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={14} /> {t('common.prev') || 'Önceki'}
          </button>
          <button
            onClick={goNextMatch}
            disabled={currentMatchIndex === pageMatches.length - 1}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-950/60 border border-green-800/40 text-green-400 text-xs font-semibold hover:bg-green-900/40 disabled:opacity-30 transition-all"
          >
            {t('common.next') || 'Sonraki'} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
