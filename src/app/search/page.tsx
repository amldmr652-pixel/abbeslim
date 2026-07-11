'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Sparkles } from 'lucide-react';
import { useSearch } from '@/app/hooks/useSearch';
import { useSpeechRecognition } from '@/app/hooks/useSpeechRecognition';
import { useFileUpload } from '@/app/hooks/useFileUpload';
import SearchHero from '@/app/components/search/SearchHero';
import MicrophoneButton from '@/app/components/search/MicrophoneButton';
import SearchBar from '@/app/components/search/SearchBar';
import SearchModeSelector from '@/app/components/search/SearchModeSelector';
import SearchResultsList from '@/app/components/search/SearchResultsList';
import SimulationModal from '@/app/components/search/SimulationModal';
import UploadModal from '@/app/components/search/UploadModal';
import MusicPanelModal from '@/app/components/search/MusicPanelModal';
import AIChatWidget from '@/app/components/AIChatWidget';

function SearchContent() {
  const search = useSearch();
  const upload = useFileUpload();

  const onTranscriptChange = useCallback((text: string) => {
    search.setSearchQuery(text);
    search.currentTranscriptRef.current = text;
  }, [search]);

  const onSearch = useCallback((text: string) => {
    search.doSearch(text);
  }, [search]);

  const speech = useSpeechRecognition({
    onTranscriptChange,
    onSearch,
  });

  const handleSimulatedSearch = (query: string) => {
    search.handleSimulatedSearch(query);
    speech.setIsSimulatingMic(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden overflow-y-auto">
      {/* Ana Arama Alanı */}
      <main className="flex flex-col items-center z-10 w-full max-w-3xl px-4 mt-12 pb-24">

        <SearchHero />

        {/* Tarayıcı desteği uyarısı */}
        {!speech.micSupported && (
          <div className="bg-red-900/50 text-red-200 p-4 rounded-2xl mb-8 text-center border border-red-500/30">
            ⚠️ Tarayıcınız ses tanımayı desteklemiyor. Lütfen Chrome veya Edge kullanın.
          </div>
        )}

        {/* Mikrofon hata mesajı */}
        {speech.micError && !speech.isSimulatingMic && (
          <div className="bg-orange-900/50 text-orange-200 p-4 rounded-2xl mb-8 text-center border border-orange-500/30 flex items-center justify-center gap-3">
            <Sparkles size={20} className="text-yellow-400 flex-shrink-0" />
            <div className="text-sm leading-relaxed">{speech.micError}</div>
          </div>
        )}

        <MicrophoneButton
          listening={speech.listening}
          micSupported={speech.micSupported}
          toggleListen={speech.toggleListen}
          searchQuery={search.searchQuery}
          isSearching={search.isSearching}
        />

        <SearchBar
          searchQuery={search.searchQuery}
          onSearchInput={search.handleSearchInput}
          listening={speech.listening}
          isSearching={search.isSearching}
        />

        <SearchModeSelector
          searchMode={search.searchMode}
          onModeChange={search.handleModeChange}
        />

        <SearchResultsList
          searchResults={search.searchResults}
          searchQuery={search.searchQuery}
          searchMode={search.searchMode}
          isSearching={search.isSearching}
        />

      </main>

      {/* Modaller */}
      <SimulationModal
        isOpen={speech.isSimulatingMic}
        onClose={() => speech.setIsSimulatingMic(false)}
        onSearch={handleSimulatedSearch}
        onRetryMic={() => {
          speech.networkRetryCount.current = 0;
          speech.startListening(false);
        }}
        micError={speech.micError}
        simulatedQuery={speech.simulatedQuery}
        setSimulatedQuery={speech.setSimulatedQuery}
      />

      <UploadModal
        isOpen={upload.isUploadModalOpen}
        onClose={() => upload.setIsUploadModalOpen(false)}
        uploadName={upload.uploadName}
        setUploadName={upload.setUploadName}
        uploadCategory={upload.uploadCategory}
        setUploadCategory={upload.setUploadCategory}
        uploadDate={upload.uploadDate}
        setUploadDate={upload.setUploadDate}
        setUploadFile={upload.setUploadFile}
        isUploading={upload.isUploading}
        uploadProgress={upload.uploadProgress}
        uploadStatus={upload.uploadStatus}
        onSubmit={(e) => upload.handleUpload(e, search.categories)}
        categories={search.categories}
      />

      <MusicPanelModal />

      <AIChatWidget />
    </div>
  );
}

// SSR tamamen kapalı — SpeechRecognition sadece browser'da çalışır
const SearchContentNoSSR = dynamic(() => Promise.resolve(SearchContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-green-500">
      <Loader2 className="animate-spin mr-3" size={32} />
    </div>
  ),
});

export default function SearchPage() {
  return <SearchContentNoSSR />;
}
