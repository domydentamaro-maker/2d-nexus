import React from 'react';
import { Property, Operator } from '../types';
import {
  X,
  MapPin,
  Home,
  CheckCircle2,
  AlertTriangle,
  Euro,
  Maximize2,
  Zap,
  Sparkles,
  ExternalLink,
  Edit3,
  Send,
  Compass,
  FileText,
  Calendar
} from 'lucide-react';

interface PropertyDetailModalProps {
  property: Property | null;
  operator: Operator;
  onClose: () => void;
  onEdit: (property: Property) => void;
  onSync: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  operator,
  onClose,
  onEdit,
  onSync
}) => {
  if (!property) return null;

  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-black flex items-center justify-center text-sm font-mono shadow-md">
              2D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  {property.property_id}
                </span>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  {property.property_type}
                </span>
                {property.sync_2d_status === 'synced' && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Sincronizzato 2D (v{property.sync_2d_version})
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold font-display text-slate-900 tracking-tight truncate max-w-lg mt-0.5">
                {property.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(property);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              Modifica
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer shadow-xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Photo Gallery & Hero */}
          {property.photos && property.photos.length > 0 && (
            <div className="space-y-3">
              <div className="h-72 w-full bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200 shadow-sm">
                <img
                  src={property.photos[activePhotoIdx]?.url || property.photos[0]?.url}
                  alt={property.photos[activePhotoIdx]?.alt || property.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs text-slate-800 border border-slate-200 font-semibold shadow-xs">
                  <span className="text-amber-800 font-mono font-bold mr-1.5">ALT:</span> {property.photos[activePhotoIdx]?.alt || 'Nessun ALT'}
                </div>
              </div>

              {property.photos.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {property.photos.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                        activePhotoIdx === idx ? 'border-amber-600 ring-2 ring-amber-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={p.url}
                        alt={p.alt}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Key Facts Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Prezzo</span>
              <div className="text-base font-black text-amber-900 font-mono mt-0.5">
                € {property.price > 0 ? property.price.toLocaleString('it-IT') : 'Trattativa Riservata'}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Superficie</span>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                {property.surface_sqm} mq
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Locali / Bagni</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {property.rooms ? `${property.rooms} loc.` : '-'} {property.bathrooms ? `/ ${property.bathrooms} bagni` : ''}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Classe Energetica</span>
              <div className="text-sm font-bold text-amber-800 mt-0.5 font-mono">
                {property.energy_class || 'A2'}
              </div>
            </div>
          </div>

          {/* Location & Coordinates Breakdown */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Compass className="w-4 h-4 text-amber-700" /> Dettagli Localizzazione & Geocoding
              </h4>
              {property.location_verified ? (
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ✓ Pin Verificato dall'Operatore
                </span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                  ⚠️ In Attesa di Verifica su Mappa
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block font-bold mb-1">Indirizzo Normalizzato:</span>
                <span className="text-slate-900 font-semibold">{property.normalized_address || `${property.address_street}, ${property.address_city}`}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block font-bold mb-1">Coordinate WGS84:</span>
                <span className="text-amber-900 font-mono font-bold">
                  {property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block font-bold mb-1">Livello di Precisione:</span>
                <span className="text-slate-900 uppercase font-mono font-bold">{property.location_precision}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block font-bold mb-1">Sorgente Coordinate:</span>
                <span className="text-slate-900 uppercase font-mono font-bold">{property.location_source}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Descrizione</h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-white p-5 rounded-2xl border border-slate-200 whitespace-pre-line shadow-sm font-medium">
                {property.description}
              </p>
            </div>
          )}

          {/* SEO Details */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Sparkles className="w-4 h-4 text-amber-700" /> Configurazione SEO & Rank Math
              </h4>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                SEO Score: {property.seo_score}/100
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block font-bold mb-0.5">SEO Title:</span>
                <span className="text-slate-900 font-semibold">{property.seo_title}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block font-bold mb-0.5">Meta Description:</span>
                <span className="text-slate-700 font-medium">{property.seo_description}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block font-bold mb-0.5">Focus Keyword:</span>
                <span className="text-amber-900 font-mono font-bold">{property.seo_keyword_primary}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-5 border-t border-slate-200 bg-white flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Ultima modifica: {new Date(property.updated_at).toLocaleString('it-IT')}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Chiudi
            </button>
            {operator.role !== 'viewer' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSync(property);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold shadow-md transition hover:scale-105 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Invia al Backend 2D
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
