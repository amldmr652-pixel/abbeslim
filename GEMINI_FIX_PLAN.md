# V2.2 — Gemini İçin Adım Adım Uygulama Planı

> **KURAL:** Bu plandaki her adımı sırasıyla uygula. Her grubu bitirince `npm run build` çalıştır. Hata yoksa `npx vercel --prod --yes` ile deploy et. Sonra `CLAUDE_HANDOVER_REPORT.md` dosyasının SONUNA (append-only, asla silme) ne yaptığını yaz.

> **ÖNEMLİ:** Mevcut çalışan hiçbir özelliği bozma. Emin olmadığın yerde değişiklik yapma. Tailwind CSS v4 kullanılıyor: `@import "tailwindcss"` syntax.

---

## GRUP 1: Son Dosyalar + Finans Bağlantısı

### Görev 1.1 — Son Dosyalar Widget Düzeltmesi

**Problem:** Dashboard'daki "Son Dosyalar" widgetı veri göstermiyor ve dosyalar tıklanamıyor.

**Dosya: `src/app/page.tsx`**

Satır 79-88 arasını şununla değiştir:
```tsx
      if (files && files.length > 0) {
        const formattedFiles = files.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.name.split('.').pop() || 'file',
          date: new Date(f.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
          url: f.file_url || f.url || null
        }));
        setRecentFiles(formattedFiles);
      }
```

**Dosya: `src/app/components/dashboard/RecentFilesWidget.tsx`**

Bu dosyayı TAMAMEN şununla değiştir:

```tsx
'use client';

import { FileText, ChevronRight } from 'lucide-react';
import { Card } from '@/app/components/ui';
import Link from 'next/link';
import { useTranslation } from '@/app/hooks/useTranslation';

interface RecentFile {
  id: string | number;
  name: string;
  type: string;
  date: string;
  url?: string | null;
}

interface RecentFilesWidgetProps {
  files: RecentFile[];
}

export default function RecentFilesWidget({ files }: RecentFilesWidgetProps) {
  const { t } = useTranslation();

  const handleFileClick = (file: RecentFile) => {
    if (file.url) {
      if (file.type === 'pdf') {
        window.open(`/viewer?url=${encodeURIComponent(file.url)}`, '_blank');
      } else {
        window.open(file.url, '_blank');
      }
    }
  };

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText size={18} className="text-orange-400" /> {t('dashboard.recentFiles')}
        </h2>
        <Link href="/library" className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1 transition-colors">
          {t('common.all')} <ChevronRight size={14} className="rtl:rotate-180" />
        </Link>
      </div>
      <div className="space-y-3">
        {files.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">{t('dashboard.noFiles')}</div>
        ) : (
          files.map(file => (
            <div 
              key={file.id} 
              onClick={() => handleFileClick(file)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
            >
              <div className="p-2 bg-orange-900/20 rounded-lg shrink-0">
                <FileText size={16} className="text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate group-hover:text-green-400 transition-colors">{file.name}</p>
                <p className="text-xs text-gray-500">{file.type.toUpperCase()} • {file.date}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
```

---

### Görev 1.2 — Dashboard Finans Bağlantısı

**Dosya: `src/app/page.tsx`**

1. Import bloğuna ekle (satır 24 civarı, diğer store importlarının yanına):
```tsx
import { useFinanceStore } from '@/stores/useFinanceStore';
```

