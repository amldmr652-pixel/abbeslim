'use client';

import { Search, Folder, Home } from 'lucide-react';
import { LibraryState } from '@/app/hooks/useLibrary';

interface Props {
  libraryState: LibraryState;
}

export function CategorySidebar({ libraryState }: Props) {
  const {
    categorySearchQuery,
    setCategorySearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredSidebarCategories,
    categories,
  } = libraryState;

  return (
    <aside className="w-full lg:w-80 glass p-6 rounded-3xl border border-green-900/30 shadow-2xl flex-shrink-0 lg:sticky lg:top-28">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Folder className="text-green-500" size={24} />
        <span>Klasör Filtresi</span>
      </h2>
      
      {/* Klasör Arama Çubuğu */}
      <div className="w-full bg-black/40 rounded-2xl p-3 px-4 flex items-center gap-3 border border-green-900/50 mb-6 shadow-inner">
        <Search className="text-green-500" size={18} />
        <input
          type="text"
          placeholder="Klasörlerde ara..."
          className="bg-transparent border-none outline-none flex-1 text-white placeholder-gray-500 text-sm"
          value={categorySearchQuery}
          onChange={(e) => setCategorySearchQuery(e.target.value)}
        />
      </div>

      {/* Kök Dizini (Tümü) Butonu */}
      <button
        onClick={() => setSelectedCategory('')}
        className={`w-full p-3.5 px-4 rounded-2xl flex items-center gap-3 transition-all font-medium text-left mb-3 shadow-lg ${
          selectedCategory === '' ? 'bg-green-600 text-white font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] border border-green-500/50' : 'bg-black/20 text-gray-400 hover:text-white hover:bg-black/40 border border-transparent'
        }`}
      >
        <Home size={20} className={selectedCategory === '' ? 'text-white' : 'text-green-500'} />
        <span className="flex-1 truncate">Kök Dizini (Tümü)</span>
      </button>

      <div className="text-xs font-semibold text-gray-500 mb-2 px-1 uppercase tracking-wider">Tüm Klasörler</div>

      {/* Klasör Hiyerarşisi / Listesi */}
      <div className="flex flex-col gap-2 max-h-[450px] overflow-y-auto no-scrollbar pr-1">
        {filteredSidebarCategories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          const parentObj = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full p-3 px-4 rounded-2xl flex items-center gap-3 transition-all text-left shadow-md group border ${
                isSelected ? 'bg-green-600 text-white font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] border-green-500/50' : 'bg-black/20 text-gray-400 hover:text-white hover:bg-black/40 border-transparent hover:border-green-900/40'
              }`}
            >
              <Folder size={18} className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-green-500 group-hover:scale-110 transition-transform'}`} />
              <div className="flex-1 truncate">
                <div className="text-sm font-semibold truncate">{cat.name}</div>
                {parentObj && (
                  <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-green-200' : 'text-gray-500'}`}>
                    Alt klasör: {parentObj.name}
                  </div>
                )}
              </div>
            </button>
          );
        })}
        {filteredSidebarCategories.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-6 glass rounded-2xl border border-dashed border-green-900/30">Aranan klasör bulunamadı.</div>
        )}
      </div>
    </aside>
  );
}
