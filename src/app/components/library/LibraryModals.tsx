'use client';

import { X, Upload, Loader2, Edit2, FolderUp } from 'lucide-react';
import { LibraryState } from '@/app/hooks/useLibrary';

interface Props {
  libraryState: LibraryState;
}

export function LibraryModals({ libraryState }: Props) {
  const {
    isUploadModalOpen, setIsUploadModalOpen, isUploading, handleUpload,
    uploadName, setUploadName, uploadCategory, setUploadCategory,
    categories, uploadDate, setUploadDate, setUploadFile,
    renamingFileId, setRenamingFileId, isRenaming, handleRenameFile,
    renamingFileName, setRenamingFileName,
    movingFileId, setMovingFileId, isMovingFile, handleMoveFile,
    movingFileCategoryId, setMovingFileCategoryId,
    movingCategoryId, setMovingCategoryId, isMovingCategory, handleMoveCategory,
    movingCategoryParentId, setMovingCategoryParentId, getDescendants
  } = libraryState;

  return (
    <>
      {/* Yükleme Modalı */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-3xl p-8 relative shadow-[0_0_50px_rgba(34,197,94,0.2)] border border-green-500/30">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
              disabled={isUploading}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-green-500 flex items-center gap-2">
              <Upload size={24} /> Yeni Dosya Yükle
            </h2>
            <form className="flex flex-col gap-4" onSubmit={handleUpload}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 px-1">Dosya İsmi / Başlık *</label>
                <input type="text" required className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors" placeholder="Örn: Hücre Bölünmesi PDF" value={uploadName} onChange={(e) => setUploadName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 px-1">Kategori (Klasör) *</label>
                <select required className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
                  <option value="">Kategori Seçin</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 px-1">Tarih *</label>
                <input type="date" required className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 px-1">Dosya (Video, Ses, PDF vb.) *</label>
                <input type="file" required onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-2 text-white file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-900/30 file:text-green-500 hover:file:bg-green-900/50 transition-colors cursor-pointer" />
              </div>
              <button type="submit" disabled={isUploading} className="mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 shadow-lg">
                {isUploading ? <Loader2 className="animate-spin" size={20} /> : null}
                {isUploading ? 'Yükleniyor...' : 'Dosyayı Yükle'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dosya Yeniden Adlandırma Modalı */}
      {renamingFileId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-3xl p-8 relative shadow-[0_0_50px_rgba(34,197,94,0.2)] border border-green-500/30">
            <button
              onClick={() => setRenamingFileId(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
              disabled={isRenaming}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-green-500 flex items-center gap-2">
              <Edit2 size={24} /> Dosyayı Yeniden Adlandır
            </h2>
            <form className="flex flex-col gap-4" onSubmit={handleRenameFile}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 px-1">Yeni Dosya İsmi *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="Dosya ismi girin..."
                  value={renamingFileName}
                  onChange={(e) => setRenamingFileName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isRenaming}
                className="mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                {isRenaming ? <Loader2 className="animate-spin" size={20} /> : null}
                {isRenaming ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dosya Taşıma Modalı */}
      {movingFileId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-3xl p-8 relative shadow-[0_0_50px_rgba(34,197,94,0.2)] border border-green-500/30 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setMovingFileId(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
              disabled={isMovingFile}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-green-500 flex items-center gap-2">
              <FolderUp size={24} /> Dosyayı Klasöre Taşı
            </h2>
            <form className="flex flex-col gap-4" onSubmit={handleMoveFile}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 px-1">Hedef Klasör *</label>
                <select
                  required
                  className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                  value={movingFileCategoryId}
                  onChange={(e) => setMovingFileCategoryId(e.target.value)}
                >
                  <option value="">Klasör Seçin</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isMovingFile}
                className="mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                {isMovingFile ? <Loader2 className="animate-spin" size={20} /> : null}
                {isMovingFile ? 'Taşınıyor...' : 'Klasöre Taşı'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Klasör Taşıma Modalı */}
      {movingCategoryId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-3xl p-8 relative shadow-[0_0_50px_rgba(34,197,94,0.2)] border border-green-500/30 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setMovingCategoryId(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
              disabled={isMovingCategory}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-green-500 flex items-center gap-2">
              <FolderUp size={24} /> Klasörü Başka Yere Taşı
            </h2>
            <form className="flex flex-col gap-4" onSubmit={handleMoveCategory}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 px-1">Hedef Klasör / Konum *</label>
                <select
                  className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                  value={movingCategoryParentId}
                  onChange={(e) => setMovingCategoryParentId(e.target.value)}
                >
                  <option value="">Ana Dizin (Root)</option>
                  {categories
                    .filter((c) => c.id !== movingCategoryId && !getDescendants(movingCategoryId, categories).includes(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isMovingCategory}
                className="mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                {isMovingCategory ? <Loader2 className="animate-spin" size={20} /> : null}
                {isMovingCategory ? 'Taşınıyor...' : 'Konuma Taşı'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