2. `DashboardContent` fonksiyonunun içine (satır 52 civarı, diğer store hook'larının yanına) ekle:
```tsx
const { fetchTransactions, getTotalExpense } = useFinanceStore();
```

3. `useEffect` içindeki `fetchGoals();` satırının hemen altına ekle (satır 64 civarı):
```tsx
    fetchTransactions();
```

4. Satır 149'daki `monthlyExpense={0}` ifadesini şununla değiştir:
```tsx
        monthlyExpense={getTotalExpense()}
```

**Bu grubu bitirince:** `npm run build` çalıştır. Hata yoksa sonraki gruba geç.

---

## GRUP 2: Harita Modülü Sıfırdan Tasarım

### Görev 2.1 — SQL Migration Dosyası

**Dosya: `scripts/map-migration.sql` (YENİ DOSYA OLUŞTUR)**

```sql
-- Harita Modülü: map_pins tablosu
CREATE TABLE IF NOT EXISTS map_pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  title TEXT NOT NULL DEFAULT 'Yeni Konum',
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'planned',
  color TEXT NOT NULL DEFAULT 'green',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE map_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pins" ON map_pins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pins" ON map_pins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pins" ON map_pins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pins" ON map_pins FOR DELETE USING (auth.uid() = user_id);
```

> **NOT:** Bu SQL'i Supabase SQL Editor'de çalıştırmayı KULLANICIYA hatırlat.

---

### Görev 2.2 — useMapStore Yeniden Yazımı (Supabase)

**Dosya: `src/stores/useMapStore.ts`**

Bu dosyayı TAMAMEN şununla değiştir:

```ts
import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

export type PinCategory = 'general' | 'city' | 'sacred' | 'nature' | 'history' | 'food';
export type PinStatus = 'planned' | 'visited';

export interface MapPin {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  category: PinCategory;
  status: PinStatus;
  color: string;
  created_at: string;
}

interface MapState {
  pins: MapPin[];
  isLoading: boolean;
  fetchPins: () => Promise<void>;
  addPin: (pin: Partial<MapPin>) => Promise<void>;
  updatePin: (id: string, updates: Partial<MapPin>) => Promise<void>;
  removePin: (id: string) => Promise<void>;
}

export const useMapStore = create<MapState>((set) => ({
  pins: [],
  isLoading: false,

  fetchPins: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await getSupabase()
        .from('map_pins')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ pins: data || [] });
    } catch (e: any) {
      console.error('Harita pinleri alınamadı:', e.message);
    } finally {
      set({ isLoading: false });
    }
  },

  addPin: async (pin) => {
    try {
      const { data, error } = await getSupabase()
        .from('map_pins')
        .insert([pin])
        .select()
        .single();
      if (error) throw error;
      set((s) => ({ pins: [data, ...s.pins] }));
    } catch (e: any) {
      console.error('Pin eklenemedi:', e.message);
    }
  },

  updatePin: async (id, updates) => {
    try {
      const { data, error } = await getSupabase()
        .from('map_pins')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      set((s) => ({ pins: s.pins.map((p) => (p.id === id ? data : p)) }));
    } catch (e: any) {
      console.error('Pin güncellenemedi:', e.message);
    }
  },

  removePin: async (id) => {
    try {
      const { error } = await getSupabase().from('map_pins').delete().eq('id', id);
      if (error) throw error;
      set((s) => ({ pins: s.pins.filter((p) => p.id !== id) }));
    } catch (e: any) {
      console.error('Pin silinemedi:', e.message);
    }
  },
}));
```

---

### Görev 2.3 — MapClient Sıfırdan Yazımı

**Dosya: `src/app/map/MapClient.tsx`**

Bu dosyayı TAMAMEN şununla değiştir:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMapStore, MapPin, PinCategory, PinStatus } from '@/stores/useMapStore';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// Leaflet ikon düzeltmesi
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STATUS_COLORS: Record<PinStatus, string> = {
  planned: '#eab308',
  visited: '#22c55e',
};

const CATEGORIES: { id: PinCategory; label: string; emoji: string }[] = [
  { id: 'general', label: 'Genel', emoji: '📍' },
  { id: 'city', label: 'Şehirler', emoji: '🏙️' },
  { id: 'sacred', label: 'Kutsal Mekanlar', emoji: '🕌' },
  { id: 'nature', label: 'Doğa', emoji: '🌿' },
  { id: 'history', label: 'Tarih', emoji: '🏛️' },
  { id: 'food', label: 'Yeme-İçme', emoji: '🍽️' },
];

