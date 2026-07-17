'use client';

import { FileText, PlaySquare, Image as ImageIcon } from 'lucide-react';
import type { SearchMode } from '@/app/hooks/useSearch';
import { useTranslation } from '@/app/hooks/useTranslation';

const getFileIcon = (type: string) => {
  if (type.includes('video')) return <PlaySquare className="text-blue-400" size={24} />;
  if (type.includes('image')) return <ImageIcon className="text-pink-400" size={24} />;
  return <FileText className="text-orange-400" size={24} />;
};

interface SearchResultsListProps {
  searchResults: any[];
  searchQuery: string;
  searchMode: SearchMode;
  isSearching: boolean;
}

export default function SearchResultsList({ searchResults, searchQuery, searchMode, isSearching }: SearchResultsListProps) {
  const { t } = useTranslation();

  const buildViewerUrl = (file: any, page?: string) => {
    const params = new URLSearchParams();
    params.set('url', file.url);
    if (searchQuery) params.set('q', searchQuery);
    params.set('mode', searchMode);
    if (page) params.set('page', page);
    const hasPageMatches = file.type === 'application/pdf' && file.pageMatches && file.pageMatches.length > 0;
    if (hasPageMatches) {
      const pmSlice = file.pageMatches.slice(0, 100);
      params.set('pm', encodeURIComponent(JSON.stringify(pmSlice)));
      params.set('mc', String(file.matchCount || 0));
    }
    // Eşleme bilgisini en başta [FONTMAP:...] varsa URL parametresi olarak ekle
    if (file.extractedText && file.extractedText.startsWith('[FONTMAP:')) {
      const endIdx = file.extractedText.indexOf(']');
      if (endIdx !== -1) {
        const jsonStr = file.extractedText.substring(9, endIdx);
        params.set('fm', encodeURIComponent(jsonStr));
      }
    }
    // Kitap yönünü (RTL yönü) URL parametresi olarak ekle
    if (file.direction) {
      params.set('dir', file.direction);
    }
    return `/viewer?${params.toString()}`;
  };

  if (searchResults.length > 0) {
    return (
      <div className="w-full flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white mb-2">
          {t('search.resultsFound').replace('{count}', String(searchResults.length))}
        </h2>
        {searchResults.map((file) => {
          const isPdf = file.type === 'application/pdf';
          const hasPageMatches = isPdf && file.pageMatches && file.pageMatches.length > 0;
          const firstPage = hasPageMatches ? file.pageMatches[0].page : file.pageMatch;
          const fileUrl = isPdf ? buildViewerUrl(file, firstPage) : file.url;

          return (
            <div
              key={file.id}
              className="glass p-5 rounded-3xl flex flex-col gap-3 hover:-translate-y-1 transition-transform"
            >
              {/* Üst kısım: ikon + başlık + badge */}
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 group"
              >
                <div className="p-4 bg-black/30 rounded-2xl group-hover:bg-green-900/30 transition-colors flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 overflow-hidden min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors truncate">{file.name}</h3>
                    {/* Eşleşme sayısı badge */}
                    {hasPageMatches && file.matchCount > 0 && (
                      <span className="flex-shrink-0 flex items-center gap-1.5 bg-green-900/50 text-green-300 text-xs px-3 py-1 rounded-full border border-green-500/30 whitespace-nowrap font-semibold">
                        {t('search.matchesCount').replace('{count}', String(file.matchCount))}
                      </span>
                    )}
                    {!hasPageMatches && file.pageMatch && (
                      <span className="flex-shrink-0 flex items-center gap-1 bg-yellow-900/40 text-yellow-300 text-xs px-3 py-1 rounded-full border border-yellow-500/30 whitespace-nowrap">
                        {t('search.pageNumber').replace('{page}', String(file.pageMatch))}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    📁 {file.categoryName} • 🗓️ {file.date}
                    {isPdf && (
                      <span className="ml-2 text-green-600 text-xs font-semibold">{t('search.openInPdf')}</span>
                    )}
                  </p>
                </div>
              </a>

              {/* Snippet */}
              {file.snippet && (
                <div
                  className="bg-black/40 px-4 py-3 rounded-2xl border border-green-900/30 text-sm text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: file.snippet }}
                />
              )}

              {/* Sayfa konumları (PDF + birden fazla eşleşme varsa) */}
              {hasPageMatches && file.pageMatches.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="text-xs text-gray-500 font-semibold px-1 flex items-center gap-1.5">
                    <span className="text-green-600">📑</span>
                    {t('search.pagesWhereMentioned').replace('{count}', String(file.pageMatches.length))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {file.pageMatches.slice(0, 12).map((pm: { page: string; count: number; snippet?: string }) => (
                      <a
                        key={pm.page}
                        href={buildViewerUrl(file, pm.page)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={pm.snippet || t('search.pageNumber').replace('{page}', String(pm.page))}
                        className="flex items-center gap-1.5 bg-black/50 hover:bg-green-900/40 border border-green-900/30 hover:border-green-500/50 text-green-400 hover:text-green-300 text-xs px-3 py-1.5 rounded-xl transition-all group"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="font-semibold">{t('search.pageNumber').replace('{page}', String(pm.page))}</span>
                        <span className="text-gray-600 group-hover:text-gray-400 font-mono">{pm.count}×</span>
                      </a>
                    ))}
                    {file.pageMatches.length > 12 && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-black/30 border border-gray-700/40 text-gray-500 hover:text-gray-300 text-xs px-3 py-1.5 rounded-xl transition-all"
                      >
                        {t('search.moreCount').replace('{count}', String(file.pageMatches.length - 12))}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (searchQuery && searchResults.length === 0 && !isSearching) {
    return (
      <div className="w-full glass p-6 rounded-3xl text-center text-gray-400">
        {t('search.noResults')}
      </div>
    );
  }

  return null;
}
