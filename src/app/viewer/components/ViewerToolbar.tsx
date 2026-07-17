import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface ViewerToolbarProps {
  fileName: string;
  query: string | null;
  hasMatches: boolean;
  isAnalyzing: boolean;
  currentMatchIndex: number;
  totalMatchCount: number;
  pageMatchesCount: number;
  isPanelOpen: boolean;
  setIsPanelOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  pageToJump: string | null;
  scale: number;
  setScale: (v: number | ((s: number) => number)) => void;
  goPrevMatch: () => void;
  goNextMatch: () => void;
  onBack?: () => void;
}

export default function ViewerToolbar({
  fileName,
  query,
  hasMatches,
  isAnalyzing,
  currentMatchIndex,
  totalMatchCount,
  pageMatchesCount,
  isPanelOpen,
  setIsPanelOpen,
  pageToJump,
  scale,
  setScale,
  goPrevMatch,
  goNextMatch,
  onBack
}: ViewerToolbarProps) {
  const { t } = useTranslation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.close(); // or window.history.back();
    }
  };

  return (
    <div className="w-full bg-black/80 backdrop-blur-md pt-20 pb-4 sticky top-0 z-50 border-b border-green-900/30 flex justify-between items-center px-6 gap-4">
      <div className="flex items-center gap-3 truncate max-w-xs md:max-w-md">
        <button
          onClick={handleBack}
          className="glass p-2 rounded-xl hover:bg-green-900/30 transition-colors text-green-400 hover:text-green-300 flex-shrink-0"
          title={t('viewer.back')}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-xl font-bold text-green-500 truncate">
          {fileName}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-end">
        {query && (
          <div className="bg-yellow-900/40 text-yellow-300 px-3 py-1 rounded-full text-sm border border-yellow-500/30 truncate max-w-[180px]">
            🔍 &quot;{query}&quot;
          </div>
        )}

        {/* Eşleşme Gezinme Kontrolü */}
        {hasMatches && (
          <div className="flex items-center gap-1 bg-green-950/60 border border-green-700/40 rounded-full px-2 py-1">
            <button
              onClick={goPrevMatch}
              disabled={currentMatchIndex === 0}
              className="p-1 rounded-full hover:bg-green-800/50 disabled:opacity-30 transition-colors"
              title={t('search.prevMatch') || 'Önceki eşleşme'}
            >
              <ChevronLeft size={16} className="text-green-400" />
            </button>
            <span className="text-green-300 text-xs font-mono px-1 min-w-[65px] text-center">
              {currentMatchIndex + 1} / {pageMatchesCount} {t('search.page') || 'sayfa'}
            </span>
            <button
              onClick={goNextMatch}
              disabled={currentMatchIndex === pageMatchesCount - 1}
              className="p-1 rounded-full hover:bg-green-800/50 disabled:opacity-30 transition-colors"
              title={t('search.nextMatch') || 'Sonraki eşleşme'}
            >
              <ChevronRight size={16} className="text-green-400" />
            </button>
          </div>
        )}

        {/* Toplam Eşleşme Badge */}
        {(hasMatches || isAnalyzing) && (
          <button
            onClick={() => setIsPanelOpen(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              isPanelOpen
                ? 'bg-green-600/30 text-green-300 border-green-500/50'
                : 'bg-green-950/50 text-green-400 border-green-700/30 hover:border-green-500/50'
            }`}
            title="Konum panelini aç/kapat"
          >
            <MapPin size={13} />
            {isAnalyzing ? (
              <><Loader2 size={12} className="animate-spin" /> {t('search.analyzing') || 'Analiz ediliyor…'}</>
            ) : (
              t('viewer.matchesFound')
                ? t('viewer.matchesFound').replace('{count}', String(totalMatchCount)).replace('{pages}', String(pageMatchesCount))
                : `${totalMatchCount} eşleşme · ${pageMatchesCount} sayfa`
            )}
          </button>
        )}

        {pageToJump && (
          <div className="bg-green-900/40 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30">
            📄 {t('search.pageNumber').replace('{page}', pageToJump)}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setScale(s => Math.max(0.6, s - 0.2))}
            className="glass p-2.5 rounded-2xl hover:bg-green-900/30 transition-colors"
            title={t('viewer.zoomOut')}
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={() => setScale(s => Math.min(2.4, s + 0.2))}
            className="glass p-2.5 rounded-2xl hover:bg-green-900/30 transition-colors"
            title={t('viewer.zoomIn')}
          >
            <ZoomIn size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
