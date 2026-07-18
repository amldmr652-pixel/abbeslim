import { useState, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import { Loader2, MapPin } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface PageMatchInfo {
  page: string;
  count: number;
  snippet?: string;
}

interface PDFDocumentWrapperProps {
  url: string;
  numPages: number | null;
  scale: number;
  pageMatches: PageMatchInfo[];
  setCurrentMatchIndex: (idx: number) => void;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onTextLayerRender: () => void;
  textRenderer: (textItem: any) => string;
}

interface LazyPageProps {
  pageNumber: number;
  scale: number;
  onRenderTextLayerSuccess: () => void;
  customTextRenderer: (textItem: any) => string;
  loading: React.ReactNode;
  className?: string;
}

function LazyPage({
  pageNumber,
  scale,
  onRenderTextLayerSuccess,
  customTextRenderer,
  loading,
  className
}: LazyPageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '800px 0px 800px 0px', // Sayfaya 1 sayfa kala yüklemeye başla
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      className="w-full flex justify-center items-center"
      style={{ minHeight: `${scale * 800}px` }}
    >
      {isVisible ? (
        <Page
          pageNumber={pageNumber}
          scale={scale}
          onRenderTextLayerSuccess={onRenderTextLayerSuccess}
          customTextRenderer={customTextRenderer}
          loading={loading}
          className={className}
        />
      ) : (
        loading
      )}
    </div>
  );
}

export default function PDFDocumentWrapper({
  url,
  numPages,
  scale,
  pageMatches,
  setCurrentMatchIndex,
  onDocumentLoadSuccess,
  onTextLayerRender,
  textRenderer
}: PDFDocumentWrapperProps) {
  const { t } = useTranslation();

  return (
    <Document
      file={url}
      onLoadSuccess={onDocumentLoadSuccess}
      loading={
        <div className="flex items-center gap-2 text-green-500 p-8">
          <Loader2 className="animate-spin" size={24} /> {t('common.loading') || 'Yükleniyor...'}
        </div>
      }
      error={
        <div className="text-red-400 p-8 glass rounded-3xl text-center max-w-md">
          {t('viewer.loadError') || 'PDF yüklenirken hata oluştu. Dosya bulunamamış veya bozuk olabilir.'}
        </div>
      }
    >
      {numPages &&
        Array.from(new Array(numPages), (el, index) => {
          const pageNumStr = String(index + 1);
          const pageMatch = pageMatches.find(pm => pm.page === pageNumStr);

          return (
            <div
              id={`page-${pageNumStr}`}
              key={index}
              className="glass p-3 rounded-3xl relative shadow-[0_0_30px_rgba(0,0,0,0.5)] flex justify-center overflow-hidden mb-6"
            >
              <LazyPage
                pageNumber={index + 1}
                scale={scale}
                onRenderTextLayerSuccess={onTextLayerRender}
                customTextRenderer={textRenderer}
                loading={<div className="h-[800px] w-[600px] bg-gray-900/50 animate-pulse rounded-2xl" />}
                className="rounded-2xl overflow-hidden relative"
              />
              
              {/* Sayfa numarası */}
              <div className="absolute bottom-6 right-6 bg-black/70 backdrop-blur-md px-4 py-1.5 rounded-full text-xs text-gray-300 border border-white/10 z-20 shadow-lg">
                {t('search.pageNumber').replace('{page}', pageNumStr)} / {numPages}
              </div>

              {/* Bu sayfada eşleşme varsa göster */}
              {pageMatch && (
                <div
                  className="absolute top-6 right-6 bg-yellow-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs text-yellow-300 border border-yellow-500/40 z-20 shadow-lg flex items-center gap-1 cursor-pointer"
                  onClick={() => {
                    const matchIdx = pageMatches.findIndex(pm => pm.page === pageNumStr);
                    if (matchIdx !== -1) setCurrentMatchIndex(matchIdx);
                  }}
                >
                  <MapPin size={11} />
                  {t('search.matchesCount').replace('{count}', String(pageMatch.count))}
                </div>
              )}
            </div>
          );
        })}
    </Document>
  );
}