const createPinIcon = (status: PinStatus) => {
  const color = STATUS_COLORS[status];
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

function ClickHandler({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({ click: (e) => onMapClick(e) });
  return null;
}

export default function MapClient() {
  const { pins, fetchPins, addPin, updatePin, removePin } = useMapStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PinCategory | 'all'>('all');

  const [isAddMode, setIsAddMode] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<PinCategory>('general');
  const [newStatus, setNewStatus] = useState<PinStatus>('planned');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    fetchPins();
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, [fetchPins]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!isAddMode) return;
    setPendingLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
  };

  const handleAddConfirm = async () => {
    if (!userId || !pendingLatLng || !newTitle.trim()) return;
    await addPin({
      user_id: userId, lat: pendingLatLng.lat, lng: pendingLatLng.lng,
      title: newTitle.trim(), description: newDesc.trim(),
      category: newCategory, status: newStatus, color: STATUS_COLORS[newStatus],
    });
    setPendingLatLng(null);
    setNewTitle(''); setNewDesc('');
    setNewCategory('general'); setNewStatus('planned');
    setIsAddMode(false);
  };

  const handleToggleStatus = async (pin: MapPin) => {
    const next: PinStatus = pin.status === 'planned' ? 'visited' : 'planned';
    await updatePin(pin.id, { status: next, color: STATUS_COLORS[next] });
  };

  const startEdit = (pin: MapPin) => { setEditingId(pin.id); setEditTitle(pin.title); setEditDesc(pin.description); };
  const saveEdit = async () => { if (!editingId) return; await updatePin(editingId, { title: editTitle, description: editDesc }); setEditingId(null); };

  const filteredPins = selectedCategory === 'all' ? pins : pins.filter((p) => p.category === selectedCategory);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
      {/* Sol Panel */}
      <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
        <button
          onClick={() => setIsAddMode(!isAddMode)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-medium transition-all ${
            isAddMode ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'glass text-gray-300 hover:text-white hover:border-green-500/30'
          }`}
        >
          <Plus size={18} />
          {isAddMode ? 'Haritaya Tıklayın...' : 'Yeni Konum Ekle'}
        </button>

        <div className="glass p-4 rounded-2xl">
          <p className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-wider">Kategori</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === 'all' ? 'bg-green-600/30 text-green-400 border border-green-500/30' : 'text-gray-400 hover:text-white glass'}`}>
              Tümü ({pins.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = pins.filter((p) => p.category === cat.id).length;
              return (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat.id ? 'bg-green-600/30 text-green-400 border border-green-500/30' : 'text-gray-400 hover:text-white glass'}`}>
                  {cat.emoji} {cat.label} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass p-4 rounded-2xl flex-1 overflow-y-auto custom-scrollbar">
          <p className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-wider">Konumlar</p>
          {filteredPins.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Henüz konum eklenmemiş.</p>
          ) : (
            <div className="space-y-2">
              {filteredPins.map((pin) => {
                const cat = CATEGORIES.find((c) => c.id === pin.category);
                return (
                  <div key={pin.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[pin.status as PinStatus] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{pin.title}</p>
                      <p className="text-xs text-gray-500">{cat?.emoji} {cat?.label} • {pin.status === 'visited' ? '✅ Gidildi' : '⏳ Planlandı'}</p>
                    </div>
                    <button onClick={() => removePin(pin.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Harita */}
      <div className="flex-1 rounded-3xl overflow-hidden border border-green-900/30 shadow-2xl z-0 isolate relative">
        <MapContainer center={[39.0, 35.0]} zoom={6} style={{ height: '100%', width: '100%', background: '#0a0a0a', zIndex: 0 }}>
          <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <ClickHandler onMapClick={handleMapClick} />
          {filteredPins.map((pin) => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={createPinIcon(pin.status as PinStatus)}>
              <Popup>
                <div className="min-w-[220px] text-gray-800">
                  {editingId === pin.id ? (
                    <div className="flex flex-col gap-2">
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="border-b border-gray-300 outline-none px-1 text-sm font-bold bg-transparent" />
                      <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="border border-gray-300 rounded outline-none p-1 text-xs resize-none h-16 bg-transparent" />
                      <button onClick={saveEdit} className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg">Kaydet</button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-bold text-base mb-1">{pin.title}</h3>
                      {pin.description && <p className="text-sm text-gray-600 mb-2">{pin.description}</p>}
                      <div className="flex gap-2 border-t pt-2 mt-2 border-gray-200">
                        <button onClick={() => handleToggleStatus(pin)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">{pin.status === 'planned' ? '✅ Gittim' : '⏳ Plana Al'}</button>
                        <button onClick={() => startEdit(pin)} className="text-blue-500 text-xs flex items-center gap-1"><Edit2 size={12}/> Düzenle</button>
                        <button onClick={() => removePin(pin.id)} className="text-red-500 text-xs flex items-center gap-1"><Trash2 size={12}/> Sil</button>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {pendingLatLng && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[500] glass p-5 rounded-2xl w-[90%] max-w-md border border-green-500/30 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-white font-bold mb-3">Yeni Konum</h3>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Konum adı..." className="w-full bg-black/50 border border-green-900/50 rounded-xl p-2.5 px-4 text-white text-sm mb-2 outline-none focus:border-green-500" />
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Açıklama (opsiyonel)" className="w-full bg-black/50 border border-green-900/50 rounded-xl p-2.5 px-4 text-white text-sm mb-3 outline-none focus:border-green-500 resize-none h-16" />
            <div className="flex gap-2 mb-3">
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as PinCategory)} className="flex-1 bg-black/50 border border-green-900/50 rounded-xl p-2 text-white text-sm outline-none">
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
              </select>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as PinStatus)} className="flex-1 bg-black/50 border border-green-900/50 rounded-xl p-2 text-white text-sm outline-none">
                <option value="planned">⏳ Gitmek İstiyorum</option>
                <option value="visited">✅ Gittim</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddConfirm} disabled={!newTitle.trim()} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">Ekle</button>
              <button onClick={() => { setPendingLatLng(null); setIsAddMode(false); }} className="px-4 py-2.5 glass text-gray-400 hover:text-white rounded-xl text-sm transition-colors">İptal</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Görev 2.4 — globals.css'den Eski Map Filter'ı Kaldır

**Dosya: `src/app/globals.css`**

Satır 86-89 arasındaki şu bloğu SİL:
```css
/* Map tiles dark theme filter */
.map-tiles {
  filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
}
```

**Bu grubu bitirince:** `npm run build` çalıştır.

---

## GRUP 3: Tema Sistemi

### Görev 3.1 — LayoutShell'e Tema Uygulama

**Dosya: `src/app/LayoutShell.tsx`**

1. Import bloğuna ekle (satır 10 civarı):
```tsx
import { useSettingsStore } from '@/stores/useSettingsStore';
```

2. `LayoutShell` fonksiyonunun içine (satır 30 civarı, `useFocusStore` satırının altına) ekle:
```tsx
  const { theme } = useSettingsStore();
```

3. Mevcut `useEffect` bloğunun (satır 34-39) ALTINA yeni bir `useEffect` ekle:
```tsx
  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-amoled');
    if (theme !== 'dark') {
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);
```

### Görev 3.2 — Settings Sayfasındaki Notu Güncelle

**Dosya: `src/app/settings/page.tsx`**

Satır 175'teki şu metni:
```
Tam destek yakında eklenecektir
```
Şununla değiştir:
```
Tema değişikliği anlık olarak uygulanır.
```

**Bu grubu bitirince:** `npm run build` çalıştır.

---

## GRUP 4: Profil Sayfası Genişletme

### Görev 4.1 — Profil Fotoğrafı Yükleme

**Dosya: `src/app/settings/page.tsx`**

Profil sekmesindeki `activeTab === 'profile'` bölümünde, satır 111'deki `<div className="space-y-5 max-w-md">` satırından HEMEN SONRA, "E-posta Adresi" bölümünden ÖNCE, şu avatar bloğunu ekle:

```tsx
                  {/* Avatar */}
                  <div className="flex items-center gap-6 pb-4 border-b border-white/10">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-full bg-green-900/30 flex items-center justify-center text-3xl font-bold text-green-400 overflow-hidden">
                        {user?.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (fullName || user?.email || '?')[0].toUpperCase()
                        )}
                      </div>
                      <label className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                        <Camera size={20} className="text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !user) return;
                          const ext = file.name.split('.').pop();
                          const filePath = `${user.id}/avatar.${ext}`;
                          const supabaseClient = createClient();
                          const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, file, { upsert: true });
                          if (uploadError) { console.error('Avatar yüklenemedi:', uploadError); return; }
                          const { data: { publicUrl } } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
                          await supabaseClient.auth.updateUser({ data: { avatar_url: publicUrl } });
                          setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: publicUrl } });
                        }} />
                      </label>
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{fullName || 'İsimsiz Kullanıcı'}</p>
                      <p className="text-gray-500 text-sm">{user?.email}</p>
                    </div>
                  </div>
