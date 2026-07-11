'use client';

import Link from 'next/link';
import { ArrowLeft, FolderUp, BookOpen } from 'lucide-react';
import { LibraryState } from '@/app/hooks/useLibrary';

interface Props {
  libraryState: LibraryState;
}

export function LibraryHeader({ libraryState }: Props) {
  const { viewMode, setViewMode, handleOpenUploadModal } = libraryState;

  return (
    <>
      <nav className="w-full p-6 flex justify-between items-center z-10 sticky top-0 bg-black/50 backdrop-blur-md border-b border-green-900/30 max-w-7xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-green-500 transition-colors font-medium">
          <ArrowLeft size={20} />
          <span>Ana Sayfaya Dön</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold tracking-wider text-green-500 hidden sm:block">abbeslim.</div>
          <button
            onClick={handleOpenUploadModal}
            className="bg-green-700 hover:bg-green-600 px-6 py-2 rounded-full flex items-center gap-2 transition-colors text-white font-medium shadow-lg"
          >
            <FolderUp size={18} />
            Yükle
          </button>
          <button
            onClick={async () => {
              const { createClient } = await import('@/utils/supabase/client');
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="bg-red-900/50 hover:bg-red-900/80 text-red-200 border border-red-500/30 px-6 py-2 rounded-full flex items-center gap-2 transition-colors hidden sm:flex">
            Çıkış Yap
          </button>
        </div>
      </nav>

      {/* Ana Başlık */}
      <div className="flex flex-col items-center z-10 w-full max-w-7xl px-4 mt-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="text-green-500" size={40} />
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Ders Notu Kütüphanesi</h1>
        </div>
        <p className="text-gray-400 mb-8 text-center max-w-lg text-base">
          Yüklediğiniz tüm dokümanlar, videolar, ses dosyaları ve klasör hiyerarşisini yönetin.
        </p>

        {/* Üst Sekme Seçici */}
        <div className="flex gap-4 mb-10">
          <button
            onClick={() => setViewMode('library')}
            className={`px-8 py-3.5 rounded-full font-bold text-base transition-all shadow-lg flex items-center gap-2 ${
              viewMode === 'library' ? 'bg-green-600 text-white scale-105 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'glass text-gray-400 hover:text-white'
            }`}
          >
            📚 Kütüphane
          </button>
          <button
            onClick={() => setViewMode('trash')}
            className={`px-8 py-3.5 rounded-full font-bold text-base transition-all shadow-lg flex items-center gap-2 ${
              viewMode === 'trash' ? 'bg-red-700 text-white scale-105 shadow-[0_0_30px_rgba(185,28,28,0.3)]' : 'glass text-gray-400 hover:text-white'
            }`}
          >
            🗑️ Geri Dönüşüm Kutusu
          </button>
        </div>
      </div>
    </>
  );
}
