'use client';

import { Search, ChevronRight, Folder, Home, Plus, Edit2, FolderUp, Trash2, FileText, Loader2, Download } from 'lucide-react';
import { LibraryState } from '@/app/hooks/useLibrary';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getFileIcon } from './utils';

interface Props {
  libraryState: LibraryState;
}

export function LibraryContent({ libraryState }: Props) {
  const { t } = useTranslation();
  const {
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    breadcrumbs, currentCategories,
    showAddCategory, setShowAddCategory,
    newCategoryName, setNewCategoryName,
    handleAddCategory, editingCategoryId, setEditingCategoryId,
    editingCategoryName, setEditingCategoryName,
    handleSaveCategory, setMovingCategoryId, setMovingCategoryParentId,
    handleDeleteCategory, loading, filteredFiles, categories,
    setRenamingFileId, setRenamingFileName,
    setMovingFileId, setMovingFileCategoryId, handleTrash, files
  } = libraryState;

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      {/* Arama Çubuğu */}
      <div className="w-full glass rounded-full p-4 px-6 flex items-center gap-4 shadow-xl mb-10 border border-green-900/30">
        <Search className="text-green-500" size={24} />
        <input
          type="text"
          placeholder={t('library.searchPlaceholder') || 'Dosya adı ile kütüphanede ara...'}
          className="bg-transparent border-none outline-none flex-1 text-white placeholder-gray-500 text-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Breadcrumbs Navigation */}
      <div className="w-full flex items-center gap-2 mb-8 text-base font-semibold text-gray-400 glass p-4 px-6 rounded-2xl border border-green-900/30 shadow-lg overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCategory('')}
          className={`flex items-center gap-2 transition-colors whitespace-nowrap ${
            selectedCategory === '' ? 'text-green-400 font-bold' : 'hover:text-white'
          }`}
        >
          <Home size={22} className={selectedCategory === '' ? 'text-green-500' : ''} />
          <span>{t('library.rootDirectory') || 'Kök Dizini (Tümü)'}</span>
        </button>
        
        {breadcrumbs.map((b) => (
          <div key={b.id} className="flex items-center gap-2 whitespace-nowrap">
            <ChevronRight size={20} className="text-gray-600" />
            <button
              onClick={() => setSelectedCategory(b.id)}
              className={`flex items-center gap-2 transition-colors ${
                selectedCategory === b.id ? 'text-green-400 font-bold' : 'hover:text-white'
              }`}
            >
              <Folder size={20} className={selectedCategory === b.id ? 'text-green-500' : 'text-gray-400'} />
              <span>{b.name}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Kategoriler / Alt Klasörler Grid */}
      <div className="w-full mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Folder className="text-green-500" size={28} />
          <span>{selectedCategory ? (t('library.subFolders') || 'Alt Klasörler') : (t('library.folders') || 'Klasörler')}</span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Yeni Klasör Ekle Kartı / Formu */}
          {showAddCategory ? (
            <div className="glass p-6 rounded-3xl border border-green-500/50 bg-black/80 flex flex-col justify-between shadow-xl animate-in fade-in zoom-in duration-200 min-h-[160px]">
              <div>
                <div className="flex items-center gap-2 text-green-400 font-bold text-base mb-4">
                  <Plus size={20} /> {selectedCategory ? (t('library.newSubFolder') || 'Yeni Alt Klasör') : (t('library.newFolder') || 'Yeni Klasör')}
                </div>
                <input
                  autoFocus
                  className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-green-900/50 text-white text-base outline-none focus:border-green-500 transition-colors mb-4"
                  placeholder={t('library.folderName') || 'Klasör adı...'}
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setShowAddCategory(false); }}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleAddCategory} className="flex-1 py-3 bg-green-700 hover:bg-green-600 text-white rounded-2xl text-sm font-bold transition-colors shadow-lg">{t('library.create') || 'Oluştur'}</button>
                <button onClick={() => setShowAddCategory(false)} className="px-5 py-3 glass text-gray-400 hover:text-white rounded-2xl text-sm font-medium transition-colors">{t('common.cancel') || 'İptal'}</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCategory(true)}
              className="glass p-8 rounded-3xl border border-dashed border-green-500/40 hover:border-green-500 hover:bg-green-950/20 transition-all flex flex-col items-center justify-center gap-4 group text-center cursor-pointer shadow-xl min-h-[160px]"
            >
              <div className="p-4 bg-green-900/30 text-green-400 group-hover:bg-green-500 group-hover:text-black rounded-2xl transition-all shadow-lg group-hover:scale-110 duration-300">
                <Plus size={36} />
              </div>
              <span className="text-lg font-bold text-green-400 group-hover:text-green-300 transition-colors">
                {selectedCategory ? 'Alt Klasör Ekle' : 'Yeni Klasör Ekle'}
              </span>
            </button>
          )}

          {/* Mevcut Klasörler */}
          {currentCategories.map(cat => (
            <div key={cat.id} className="relative group">
              {editingCategoryId === cat.id ? (
                <div className="glass p-6 rounded-3xl border border-green-500/50 bg-black/80 flex flex-col justify-between shadow-xl min-h-[160px]">
                  <div>
                    <div className="text-sm font-semibold text-gray-400 mb-3">Klasör Adını Düzenle</div>
                    <input
                      autoFocus
                      className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-green-900/50 text-white text-base outline-none focus:border-green-500 transition-colors mb-4"
                      value={editingCategoryName}
                      onChange={e => setEditingCategoryName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveCategory(cat.id);
                        if (e.key === 'Escape') setEditingCategoryId(null);
                      }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleSaveCategory(cat.id)} className="flex-1 py-3 bg-green-700 hover:bg-green-600 text-white rounded-2xl text-sm font-bold transition-colors shadow-lg">Kaydet</button>
                    <button onClick={() => setEditingCategoryId(null)} className="px-5 py-3 glass text-gray-400 hover:text-white rounded-2xl text-sm font-medium transition-colors">İptal</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`glass p-6 rounded-3xl flex flex-col justify-between hover:-translate-y-1 transition-all cursor-pointer group shadow-xl min-h-[160px] border ${
                    selectedCategory === cat.id ? 'border-green-500 bg-green-950/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'border-green-900/30 hover:border-green-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="p-4 bg-black/40 text-green-500 group-hover:bg-green-900/40 rounded-2xl transition-all shadow-lg group-hover:scale-110 duration-300 flex-shrink-0">
                      <Folder size={40} />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-10" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }}
                        className="p-2.5 bg-green-900/60 hover:bg-green-700 text-white rounded-2xl transition-colors shadow-lg"
                        title="Adı Düzenle"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMovingCategoryId(cat.id); setMovingCategoryParentId(cat.parentId || ''); }}
                        className="p-2.5 bg-green-900/60 hover:bg-green-700 text-white rounded-2xl transition-colors shadow-lg"
                        title="Klasörü Taşı"
                      >
                        <FolderUp size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.name); }}
                        className="p-2.5 bg-red-900/60 hover:bg-red-700 text-white rounded-2xl transition-colors shadow-lg"
                        title="Klasörü Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors truncate">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                      <span>İçeriği görmek için tıklayın</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dosya Listesi */}
      <div className="w-full">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="text-green-500" size={28} />
          <span>Dosyalar</span>
        </h2>

        {loading ? (
          <div className="p-20 flex items-center justify-center text-green-500 gap-4">
            <Loader2 className="animate-spin" size={36} />
            <span className="text-xl font-medium">Kütüphane yükleniyor...</span>
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFiles.map(file => {
              const catObj = categories.find(c => c.id === file.categoryId);
              const catName = catObj ? catObj.name : file.categoryId;
              const isPdf = file.type === 'application/pdf';
              const fileUrl = isPdf ? `/viewer?url=${encodeURIComponent(file.url)}` : file.url;

              const handleFileClick = async () => {
                try {
                  await fetch('/api/files/open', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: file.id }),
                  });
                } catch (e) {
                  console.error('Failed to update last opened', e);
                }
              };

              return (
                <a
                  key={file.id}
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleFileClick}
                  className="glass p-7 rounded-3xl flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group relative shadow-2xl border border-green-900/30 hover:border-green-500/50 hover:shadow-[0_0_40px_rgba(34,197,94,0.15)]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="p-4 bg-black/40 rounded-2xl group-hover:bg-green-900/30 transition-colors flex-shrink-0 shadow-lg">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              const response = await fetch(file.url);
                              const blob = await response.blob();
                              const blobUrl = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = blobUrl;
                              link.download = file.name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(blobUrl);
                            } catch (error) {
                              console.error('İndirme hatası:', error);
                              window.open(file.url, '_blank');
                            }
                          }}
                          className="p-3 text-gray-400 hover:text-green-400 hover:bg-green-900/30 rounded-2xl transition-colors shadow"
                          title="Dosyayı İndir"
                        >
                          <Download size={22} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setRenamingFileId(file.id);
                            setRenamingFileName(file.name);
                          }}
                          className="p-3 text-gray-400 hover:text-green-400 hover:bg-green-900/30 rounded-2xl transition-colors shadow"
                          title="Yeniden Adlandır"
                        >
                          <Edit2 size={22} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMovingFileId(file.id);
                            setMovingFileCategoryId(file.categoryId || '');
                          }}
                          className="p-3 text-gray-400 hover:text-green-400 hover:bg-green-900/30 rounded-2xl transition-colors shadow"
                          title="Klasörü Değiştir / Taşı"
                        >
                          <FolderUp size={22} />
                        </button>
                        <button
                          onClick={(e) => handleTrash(file.id, e)}
                          className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-2xl transition-colors shadow"
                          title="Geri Dönüşüm Kutusuna Taşı"
                        >
                          <Trash2 size={22} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors mb-4 line-clamp-2 leading-tight">
                      {file.name}
                    </h3>
                  </div>
                  
                  <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-sm text-gray-400 font-semibold">
                    <span className="bg-white/10 px-4 py-1.5 rounded-full flex items-center gap-1 text-green-300">📁 {catName}</span>
                    <span>🗓️ {file.date}</span>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="w-full glass p-20 rounded-3xl text-center text-gray-400 text-xl shadow-2xl border border-green-900/30">
            {files.length === 0 ? 'Kütüphanenizde henüz dosya bulunmuyor. Yukarıdaki Yükle butonundan dosya ekleyebilirsiniz.' : 'Seçilen kriterlere uygun dosya bulunamadı.'}
          </div>
        )}
      </div>
    </div>
  );
}