```

> **NOT:** `Camera` zaten satır 4'te import edilmiş durumda. Supabase Storage'da `avatars` adlı **public** bucket gerekir.

**Bu grubu bitirince:** `npm run build` çalıştır.

---

## GRUP 5: i18n Kapsamını Genişletme

### Görev 5.1 — Eksik Çeviri Anahtarlarını Ekle

Aşağıdaki anahtarları MEVCUT JSON dosyalarına EKLE (merge). Mevcut anahtarları SİLME.

**Dosya: `src/locales/tr.json`** — Aşağıdaki bölümleri mevcut JSON'a ekle:

`common` bölümüne ekle:
```json
    "back": "Geri",
    "edit": "Düzenle",
    "update": "Güncelle",
    "confirm": "Onayla",
    "close": "Kapat",
    "noData": "Henüz veri yok."
```

Yeni `settings` bölümü ekle:
```json
  "settings": {
    "title": "Ayarlar",
    "subtitle": "Profilinizi, görünümü ve ses tercihlerinizi yapılandırın.",
    "personalInfo": "Kişisel Bilgiler",
    "email": "E-posta Adresi",
    "emailNote": "E-posta adresi şu anda değiştirilemez.",
    "fullName": "Ad Soyad",
    "fullNamePlaceholder": "Adınızı girin",
    "profileUpdated": "Başarıyla güncellendi!",
    "themeTitle": "Tema Seçimi",
    "themeNote": "Tema değişikliği anlık olarak uygulanır.",
    "themeDark": "Koyu",
    "themeLight": "Açık",
    "themeAmoled": "AMOLED Siyah",
    "breakSounds": "Mola Sesleri",
    "breakSoundsDesc": "Pomodoro molası başladığında çalacak rahatlatıcı doğa sesini seçin.",
    "addCustomSound": "Kendi Sesini Ekle",
    "soundNamePlaceholder": "Ses Adı (Örn: Yağmur 2)",
    "soundUrlPlaceholder": "Ses URL'si (.mp3)",
    "addSound": "Ses Ekle"
  }
