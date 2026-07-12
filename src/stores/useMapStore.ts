import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  created_at: number;
}

interface MapState {
  markers: MapMarker[];
  addMarker: (marker: Omit<MapMarker, 'id' | 'created_at'>) => void;
  removeMarker: (id: string) => void;
  updateMarker: (id: string, updates: Partial<MapMarker>) => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      markers: [],
      
      addMarker: (marker) => set((state) => ({
        markers: [
          ...state.markers,
          {
            ...marker,
            id: Math.random().toString(36).substring(2, 9),
            created_at: Date.now()
          }
        ]
      })),
      
      removeMarker: (id) => set((state) => ({
        markers: state.markers.filter((m) => m.id !== id)
      })),
      
      updateMarker: (id, updates) => set((state) => ({
        markers: state.markers.map((m) => (m.id === id ? { ...m, ...updates } : m))
      }))
    }),
    {
      name: 'lifeos-map-storage'
    }
  )
);
