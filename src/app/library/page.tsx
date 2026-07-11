'use client';

import { useLibrary } from '@/app/hooks/useLibrary';
import { LibraryHeader } from '@/app/components/library/LibraryHeader';
import { CategorySidebar } from '@/app/components/library/CategorySidebar';
import { LibraryContent } from '@/app/components/library/LibraryContent';
import { TrashView } from '@/app/components/library/TrashView';
import { LibraryModals } from '@/app/components/library/LibraryModals';

export default function LibraryPage() {
  const libraryState = useLibrary();
  const { viewMode } = libraryState;

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden overflow-y-auto pb-24">
      <LibraryHeader libraryState={libraryState} />

      {/* Ana İçerik ve Sol Panel Düzeni */}
      <main className="z-10 w-full max-w-7xl px-4 flex flex-col lg:flex-row gap-8 items-start">
        {viewMode === 'library' && (
          <>
            <CategorySidebar libraryState={libraryState} />
            <LibraryContent libraryState={libraryState} />
          </>
        )}

        {viewMode === 'trash' && (
          <TrashView libraryState={libraryState} />
        )}
      </main>

      <LibraryModals libraryState={libraryState} />
    </div>
  );
}