```

Yeni `map` bölümü ekle:
```json
  "map": {
    "title": "Harita",
    "subtitle": "Gezdiğiniz yerleri, gitmek istediğiniz mekanları ve önemli konumları haritada işaretleyin.",
    "addNewPin": "Yeni Konum Ekle",
    "clickMap": "Haritaya Tıklayın...",
    "category": "Kategori",
    "locations": "Konumlar",
    "noLocations": "Henüz konum eklenmemiş.",
    "newLocation": "Yeni Konum",
    "locationName": "Konum adı...",
    "descriptionOptional": "Açıklama (opsiyonel)",
    "planned": "Gitmek İstiyorum",
    "visited": "Gittim",
    "all": "Tümü",
    "general": "Genel",
    "city": "Şehirler",
    "sacred": "Kutsal Mekanlar",
    "nature": "Doğa",
    "history": "Tarih",
    "food": "Yeme-İçme"
  }
```

`games` bölümüne ekle:
```json
    "resetTime": "Süreyi Sıfırla"
```

**Dosya: `src/locales/en.json`** — Aynı anahtarları İngilizce olarak ekle:

`common` bölümüne: `"back": "Back", "edit": "Edit", "update": "Update", "confirm": "Confirm", "close": "Close", "noData": "No data yet."`

Yeni `settings` bölümü:
```json
  "settings": {
    "title": "Settings",
    "subtitle": "Configure your profile, appearance, and sound preferences.",
    "personalInfo": "Personal Information",
    "email": "Email Address",
    "emailNote": "Email address cannot be changed at this time.",
    "fullName": "Full Name",
    "fullNamePlaceholder": "Enter your name",
    "profileUpdated": "Successfully updated!",
    "themeTitle": "Theme Selection",
    "themeNote": "Theme changes apply instantly.",
    "themeDark": "Dark",
    "themeLight": "Light",
    "themeAmoled": "AMOLED Black",
    "breakSounds": "Break Sounds",
    "breakSoundsDesc": "Choose a relaxing nature sound to play when your Pomodoro break starts.",
    "addCustomSound": "Add Your Own Sound",
    "soundNamePlaceholder": "Sound Name (e.g., Rain 2)",
    "soundUrlPlaceholder": "Sound URL (.mp3)",
    "addSound": "Add Sound"
  }
