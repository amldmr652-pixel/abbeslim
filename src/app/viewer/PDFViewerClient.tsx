'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';
import AIChatWidget from '../components/AIChatWidget';
import ViewerToolbar from './components/ViewerToolbar';
import PageMatchPanel from './components/PageMatchPanel';
import PDFDocumentWrapper from './components/PDFDocument';
import { useTranslation } from '@/app/hooks/useTranslation';
import {
  normalizeChar,
  normalizeWithMap,
  TURKISH_STOPWORDS
} from './utils/textNormalization';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PageMatchInfo {
  page: string;
  count: number;
  snippet?: string;
}

function PDFViewerContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  const query = searchParams.get('q');
  const pageToJump = searchParams.get('page');
  const fileId = searchParams.get('fileId') ?? undefined;
  const mode = searchParams.get('mode') || 'word';
  const directionParam = searchParams.get('dir') || 'RTL_NORMAL';

  // --- URL'den gelen pageMatches (ana sayfa'dan geçilirse) ---
  const pageMatchesParam = searchParams.get('pm'); // JSON string
  const matchCountParam = searchParams.get('mc');
  const fontMapParam = searchParams.get('fm'); // Dinamik font eşleme JSON string'i

  const [dynamicFontMap, setDynamicFontMap] = useState<Record<string, string>>({});

  // Dinamik font haritasını URL'den yükle
  useEffect(() => {
    if (fontMapParam) {
      try {
        const decoded = decodeURIComponent(fontMapParam);
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === 'object') {
          setDynamicFontMap(parsed);
          console.log('Dinamik font haritası yüklendi:', parsed);
        }
      } catch (err) {
        console.error('Dinamik font haritası parse hatası:', err);
      }
    }
  }, [fontMapParam]);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.2);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Konum Paneli state ---
  const [isPanelOpen, setIsPanelOpen] = useState(!!query);
  const [pageMatches, setPageMatches] = useState<PageMatchInfo[]>([]);
  const [totalMatchCount, setTotalMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0); // 0-indexed
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // --- URL'den gelen pageMatches'i yükle ---
  useEffect(() => {
    if (pageMatchesParam) {
      try {
        const parsed: PageMatchInfo[] = JSON.parse(decodeURIComponent(pageMatchesParam));
        if (parsed && parsed.length > 0) {
          setPageMatches(parsed);
          const total = parsed.reduce((s, pm) => s + pm.count, 0);
          setTotalMatchCount(matchCountParam ? parseInt(matchCountParam) : total);
          return;
        }
      } catch {}
    }
  }, [pageMatchesParam, matchCountParam]);

  // --- PDF yüklenince client-side analiz yap (pageMatches yoksa) ---
  const analyzePageMatches = useCallback(async () => {
    if (!query || !url || pageMatches.length > 0) return;
    setIsAnalyzing(true);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const pdf = await pdfjsLib.getDocument({ url }).promise;
      
      let wordsToSearch: string[] = [];
      if (mode === 'phrase') {
        wordsToSearch = [normalizeChar(query, dynamicFontMap).trim()];
      } else {
        const normQuery = normalizeChar(query, dynamicFontMap).replace(/[.,!?;:]/g, ' ').trim();
        const queryWords = normQuery.split(/\s+/).filter(w => w.length > 1);

        const TR_STOPWORDS_NORM = Array.from(TURKISH_STOPWORDS).map(w => normalizeChar(w));
        const filteredWords = queryWords.filter(w => !TR_STOPWORDS_NORM.includes(w));
        wordsToSearch = filteredWords.length > 0 ? filteredWords : queryWords;
      }

      if (wordsToSearch.length === 0 || !wordsToSearch[0]) { setIsAnalyzing(false); return; }

      const found: PageMatchInfo[] = [];
      let totalCount = 0;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = (content.items as any[]).map((item: any) => item.str || '').join(' ');
        const normPageText = normalizeChar(pageText, dynamicFontMap);

        let count = 0;
        let snippet = '';

        for (const word of wordsToSearch) {
          const isArabic = /[\u0600-\u06FF]/.test(word);
          const reversedWord = isArabic ? word.split('').reverse().join('') : '';

          let idx = 0;
          while (true) {
            const posNormal = normPageText.indexOf(word, idx);
            const posReversed = reversedWord ? normPageText.indexOf(reversedWord, idx) : -1;
            const pos = posNormal !== -1 && posReversed !== -1
              ? Math.min(posNormal, posReversed)
              : posNormal !== -1 ? posNormal : posReversed;

            if (pos === -1) break;
            count++;
            if (!snippet) {
              const start = Math.max(0, pos - 30);
              const end = Math.min(pageText.length, pos + word.length + 80);
              snippet = pageText.substring(start, end).trim();
            }
            idx = pos + 1;
          }
        }

        if (count > 0) {
          found.push({ page: String(i), count, snippet: snippet.substring(0, 100) });
          totalCount += count;
        }
      }

      setPageMatches(found);
      setTotalMatchCount(totalCount);
    } catch (err) {
      console.error('PDF analiz hatası:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [query, url, pageMatches.length, mode, dynamicFontMap]);

  useEffect(() => {
    if (numPages && query && pageMatches.length === 0) {
      analyzePageMatches();
    }
  }, [numPages, query, analyzePageMatches, pageMatches.length]);

  // --- Sayfa atlama (scroll to page) ---
  const scrollToPage = useCallback((pageNum: string | number) => {
    const el = document.getElementById(`page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const interval = setInterval(() => {
        const el2 = document.getElementById(`page-${pageNum}`);
        if (el2) { el2.scrollIntoView({ behavior: 'smooth', block: 'start' }); clearInterval(interval); }
      }, 200);
      setTimeout(() => clearInterval(interval), 5000);
    }
  }, []);

  // İlk yüklemede sayfa atla
  useEffect(() => {
    if (!pageToJump || !numPages) return;
    const t = setTimeout(() => scrollToPage(pageToJump), 600);
    return () => clearTimeout(t);
  }, [pageToJump, numPages, scrollToPage]);

  // Eşleşmeler arası gezinme
  const goToMatch = useCallback((index: number) => {
    if (pageMatches.length === 0) return;
    const clamped = Math.max(0, Math.min(pageMatches.length - 1, index));
    setCurrentMatchIndex(clamped);
    scrollToPage(pageMatches[clamped].page);
  }, [pageMatches, scrollToPage]);

  const goNextMatch = () => goToMatch(currentMatchIndex + 1);
  const goPrevMatch = () => goToMatch(currentMatchIndex - 1);

  // Metin vurgulama (highlight) - DOM-based mark wrapper
  const doHighlight = useCallback(() => {
    if (!query || !containerRef.current) return;
    
    // Yardımcı HTML kaçış fonksiyonu
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Önceki sayfaların modifiye edilmiş span içeriklerini temizle/geri yükle
    containerRef.current.querySelectorAll('.react-pdf__Page__textContent span').forEach(el => {
      const orig = el.getAttribute('data-original-text');
      if (orig !== null) {
        el.textContent = orig;
        el.removeAttribute('data-original-text');
      }
    });

    const pages = containerRef.current.querySelectorAll('.react-pdf__Page');
    pages.forEach(page => {
      const textLayer = page.querySelector('.react-pdf__Page__textContent');
      if (!textLayer) return;

      const spans = textLayer.querySelectorAll('span');
      let fullText = '';
      const spanData: { el: HTMLElement; startIdx: number; text: string }[] = [];
      
      spans.forEach(span => {
        const textContent = span.textContent || '';
        spanData.push({ el: span as HTMLElement, startIdx: fullText.length, text: textContent });
        fullText += textContent;
      });
      
      const { normalizedText: cleanTextNorm, indexMap: cleanToFullMap } = normalizeWithMap(fullText, dynamicFontMap);

      const stopwordsArray = Array.from(TURKISH_STOPWORDS);
      let queryWords: string[] = [];
      if (mode === 'phrase') {
        const normQ = normalizeChar(query, dynamicFontMap);
        queryWords = [normQ];
        
        const isArabicPhrase = /[\u0600-\u06FF]/.test(normQ);
        if (isArabicPhrase && directionParam === 'RTL_REVERSED') {
          const revQ = normQ.split(/\s+/).reverse().join(' ');
          if (revQ !== queryWords[0]) {
            queryWords.push(revQ);
          }
        }
      } else {
        let cleanQueryStr = query.toLocaleLowerCase('tr-TR').replace(/[.,!?;:]/g, ' ');
        stopwordsArray.forEach(sw => {
          cleanQueryStr = cleanQueryStr.replace(new RegExp(`\\b${sw}\\b`, 'g'), ' ');
        });
        queryWords = cleanQueryStr.split(/\s+/).filter(w => w.length > 1).map(w => normalizeChar(w, dynamicFontMap));
      }

      const expandedQueryWords: string[] = [];
      queryWords.forEach(qw => {
        const isArabic = /[\u0600-\u06FF]/.test(qw);
        if (isArabic && directionParam === 'RTL_REVERSED') {
          const rev = qw.split('').reverse().join('');
          expandedQueryWords.push(rev);
        } else {
          expandedQueryWords.push(qw);
        }
      });
      queryWords = expandedQueryWords;
      
      if (queryWords.length === 0 || !queryWords[0]) return;

      const spanMatches = new Map<HTMLElement, { start: number; end: number }[]>();

      queryWords.forEach(qw => {
        const isArabicW = /[\u0600-\u06FF]/.test(qw);
        let idx = 0;
        while (true) {
          const foundClean = cleanTextNorm.indexOf(qw, idx);
          if (foundClean === -1) break;
          
          const foundFull = cleanToFullMap[foundClean];
          const matchEndFull = cleanToFullMap[foundClean + qw.length - 1] + 1;
          
          // Arapça kelimeler için kelime sınırı kontrolü
          let isValidWordBoundary = true;
          if (isArabicW) {
            const prevChar = foundClean > 0 ? cleanTextNorm[foundClean - 1] : '';
            const nextChar = foundClean + qw.length < cleanTextNorm.length ? cleanTextNorm[foundClean + qw.length] : '';
            
            const isPrevArabic = /[\u0600-\u06FF]/.test(prevChar);
            const isNextArabic = /[\u0600-\u06FF]/.test(nextChar);
            
            if (isPrevArabic || isNextArabic) {
              isValidWordBoundary = false;
            }
          }

          if (isValidWordBoundary) {
            spanData.forEach(sd => {
              if (sd.startIdx + sd.text.length > foundFull && sd.startIdx < matchEndFull) {
                const localStart = Math.max(0, foundFull - sd.startIdx);
                const localEnd = Math.min(sd.text.length, matchEndFull - sd.startIdx);
                
                if (localStart < localEnd) {
                  if (!spanMatches.has(sd.el)) {
                    spanMatches.set(sd.el, []);
                  }
                  spanMatches.get(sd.el)!.push({ start: localStart, end: localEnd });
                }
              }
            });
          }
          idx = foundClean + 1;
        }
      });

      // Her span için eşleşen yerleri `<mark>` tagı ile sar
      spanMatches.forEach((intervals, el) => {
        intervals.sort((a, b) => a.start - b.start);
        const merged: { start: number; end: number }[] = [];
        intervals.forEach(interval => {
          if (merged.length === 0) {
            merged.push(interval);
          } else {
            const last = merged[merged.length - 1];
            if (interval.start <= last.end) {
              last.end = Math.max(last.end, interval.end);
            } else {
              merged.push(interval);
            }
          }
        });

        const origText = el.getAttribute('data-original-text') || el.textContent || '';
        if (!el.hasAttribute('data-original-text')) {
          el.setAttribute('data-original-text', origText);
        }

        let html = '';
        let lastIdx = 0;
        merged.forEach(interval => {
          html += escapeHtml(origText.substring(lastIdx, interval.start));
          html += '<mark class="custom-word-highlight">';
          html += escapeHtml(origText.substring(interval.start, interval.end));
          html += '</mark>';
          lastIdx = interval.end;
        });
        html += escapeHtml(origText.substring(lastIdx));
        el.innerHTML = html;
      });
    });
  }, [query, mode, directionParam, dynamicFontMap]);

  const onTextLayerRender = useCallback(() => {
    doHighlight();
    setTimeout(doHighlight, 0);
    setTimeout(doHighlight, 100);
    setTimeout(doHighlight, 300);
    setTimeout(doHighlight, 800);
  }, [doHighlight]);

  // Sıfır gecikmeli (Zero-Lag) metin vurgulama renderersı
  const textRenderer = useCallback((textItem: any) => {
    const str = textItem.str || '';
    if (!query || !str.trim()) return str;

    const { normalizedText: cleanTextNorm, indexMap: cleanToFullMap } = normalizeWithMap(str, dynamicFontMap);
    const stopwordsArray = Array.from(TURKISH_STOPWORDS);

    let queryWords: string[] = [];
    if (mode === 'phrase') {
      const normQ = normalizeChar(query, dynamicFontMap);
      queryWords = [normQ];
      
      const isArabicPhrase = /[\u0600-\u06FF]/.test(normQ);
      if (isArabicPhrase && directionParam === 'RTL_REVERSED') {
        const revQ = normQ.split(/\s+/).reverse().join(' ');
        if (revQ !== queryWords[0]) {
          queryWords.push(revQ);
        }
      }
    } else {
      let cleanQueryStr = query.toLocaleLowerCase('tr-TR').replace(/[.,!?;:]/g, ' ');
      stopwordsArray.forEach(sw => {
        cleanQueryStr = cleanQueryStr.replace(new RegExp(`\\b${sw}\\b`, 'g'), ' ');
      });
      queryWords = cleanQueryStr.split(/\s+/).filter(w => w.length > 1).map(w => normalizeChar(w, dynamicFontMap));
    }

    const expandedQueryWords: string[] = [];
    queryWords.forEach(qw => {
      const isArabic = /[\u0600-\u06FF]/.test(qw);
      if (isArabic && directionParam === 'RTL_REVERSED') {
        const rev = qw.split('').reverse().join('');
        expandedQueryWords.push(rev);
      } else {
        expandedQueryWords.push(qw);
      }
    });
    queryWords = expandedQueryWords;

    if (queryWords.length === 0 || !queryWords[0]) return str;

    const intervals: { start: number; end: number }[] = [];
    queryWords.forEach(qw => {
      const isArabicW = /[\u0600-\u06FF]/.test(qw);
      let idx = 0;
      while (true) {
        const foundClean = cleanTextNorm.indexOf(qw, idx);
        if (foundClean === -1) break;

        const foundFull = cleanToFullMap[foundClean];
        const matchEndFull = cleanToFullMap[foundClean + qw.length - 1] + 1;

        let isValid = true;
        if (isArabicW) {
          const prevChar = foundClean > 0 ? cleanTextNorm[foundClean - 1] : '';
          const nextChar = foundClean + qw.length < cleanTextNorm.length ? cleanTextNorm[foundClean + qw.length] : '';
          if (/[\u0600-\u06FF]/.test(prevChar) || /[\u0600-\u06FF]/.test(nextChar)) {
            isValid = false;
          }
        }

        if (isValid && foundFull < matchEndFull) {
          intervals.push({ start: foundFull, end: matchEndFull });
        }
        idx = foundClean + 1;
      }
    });

    if (intervals.length === 0) return str;

    // Aralıkları birleştir
    intervals.sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];
    intervals.forEach(interval => {
      if (merged.length === 0) {
        merged.push(interval);
      } else {
        const last = merged[merged.length - 1];
        if (interval.start <= last.end) {
          last.end = Math.max(last.end, interval.end);
        } else {
          merged.push(interval);
        }
      }
    });

    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    let html = '';
    let lastIdx = 0;
    merged.forEach(interval => {
      html += escapeHtml(str.substring(lastIdx, interval.start));
      html += '<mark class="custom-word-highlight">';
      html += escapeHtml(str.substring(interval.start, interval.end));
      html += '</mark>';
      lastIdx = interval.end;
    });
    html += escapeHtml(str.substring(lastIdx));
    return html;
  }, [query, mode, directionParam, dynamicFontMap]);

  useEffect(() => {
    window.addEventListener('resize', doHighlight);
    return () => window.removeEventListener('resize', doHighlight);
  }, [doHighlight]);

  // MutationObserver: Lazy-loaded sayfalar DOM'a eklendiğinde highlight'ı tetikle
  useEffect(() => {
    if (!query || !containerRef.current) return;
    
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          setTimeout(doHighlight, 200);
          setTimeout(doHighlight, 600);
          break;
        }
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [query, doHighlight]);

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        {t('viewer.noUrl') || 'Geçerli bir PDF URL\'si belirtilmedi.'}
      </div>
    );
  }

  const hasMatches = pageMatches.length > 0;
  const fileName = url.split('/').pop() || 'Document.pdf';

  return (
    <div className="min-h-screen flex flex-col items-center bg-black/90 pb-24">
      {/* react-pdf Metin Katmanı Stilleri */}
      <style jsx global>{`
        .react-pdf__Page {
          position: relative !important;
          display: inline-block !important;
          margin: 0 auto !important;
          padding: 0 !important;
        }
        .react-pdf__Page__canvas {
          display: block !important;
          margin: 0 auto !important;
        }
        .react-pdf__Page__textContent {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          transform-origin: 0% 0% !important;
          pointer-events: none !important;
          color: transparent !important;
        }
        .react-pdf__Page__textContent span {
          color: transparent !important;
          pointer-events: auto !important;
          position: absolute !important;
          transform-origin: 0% 0% !important;
          white-space: pre !important;
          line-height: 1 !important;
        }
        .react-pdf__Page__textContent mark.custom-word-highlight {
          color: transparent !important;
          background-color: rgba(250, 204, 21, 0.55) !important;
          border-radius: 3px !important;
          box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.25) !important;
          padding: 2px 0 !important;
        }
        .react-pdf__Page__annotations {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        .location-panel-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .location-panel-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .location-panel-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.3);
          border-radius: 4px;
        }
      `}</style>

      {/* Üst Bar */}
      <ViewerToolbar
        fileName={fileName}
        query={query}
        hasMatches={hasMatches}
        isAnalyzing={isAnalyzing}
        currentMatchIndex={currentMatchIndex}
        totalMatchCount={totalMatchCount}
        pageMatchesCount={pageMatches.length}
        isPanelOpen={isPanelOpen}
        setIsPanelOpen={setIsPanelOpen}
        pageToJump={pageToJump}
        scale={scale}
        setScale={setScale}
        goPrevMatch={goPrevMatch}
        goNextMatch={goNextMatch}
      />

      {/* Ana İçerik + Konum Paneli */}
      <div className="flex w-full flex-1 relative">
        {/* PDF Dokümanı */}
        <div ref={containerRef} className="mt-8 flex flex-col items-center gap-8 flex-1 overflow-x-auto px-4 pb-12">
          <PDFDocumentWrapper
            url={url}
            numPages={numPages}
            scale={scale}
            pageMatches={pageMatches}
            setCurrentMatchIndex={setCurrentMatchIndex}
            onDocumentLoadSuccess={onDocumentLoadSuccess}
            onTextLayerRender={onTextLayerRender}
            textRenderer={textRenderer}
          />
        </div>

        {/* Konum Paneli (sağ kenar) */}
        {isPanelOpen && (
          <PageMatchPanel
            query={query}
            hasMatches={hasMatches}
            isAnalyzing={isAnalyzing}
            pageMatches={pageMatches}
            totalMatchCount={totalMatchCount}
            currentMatchIndex={currentMatchIndex}
            setIsPanelOpen={setIsPanelOpen}
            goToMatch={goToMatch}
            goPrevMatch={goPrevMatch}
            goNextMatch={goNextMatch}
          />
        )}
      </div>
      <AIChatWidget currentFileId={fileId} currentFileUrl={url ?? undefined} />
    </div>
  );
}

export default function PDFViewerClient() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-green-500"><Loader2 className="animate-spin mr-2" size={24} /> Yükleniyor...</div>}>
      <PDFViewerContent />
    </Suspense>
  );
}
