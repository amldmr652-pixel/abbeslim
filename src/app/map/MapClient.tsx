'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMapStore, MapPin, PinCategory, PinStatus } from '@/stores/useMapStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Trash2, Edit2, Plus, Settings } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// Leaflet default icon fix for Next.js compatibility
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STATUS_COLORS: Record<PinStatus, string> = {
  planned: '#eab308',  // Gold - planned
  visited: '#22c55e',  // Green - visited
};

const CATEGORIES: { id: PinCategory; label: string; emoji: string }[] = [
  { id: 'general', label: 'Genel', emoji: '📍' },
  { id: 'city', label: 'Şehirler', emoji: '🏙️' },
  { id: 'sacred', label: 'Kutsal Mekanlar', emoji: '🕌' },
  { id: 'nature', label: 'Doğa', emoji: '🌿' },
  { id: 'history', label: 'Tarih', emoji: '🏛️' },
  { id: 'food', label: 'Yeme-İçme', emoji: '🍽️' },
];

const TILE_LAYERS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}',
};

// Custom DivIcon creator
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

// Controller to update center & zoom dynamically
function MapViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function MapClient() {
  const settings = useSettingsStore();
  const { pins, isLoading, fetchPins, addPin, updatePin, removePin } = useMapStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PinCategory | 'all'>('all');

  // Add Position
  const [isAddMode, setIsAddMode] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<PinCategory>('general');
  const [newStatus, setNewStatus] = useState<PinStatus>('planned');

  // Edit Position
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
      user_id: userId,
      lat: pendingLatLng.lat,
      lng: pendingLatLng.lng,
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      status: newStatus,
      color: STATUS_COLORS[newStatus],
    });
    setPendingLatLng(null);
    setNewTitle('');
    setNewDesc('');
    setNewCategory('general');
    setNewStatus('planned');
    setIsAddMode(false);
  };

  const handleToggleStatus = async (pin: MapPin) => {
    const next: PinStatus = pin.status === 'planned' ? 'visited' : 'planned';
    await updatePin(pin.id, { status: next, color: STATUS_COLORS[next] });
  };

  const startEdit = (pin: MapPin) => {
    setEditingId(pin.id);
    setEditTitle(pin.title);
    setEditDesc(pin.description || '');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updatePin(editingId, { title: editTitle, description: editDesc });
    setEditingId(null);
  };

  const filteredPins = selectedCategory === 'all'
    ? pins
    : pins.filter((p) => p.category === selectedCategory);

  const tileStyle = settings.mapTileStyle || 'dark';
  const mapZoom = settings.mapDefaultZoom || 6;
  const tileUrl = TILE_LAYERS[tileStyle] || TILE_LAYERS.dark;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
      {/* Sol Panel */}
      <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
        
        {/* Yeni Konum Ekle Butonu */}
        <button
          onClick={() => { setIsAddMode(!isAddMode); if (isAddMode) setPendingLatLng(null); }}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border ${
            isAddMode
              ? 'bg-green-500 text-stone-950 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-green-400'
              : 'glass text-gray-300 hover:text-white border-white/5 hover:border-green-500/30'
          }`}
        >
          <Plus size={18} />
          {isAddMode ? 'Haritaya Tıklayın...' : 'Yeni Konum Ekle'}
        </button>

        {/* Harita Stili Seçici */}
        <div className="glass p-4 rounded-2xl border border-white/5">
          <p className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-wider flex items-center gap-2">
            <Settings size={12} /> Harita Stili
          </p>
          <select
            value={tileStyle}
            onChange={(e) => settings.updateSettings({ mapTileStyle: e.target.value as any })}
            className="w-full bg-black/50 border border-green-900/50 rounded-xl p-2.5 text-white text-xs outline-none cursor-pointer"
          >
            <option value="dark" className="bg-stone-950 text-white">Koyu Tema (CARTO)</option>
            <option value="light" className="bg-stone-950 text-white">Açık Tema (CARTO)</option>
            <option value="satellite" className="bg-stone-950 text-white">Uydu Görünümü (ArcGIS)</option>
          </select>
        </div>

        {/* Kategori Filtresi */}
        <div className="glass p-4 rounded-2xl border border-white/5">
          <p className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-wider">Kategori</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'text-gray-400 hover:text-white glass border border-transparent'
              }`}
            >
              Tümü ({pins.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = pins.filter((p) => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'text-gray-400 hover:text-white glass border border-transparent'
                  }`}
                >
                  {cat.emoji} {cat.label} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pin Listesi */}
        <div className="glass p-4 rounded-2xl flex-1 overflow-y-auto border border-white/5">
          <p className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-wider">
            Konumlar {isLoading && <span className="text-green-500 ml-1">•</span>}
          </p>
          {filteredPins.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">
              {isLoading ? 'Yükleniyor...' : 'Henüz konum eklenmemiş.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredPins.map((pin) => {
                const cat = CATEGORIES.find((c) => c.id === pin.category);
                return (
                  <div key={pin.id} className="flex items-center gap-3 p-2 px-3 rounded-xl hover:bg-white/5 transition-colors group">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[pin.status as PinStatus] || '#22c55e' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{pin.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {cat?.emoji} {cat?.label} • {pin.status === 'visited' ? '✅ Gidildi' : '⏳ Planlandı'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Bu konumu haritadan kaldırmak istiyor musunuz?')) removePin(pin.id);
                      }}
                      className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Harita Alanı */}
      <div className="flex-1 rounded-3xl overflow-hidden border border-green-900/10 shadow-2xl z-0 isolate relative">
        <MapContainer
          center={[39.0, 35.0]}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%', background: '#0a0a0a', zIndex: 0 }}
        >
          <TileLayer
            key={tileStyle} // Force re-render tile layer on style change
            attribution='&copy; <a href="https://carto.com">CARTO</a> / ArcGIS'
            url={tileUrl}
          />
          <ClickHandler onMapClick={handleMapClick} />
          <MapViewUpdater center={[39.0, 35.0]} zoom={mapZoom} />

          {filteredPins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={createPinIcon(pin.status as PinStatus)}
            >
              <Popup>
                <div className="min-w-[220px] text-gray-800">
                  {editingId === pin.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="border-b border-gray-300 outline-none px-1 text-sm font-bold bg-transparent"
                        placeholder="Başlık"
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="border border-gray-300 rounded outline-none p-1 text-xs resize-none h-16 bg-transparent"
                        placeholder="Açıklama"
                      />
                      <button
                        onClick={saveEdit}
                        className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Kaydet
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-bold text-base mb-1">{pin.title}</h3>
                      {pin.description && (
                        <p className="text-sm text-gray-600 mb-2 break-words">{pin.description}</p>
                      )}
                      <div className="flex gap-2 border-t pt-2 mt-2 border-gray-200">
                        <button
                          onClick={() => handleToggleStatus(pin)}
                          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          {pin.status === 'planned' ? '✅ Gittim' : '⏳ Plana Al'}
                        </button>
                        <button
                          onClick={() => startEdit(pin)}
                          className="text-blue-500 text-xs flex items-center gap-1 hover:text-blue-700"
                        >
                          <Edit2 size={12} /> Düzenle
                        </button>
                        <button
                          onClick={() => removePin(pin.id)}
                          className="text-red-500 text-xs flex items-center gap-1 hover:text-red-700"
                        >
                          <Trash2 size={12} /> Sil
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Yeni Konum Ekleme Paneli */}
        {pendingLatLng && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[500] glass p-5 rounded-2xl w-[90%] max-w-md border border-green-500/35 shadow-2xl">
            <h3 className="text-white font-bold mb-3 text-sm">Konum Detayları Ekle</h3>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Konum adı..."
              className="w-full bg-black/50 border border-green-900/50 rounded-xl p-2.5 px-4 text-white text-xs mb-2 outline-none focus:border-green-500 transition-colors"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Açıklama (opsiyonel)"
              className="w-full bg-black/50 border border-green-900/50 rounded-xl p-2.5 px-4 text-white text-xs mb-3 outline-none focus:border-green-500 resize-none h-16 transition-colors"
            />
            <div className="flex gap-2 mb-3">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as PinCategory)}
                className="flex-1 bg-black/50 border border-green-900/50 rounded-xl p-2 text-white text-xs outline-none cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as PinStatus)}
                className="flex-1 bg-black/50 border border-green-900/50 rounded-xl p-2 text-white text-xs outline-none cursor-pointer"
              >
                <option value="planned">⏳ Gitmek İstiyorum</option>
                <option value="visited">✅ Gittim</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddConfirm}
                disabled={!newTitle.trim()}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-stone-950 font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Ekle
              </button>
              <button
                onClick={() => { setPendingLatLng(null); setIsAddMode(false); }}
                className="px-4 py-2.5 glass text-gray-400 hover:text-white rounded-xl text-xs transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
