'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMapStore, MapMarker } from '@/stores/useMapStore';
import { Trash2, Edit2, Check } from 'lucide-react';
import { Button, Input } from '@/app/components/ui';

// Fix Leaflet's default icon path issues with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for different colors
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const COLOR_MAP = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7'
};

function MapEvents({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e);
    },
  });
  return null;
}

export default function MapClient() {
  const { markers, addMarker, removeMarker, updateMarker } = useMapStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [activeColor, setActiveColor] = useState<'red' | 'blue' | 'green' | 'yellow' | 'purple'>('red');

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    addMarker({
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      title: 'Yeni Konum',
      description: 'Konum açıklaması ekleyin...',
      color: activeColor
    });
  };

  const startEdit = (m: MapMarker) => {
    setEditingId(m.id);
    setEditTitle(m.title);
    setEditDesc(m.description);
  };

  const saveEdit = (id: string) => {
    updateMarker(id, { title: editTitle, description: editDesc });
    setEditingId(null);
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] rounded-3xl overflow-hidden border border-green-900/30 shadow-2xl z-0 isolate">
      <div className="absolute top-4 left-4 z-[400] glass p-3 flex flex-col gap-2">
        <p className="text-white text-sm font-bold mb-1">Yeni İşaretçi Rengi</p>
        <div className="flex gap-2">
          {(Object.keys(COLOR_MAP) as Array<keyof typeof COLOR_MAP>).map(c => (
            <button
              key={c}
              onClick={() => setActiveColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${activeColor === c ? 'border-white scale-125' : 'border-transparent opacity-50 hover:opacity-100'}`}
              style={{ backgroundColor: COLOR_MAP[c] }}
            />
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-1">Haritaya tıklayarak ekleyin.</p>
      </div>

      <MapContainer 
        center={[39.0, 35.0]} // Turkey center roughly
        zoom={6} 
        style={{ height: '100%', width: '100%', background: '#0a0a0a', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png"
          className="map-tiles"
        />
        
        <MapEvents onMapClick={handleMapClick} />

        {markers.map(m => (
          <Marker 
            key={m.id} 
            position={[m.lat, m.lng]} 
            icon={createCustomIcon(COLOR_MAP[m.color])}
          >
            <Popup className="custom-popup">
              <div className="min-w-[200px] text-gray-800">
                {editingId === m.id ? (
                  <div className="flex flex-col gap-2">
                    <input 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      className="border-b border-gray-300 outline-none px-1 text-sm font-bold bg-transparent"
                      placeholder="Başlık"
                    />
                    <textarea 
                      value={editDesc} 
                      onChange={e => setEditDesc(e.target.value)}
                      className="border border-gray-300 rounded outline-none p-1 text-xs resize-none h-16 bg-transparent"
                      placeholder="Açıklama"
                    />
                    <Button onClick={() => saveEdit(m.id)} size="sm" className="w-full justify-center !py-1">
                      Kaydet
                    </Button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-base mb-1">{m.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 break-words">{m.description}</p>
                    <div className="flex justify-between border-t pt-2 border-gray-200 mt-2">
                      <button onClick={() => startEdit(m)} className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs font-medium">
                        <Edit2 size={12} /> Düzenle
                      </button>
                      <button onClick={() => removeMarker(m.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs font-medium">
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
    </div>
  );
}