```

Yeni `map` bölümü:
```json
  "map": {
    "title": "Map",
    "subtitle": "Mark places you've visited, want to go, and important locations on the map.",
    "addNewPin": "Add New Location",
    "clickMap": "Click on the Map...",
    "category": "Category",
    "locations": "Locations",
    "noLocations": "No locations added yet.",
    "newLocation": "New Location",
    "locationName": "Location name...",
    "descriptionOptional": "Description (optional)",
    "planned": "Want to Visit",
    "visited": "Visited",
    "all": "All",
    "general": "General",
    "city": "Cities",
    "sacred": "Sacred Places",
    "nature": "Nature",
    "history": "History",
    "food": "Dining"
  }
```

`games` bölümüne: `"resetTime": "Reset Timer"`

**Dosya: `src/locales/ar.json`** — Aynı anahtarları Arapça olarak ekle:

`common` bölümüne: `"back": "رجوع", "edit": "تعديل", "update": "تحديث", "confirm": "تأكيد", "close": "إغلاق", "noData": "لا توجد بيانات بعد."`

Yeni `settings` bölümü:
```json
  "settings": {
    "title": "الإعدادات",
    "subtitle": "إدارة ملفك الشخصي والمظهر وإعدادات الأصوات.",
    "personalInfo": "المعلومات الشخصية",
    "email": "البريد الإلكتروني",
    "emailNote": "لا يمكن تغيير البريد الإلكتروني حاليًا.",
    "fullName": "الاسم الكامل",
    "fullNamePlaceholder": "أدخل اسمك",
    "profileUpdated": "تم التحديث بنجاح!",
    "themeTitle": "اختيار السمة",
    "themeNote": "يتم تطبيق تغييرات السمة فورًا.",
    "themeDark": "داكن",
    "themeLight": "فاتح",
    "themeAmoled": "أسود AMOLED",
    "breakSounds": "أصوات الاستراحة",
    "breakSoundsDesc": "اختر صوتًا مريحًا ليُشغل عند بدء استراحة بومودورو.",
    "addCustomSound": "أضف صوتك الخاص",
    "soundNamePlaceholder": "اسم الصوت",
    "soundUrlPlaceholder": "رابط الصوت (.mp3)",
    "addSound": "إضافة صوت"
  }
```

Yeni `map` bölümü:
```json
  "map": {
    "title": "الخريطة",
    "subtitle": "حدد الأماكن التي زرتها والأماكن التي تريد زيارتها على الخريطة.",
    "addNewPin": "إضافة موقع جديد",
    "clickMap": "انقر على الخريطة...",
    "category": "الفئة",
    "locations": "المواقع",
    "noLocations": "لم تتم إضافة مواقع بعد.",
    "newLocation": "موقع جديد",
    "locationName": "اسم الموقع...",
    "descriptionOptional": "الوصف (اختياري)",
    "planned": "أريد الذهاب",
    "visited": "زرتها",
    "all": "الكل",
    "general": "عام",
    "city": "مدن",
    "sacred": "أماكن مقدسة",
    "nature": "طبيعة",
    "history": "تاريخ",
    "food": "مطاعم"
  }
```

`games` bölümüne: `"resetTime": "إعادة ضبط المؤقت"`

**Bu grubu bitirince:** `npm run build` çalıştır. Hata yoksa `npx vercel --prod --yes` ile deploy et.

---

## SON ADIMLAR

1. `CLAUDE_HANDOVER_REPORT.md` dosyasının SONUNA tarih damgasıyla V2.2 raporunu EKLE
2. Kullanıcıya hatırlat:
   - `scripts/map-migration.sql` → Supabase SQL Editor'de çalıştırılmalı
   - Supabase Dashboard → Storage → `avatars` adlı **public** bucket oluşturulmalı
