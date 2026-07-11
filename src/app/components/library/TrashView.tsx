'use client';

import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { LibraryState } from '@/app/hooks/useLibrary';
import { getFileIcon } from './utils';

interface Props {
  libraryState: LibraryState;
}

export function TrashView({ libraryState }: Props) {
  const { trashLoading, trashedFiles, handleRestore, handlePermanentDelete } = libraryState;

  return (
    <div className="w-full flex-1">
      {trashLoading ? (
        <div className="text-center p-20 text-green-500 flex items-center justify-center gap-4">
          <Loader2 className="animate-spin" size={36} /> <span className="text-xl font-medium">Yükleniyor...</span>
        </div>
      ) : trashedFiles.length === 0 ? (
        <div className="glass p-20 rounded-3xl text-center text-gray-400 text-xl shadow-2xl border border-green-900/30">
          🗑️ Geri dönüşüm kutusu boş.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trashedFiles.map(file => (
            <div key={file.id} className="glass p-7 rounded-3xl border border-red-900/30 flex flex-col justify-between opacity-80 hover:opacity-100 transition-all shadow-2xl hover:border-red-500/50 hover:shadow-[0_0_40px_rgba(185,28,28,0.15)]">
              <div>
                <div className="flex items-start gap-5 mb-6">
                  <div className="p-4 bg-red-900/20 rounded-2xl flex-shrink-0 shadow-lg">
                    {getFileIcon(file.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-2xl line-clamp-2 mb-2 leading-tight">{file.name}</h3>
                    <p className="text-sm text-gray-400 font-medium">
                      Silinme: {file.deletedAt ? new Date(file.deletedAt).toLocaleDateString('tr-TR') : '—'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => handleRestore(file.id)}
                  className="flex-1 py-3.5 bg-green-900/40 hover:bg-green-700 text-green-300 rounded-full text-base font-bold transition-colors flex items-center justify-center gap-2 shadow-lg border border-green-500/30 hover:border-transparent"
                >
                  <RefreshCw size={20} /> Geri Al
                </button>
                <button
                  onClick={() => handlePermanentDelete(file.id)}
                  className="flex-1 py-3.5 bg-red-900/40 hover:bg-red-700 text-red-300 rounded-full text-base font-bold transition-colors flex items-center justify-center gap-2 shadow-lg border border-red-500/30 hover:border-transparent"
                >
                  <Trash2 size={20} /> Kalıcı Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
