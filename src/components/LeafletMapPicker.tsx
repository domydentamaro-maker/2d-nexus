import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocationPrecision, LocationSource } from '../types';
import { CheckCircle2, AlertTriangle, Crosshair, MapPin, Navigation, Lock } from 'lucide-react';

interface LeafletMapPickerProps {
  latitude: number;
  longitude: number;
  precision: LocationPrecision;
  source: LocationSource;
  verified: boolean;
  canEditCoords: boolean;
  addressLabel?: string;
  onCoordinatesChange: (lat: number, lng: number, source: LocationSource) => void;
  onVerifyToggle: (verified: boolean) => void;
}

export const LeafletMapPicker: React.FC<LeafletMapPickerProps> = ({
  latitude,
  longitude,
  precision,
  source,
  verified,
  canEditCoords,
  addressLabel,
  onCoordinatesChange,
  onVerifyToggle
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('osm');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: latitude || 40.9508,
    lng: longitude || 17.3033
  });
  const [isDragging, setIsDragging] = useState(false);

  // Custom 2D Pin icon
  const createCustomIcon = (isVerif: boolean) => {
    const color = isVerif ? '#059669' : '#d97706';
    const svgPin = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="36" height="48" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        <path fill="${color}" stroke="#ffffff" stroke-width="14" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
        <circle cx="192" cy="192" r="70" fill="#ffffff" />
        <circle cx="192" cy="192" r="45" fill="${isVerif ? '#10b981' : '#f59e0b'}" />
      </svg>
    `;
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: svgPin,
      iconSize: [36, 48],
      iconAnchor: [18, 48],
      popupAnchor: [0, -45]
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = latitude || 40.9508;
      const initialLng = longitude || 17.3033;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Tile layers
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      });
      osmLayer.addTo(map);
      (map as any)._osmLayer = osmLayer;

      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );
      (map as any)._satLayer = satLayer;

      // Marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: canEditCoords,
        icon: createCustomIcon(verified)
      }).addTo(map);

      marker.bindPopup(
        `<div class="p-1 space-y-1 text-slate-900 font-sans text-xs">
          <div class="font-bold text-amber-800 flex items-center gap-1.5 font-mono">📍 2D NEXUS PIN</div>
          <div class="text-slate-800 text-xs leading-snug font-medium">${addressLabel || 'Coordinate Immobile'}</div>
          <div class="font-mono text-[10px] text-slate-500 pt-0.5">${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}</div>
        </div>`
      );

      marker.on('dragstart', () => {
        setIsDragging(true);
      });

      marker.on('dragend', () => {
        setIsDragging(false);
        const pos = marker.getLatLng();
        setCurrentCoords({ lat: pos.lat, lng: pos.lng });
        onCoordinatesChange(pos.lat, pos.lng, 'manual');
        marker.setIcon(createCustomIcon(true));
      });

      // Map click to place marker (if allowed)
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (!canEditCoords) return;
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCurrentCoords({ lat, lng });
        onCoordinatesChange(lat, lng, 'manual');
        marker.setIcon(createCustomIcon(true));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update center and marker when props change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && latitude && longitude) {
      const map = mapInstanceRef.current;
      const marker = markerRef.current;
      const newPos: [number, number] = [latitude, longitude];

      marker.setLatLng(newPos);
      marker.setIcon(createCustomIcon(verified));
      marker.dragging?.enable();
      if (!canEditCoords) {
        marker.dragging?.disable();
      }

      setCurrentCoords({ lat: latitude, lng: longitude });

      const currentCenter = map.getCenter();
      const dist = Math.hypot(currentCenter.lat - latitude, currentCenter.lng - longitude);
      if (dist > 0.0001) {
        map.setView(newPos, map.getZoom(), { animate: true });
      }
    }
  }, [latitude, longitude, verified, canEditCoords]);

  // Toggle map layer
  const toggleMapLayer = (type: 'osm' | 'satellite') => {
    setMapType(type);
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current as any;
    if (type === 'satellite') {
      if (map._osmLayer) map.removeLayer(map._osmLayer);
      if (map._satLayer) map.addLayer(map._satLayer);
    } else {
      if (map._satLayer) map.removeLayer(map._satLayer);
      if (map._osmLayer) map.addLayer(map._osmLayer);
    }
  };

  const centerOnMarker = () => {
    if (mapInstanceRef.current && latitude && longitude) {
      mapInstanceRef.current.setView([latitude, longitude], 17, { animate: true });
    }
  };

  const getPrecisionBadgeColor = (p: LocationPrecision) => {
    switch (p) {
      case 'rooftop':
      case 'building':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'street':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'locality':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-800 border-rose-200';
    }
  };

  const getSourceLabel = (s: LocationSource) => {
    switch (s) {
      case 'google_geocoding':
        return 'Google Maps API';
      case 'openstreetmap':
        return 'OpenStreetMap (Nominatim)';
      case 'manual':
        return 'Trascino Manuale Operatore';
      case 'cadastral':
        return 'Rilievo Catastale';
      case 'istat_centroid':
        return 'Centroide ISTAT Comune';
      default:
        return s;
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
      {/* Top Map Action Bar */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              Verifica Mappa Leaflet & Posizionamento Pin 2D
              {verified ? (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Posizione Verificata
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Da Verificare su Mappa
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {addressLabel || 'Trascina il marker per posizionare con precisione contrade, campagne o coordinate.'}
            </p>
          </div>
        </div>

        {/* Map Controls */}
        <div className="flex items-center gap-2.5">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center text-xs shadow-xs">
            <button
              type="button"
              onClick={() => toggleMapLayer('osm')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                mapType === 'osm' ? 'bg-amber-100 text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mappa Stradale
            </button>
            <button
              type="button"
              onClick={() => toggleMapLayer('satellite')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                mapType === 'satellite' ? 'bg-amber-100 text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite HD
            </button>
          </div>

          <button
            type="button"
            onClick={centerOnMarker}
            title="Centra vista sul pin 2D"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-amber-700 hover:border-amber-300 transition cursor-pointer shadow-xs"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[420px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Instructions Pill */}
        <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-2.5 shadow-md text-xs text-slate-800 flex items-center gap-2.5 font-medium">
          {canEditCoords ? (
            <>
              <Navigation className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Clicca o trascina il pin 2D per posizionare l'immobile esattamente.</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Modifica coordinate limitata agli account abilitati.</span>
            </>
          )}
        </div>

        {/* Floating Verification Action */}
        <div className="absolute bottom-4 left-4 z-[400]">
          <button
            type="button"
            onClick={() => onVerifyToggle(!verified)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold shadow-lg transition-all cursor-pointer ${
              verified
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300 hover:scale-105'
                : 'bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white ring-2 ring-amber-300 hover:scale-105'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {verified ? 'Posizione Verificata ✓ (Modifica)' : 'Conferma Posizione Immobile 📍'}
          </button>
        </div>
      </div>

      {/* Map Diagnostics Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
        <div>
          <span className="text-slate-500 block text-[11px] font-bold">Coordinate WGS84:</span>
          <span className="font-mono text-amber-900 font-bold tracking-wide text-xs">
            {Number(currentCoords.lat).toFixed(6)}, {Number(currentCoords.lng).toFixed(6)}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px] font-bold">Livello Precisione:</span>
          <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border font-mono ${getPrecisionBadgeColor(precision)}`}>
            {precision.toUpperCase()}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px] font-bold">Fonte Risoluzione:</span>
          <span className="text-slate-800 font-semibold truncate block" title={getSourceLabel(source)}>
            {getSourceLabel(source)}
          </span>
        </div>

        <div className="sm:text-right">
          <span className="text-slate-500 block text-[11px] font-bold">Stato Posizione:</span>
          <span className={`font-bold inline-flex items-center gap-1 ${verified ? 'text-emerald-700' : 'text-amber-700'}`}>
            {verified ? '✓ Verificata' : '⚠️ Da Verificare'}
          </span>
        </div>
      </div>
    </div>
  );
};
