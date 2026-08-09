import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Compass, Zap, MapPin, Database } from 'lucide-react';

interface GeocodeCacheModalProps {
  onClose: () => void;
}

export const GeocodeCacheModal: React.FC<GeocodeCacheModalProps> = ({ onClose }) => {
  const [cacheEntries, setCacheEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCache();
  }, []);

  const fetchCache = async () => {
    setLoading(true);
    try {
      const res = await api.getGeocodeCache();
      setCacheEntries(res.cache);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 tracking-tight">
                Cache Geocoding Multi-Tier (SHA-256 Query Hashing)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evita chiamate API esterne ripetute calcolando l'hash SHA-256 della query normalizzata.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cache List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Voci memorizzate nella cache locale: <strong className="text-amber-900 font-mono font-bold">{cacheEntries.length}</strong></span>
            <span className="font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-bold">Tier 1 Cache Hit Resolution: ~1ms</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 shadow-sm">
            {cacheEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                Nessuna voce in cache al momento. Verranno memorizzate automaticamente alla prima geolocalizzazione.
              </div>
            ) : (
              cacheEntries.map((entry, idx) => (
                <div key={idx} className="p-4 space-y-2 text-xs hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-700" />
                      {entry.query}
                    </span>
                    <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-amber-900 border border-slate-200">
                      {entry.source.toUpperCase()} ({entry.precision.toUpperCase()})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 font-semibold">Hash SHA-256: </span>
                      <span className="text-slate-800 font-bold">{entry.query_hash.slice(0, 16)}...</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Coord: </span>
                      <span className="text-amber-900 font-bold">{entry.latitude.toFixed(6)}, {entry.longitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Indirizzo Risolto: </span>
                      <span className="text-slate-800 truncate block font-medium">{entry.formatted_address}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
