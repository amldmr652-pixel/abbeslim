'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, ListFilter, X, MapPin } from 'lucide-react';
import AIChatWidget from '../components/AIChatWidget';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PageMatchInfo {
  page: string;
  count: number;
  snippet?: string;
}

function PDFViewerContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  const query = searchParams.get('q');
  const pageToJump = searchParams.get('page');
  const fileId = searchParams.get('fileId') ?? undefined;
  const mode = searchParams.get('mode') || 'word';

  // --- URL'den gelen pageMatches (ana sayfa'dan geçilirse) ---
  const pageMatchesParam = searchParams.get('pm'); // JSON string
  const matchCountParam = searchParams.get('mc');

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
        wordsToSearch = [normalizeChar(query).trim()];
      } else {
        const normQuery = normalizeChar(query).replace(/[.,!?;:]/g, ' ').trim();
        const queryWords = normQuery.split(/\s+/).filter(w => w.length > 2);

        const TR_STOPWORDS_NORM = [
          'nedir', 'nasil', 'nerede', 'ne', 'zaman', 'neden', 'nicin',
          'hangi', 'olan', 'hakkinda', 'ile', 'gore', 'icin', 'bir',
          've', 'ya', 'da', 'veya', 'ama', 'fakat', 'ancak',
          'acikla', 'anlat', 'tanimla', 'bana', 'bul', 'goster',
        ];
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
        const normPageText = normalizeChar(pageText);

        let count = 0;
        let snippet = '';

        for (const word of wordsToSearch) {
          let idx = 0;
          while (true) {
            const pos = normPageText.indexOf(word, idx);
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
  }, [query, url, pageMatches.length, mode]);

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

  // --- Türkçe ve Arapça normalize (client-side highlight için) ---
  const normalizeChar = (text: string) => {
    return text
      .toLocaleLowerCase('tr-TR')
      // Türkçe normalizasyonu
      .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
      .replace(/i̇/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
      .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
      // Arapça normalizasyonu
      .replace(/[\u064b-\u0652\u0670]/g, '') // Diacritics (Tashkeel)
      .replace(/\u0640/g, '') // Tatweel (Kashida)
      .replace(/[أإآٱ]/g, 'ا') // Alifs
      .replace(/[ىی]/g, 'ي') // Ya / Alif Maksura
      .replace(/ة/g, 'ه'); // Ta Marbuta
  };

  // Metin vurgulama (highlight) - Range API
  const doHighlight = useCallback(() => {
    if (!query || !containerRef.current) return;
    
    // Eski highlight div'lerini temizle
    containerRef.current.querySelectorAll('.custom-word-highlight').forEach(el => el.remove());
    
    const pages = containerRef.current.querySelectorAll('.react-pdf__Page');
    pages.forEach(page => {
      const textLayer = page.querySelector('.react-pdf__Page__textContent');
      if (!textLayer) return;
      
      const layerRect = textLayer.getBoundingClientRect();
      if (layerRect.width === 0 || layerRect.height === 0) return;

      const spans = textLayer.querySelectorAll('span');
      let fullText = '';
      const spanData: { el: HTMLElement; startIdx: number; text: string }[] = [];
      
      spans.forEach(span => {
        const textContent = span.textContent || '';
        spanData.push({ el: span as HTMLElement, startIdx: fullText.length, text: textContent });
        fullText += textContent;
      });
      
      const cleanToFullMap: number[] = [];
      let cleanText = '';
      for (let i = 0; i < fullText.length; i++) {
        if (!/\s/.test(fullText[i])) {
          cleanToFullMap.push(i);
          cleanText += fullText[i];
        }
      }
      
      const cleanTextNorm = normalizeChar(cleanText);

      const TR_STOPWORDS = [
        'nedir', 'nasıl', 'nerede', 'ne zaman', 'neden', 'niçin', 'kaç',
        'hangi', 'olan', 'olanı', 'hakkında', 'ile', 'göre', 'için',
        'bir', 've', 'ya da', 'veya', 'ama', 'fakat', 'ancak',
        'açıkla', 'anlat', 'tanımla', 'ne anlama gelir', 'ne demek',
        'bana', 'bul', 'göster', 'aç', 'ararmısın', 'arat', 'notları', 'notu'
      ];
      
      let queryWords: string[] = [];
      if (mode === 'phrase') {
        // Cümle modunda tüm boşlukları kaldırıp arıyoruz çünkü cleanTextNorm da boşluksuz.
        queryWords = [normalizeChar(query).replace(/\s+/g, '')];
      } else {
        let cleanQueryStr = query.toLocaleLowerCase('tr-TR').replace(/[.,!?;:]/g, ' ');
        TR_STOPWORDS.forEach(sw => {
          cleanQueryStr = cleanQueryStr.replace(new RegExp(`\\b${sw}\\b`, 'g'), ' ');
        });
        queryWords = cleanQueryStr.split(/\s+/).filter(w => w.length > 2).map(w => normalizeChar(w));
      }
      
      if (queryWords.length === 0 || !queryWords[0]) return;

      queryWords.forEach(qw => {
        let idx = 0;
        while (true) {
          const foundClean = cleanTextNorm.indexOf(qw, idx);
          if (foundClean === -1) break;
          
          const foundFull = cleanToFullMap[foundClean];
          const matchEndFull = cleanToFullMap[foundClean + qw.length - 1] + 1;
          
          spanData.forEach(sd => {
            if (sd.startIdx + sd.text.length > foundFull && sd.startIdx < matchEndFull) {
              const localStart = Math.max(0, foundFull - sd.startIdx);
              const localEnd = Math.min(sd.text.length, matchEndFull - sd.startIdx);
              
              const textNode = sd.el.nodeType === Node.TEXT_NODE ? sd.el : sd.el.firstChild;
              if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                try {
                  const range = document.createRange();
                  range.setStart(textNode, localStart);
                  range.setEnd(textNode, localEnd);
                  
                  let rects = range.getClientRects();
                  if (!rects || rects.length === 0) {
                    rects = [sd.el.getBoundingClientRect()] as any;
                  }

                  for (let i = 0; i < rects.length; i++) {
                    const rect = rects[i];
                    const div = document.createElement('div');
                    div.className = 'custom-word-highlight';
                    div.style.position = 'absolute';
                    div.style.left = `${rect.left - layerRect.left}px`;
                    div.style.top = `${rect.top - layerRect.top}px`;
                    div.style.width = `${rect.width}px`;
                    div.style.height = `${rect.height}px`;
                    div.style.backgroundColor = 'rgba(234, 179, 8, 0.4)';
                    div.style.borderRadius = '4px';
                    div.style.pointerEvents = 'none';
                    div.style.zIndex = '10';
                    textLayer.appendChild(div);
                  }
                } catch (e) {
                  console.error('Range hesaplama hatası:', e);
                }
              }
            }
          });
          idx = foundClean + 1;
        }
      });
    });
  }, [query, mode]);

  const onTextLayerRender = useCallback(() => {
    setTimeout(doHighlight, 50);
    setTimeout(doHighlight, 300);
    setTimeout(doHighlight, 700);
  }, [doHighlight]);

  useEffect(() => {
    window.addEventListener('resize', doHighlight);
    return () => window.removeEventListener('resize', doHighlight);
  }, [doHighlight]);

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Geçerli bir PDF URL'si belirtilmedi.
      </div>
    );
  }

  const hasMatches = pageMatches.length > 0;

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
          background-color: rgba(234, 179, 8, 0.4) !important;
          border-radius: 4px !important;
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

      {/* Üst Bar (Widget'larla çakışmaması için pt-20) */}
      <div className="w-full bg-black/80 backdrop-blur-md pt-20 pb-4 sticky top-0 z-50 border-b border-green-900/30 flex justify-between items-center px-6 gap-4">
        <div className="text-xl font-bold text-green-500 truncate max-w-xs">
          {url.split('/').pop()}
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
                title="Önceki eşleşme"
              >
                <ChevronLeft size={16} className="text-green-400" />
              </button>
              <span className="text-green-300 text-xs font-mono px-1 min-w-[60px] text-center">
                {currentMatchIndex + 1} / {pageMatches.length} sayfa
              </span>
              <button
                onClick={goNextMatch}
                disabled={currentMatchIndex === pageMatches.length - 1}
                className="p-1 rounded-full hover:bg-green-800/50 disabled:opacity-30 transition-colors"
                title="Sonraki eşleşme"
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
                <><Loader2 size={12} className="animate-spin" /> Analiz ediliyor…</>
              ) : (
                `${totalMatchCount} eşleşme · ${pageMatches.length} sayfa`
              )}
            </button>
          )}

          {pageToJump && (
            <div className="bg-green-900/40 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30">
              📄 Sayfa {pageToJump}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setScale(s => Math.max(0.6, s - 0.2))}
              className="glass p-2.5 rounded-2xl hover:bg-green-900/30 transition-colors"
              title="Uzaklaştır"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={() => setScale(s => Math.min(2.4, s + 0.2))}
              className="glass p-2.5 rounded-2xl hover:bg-green-900/30 transition-colors"
              title="Yakınlaştır"
            >
              <ZoomIn size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Ana İçerik + Konum Paneli */}
      <div className="flex w-full flex-1 relative">

        {/* PDF Dokümanı */}
        <div ref={containerRef} className="mt-8 flex flex-col items-center gap-8 flex-1 overflow-x-auto px-4 pb-12">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center gap-2 text-green-500 p-8">
                <Loader2 className="animate-spin" size={24} /> PDF Yükleniyor...
              </div>
            }
            error={
              <div className="text-red-400 p-8 glass rounded-3xl">
                PDF yüklenirken hata oluştu. Dosya bulunamamış veya bozuk olabilir.
              </div>
            }
          >
            {numPages &&
              Array.from(new Array(numPages), (el, index) => (
                <div
                  id={`page-${index + 1}`}
                  key={index}
                  className="glass p-3 rounded-3xl relative shadow-[0_0_30px_rgba(0,0,0,0.5)] flex justify-center overflow-hidden mb-6"
                >
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    onRenderTextLayerSuccess={onTextLayerRender}
                    loading={<div className="h-[800px] w-[600px] bg-gray-900/50 animate-pulse rounded-2xl" />}
                    className="rounded-2xl overflow-hidden relative"
                  />
                  {/* Sayfa numarası */}
                  <div className="absolute bottom-6 right-6 bg-black/70 backdrop-blur-md px-4 py-1.5 rounded-full text-xs text-gray-300 border border-white/10 z-20 shadow-lg">
                    Sayfa {index + 1} / {numPages}
                  </div>
                  {/* Bu sayfada eşleşme varsa göster */}
                  {pageMatches.find(pm => pm.page === String(index + 1)) && (
                    <div
                      className="absolute top-6 right-6 bg-yellow-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs text-yellow-300 border border-yellow-500/40 z-20 shadow-lg flex items-center gap-1 cursor-pointer"
                      onClick={() => {
                        const matchIdx = pageMatches.findIndex(pm => pm.page === String(index + 1));
                        if (matchIdx !== -1) setCurrentMatchIndex(matchIdx);
                      }}
                    >
                      <MapPin size={11} />
                      {pageMatches.find(pm => pm.page === String(index + 1))?.count} eşleşme
                    </div>
                  )}
                </div>
              ))}
          </Document>
        </div>

        {/* Konum Paneli (sağ kenar) */}
        {isPanelOpen && (
          <div className="sticky top-[73px] h-[calc(100vh-73px)] w-72 shrink-0 bg-black/60 backdrop-blur-xl border-l border-green-900/30 flex flex-col overflow-hidden z-40 transition-all duration-300">
            {/* Panel Başlığı */}
            <div className="p-4 border-b border-green-900/30 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                  <ListFilter size={16} />
                  Konu Konumları
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
                <div className="text-xs text-gray-400 mt-0.5">toplam eşleşme</div>
                <div className="text-xs text-green-600 mt-1">{pageMatches.length} farklı sayfa</div>
              </div>
            )}

            {/* Analiz Yükleniyor */}
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <Loader2 className="animate-spin text-green-500" size={28} />
                <div className="text-gray-400 text-sm">PDF analiz ediliyor…</div>
                <div className="text-gray-600 text-xs">Tüm sayfalar taranıyor</div>
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
                          Sayfa {pm.page}
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
                <div className="text-gray-400 text-sm">Bu PDF'de eşleşme bulunamadı.</div>
                <div className="text-gray-600 text-xs">"{query}" konusu bu belgede geçmiyor</div>
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
                  <ChevronLeft size={14} /> Önceki
                </button>
                <button
                  onClick={goNextMatch}
                  disabled={currentMatchIndex === pageMatches.length - 1}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-950/60 border border-green-800/40 text-green-400 text-xs font-semibold hover:bg-green-900/40 disabled:opacity-30 transition-all"
                >
                  Sonraki <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
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
