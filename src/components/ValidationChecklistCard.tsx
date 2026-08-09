import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Loader2,
  ShieldCheck,
  Code2,
  ArrowRight
} from 'lucide-react';
import { ValidationResult, Property, Operator } from '../types';

interface ValidationChecklistCardProps {
  validation: ValidationResult;
  property: Property;
  operator: Operator;
  isSyncing: boolean;
  onSync: () => void;
  onFixStep?: (stepName: string) => void;
}

export const ValidationChecklistCard: React.FC<ValidationChecklistCardProps> = ({
  validation,
  property,
  operator,
  isSyncing,
  onSync
}) => {
  const [showPayloadPreview, setShowPayloadPreview] = React.useState(false);

  const isViewer = operator.role === 'viewer';

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 tracking-tight flex items-center gap-2.5">
              Validazione Pre-Invio & Checklist Ecosistema 2D
              <span className={`text-xs px-3 py-0.5 rounded-full font-mono font-bold border shadow-xs ${
                validation.is_valid
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {validation.score}% Completezza Dati
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verifica automatica dei requisiti prima della sincronizzazione con il Backend 2D e la pubblicazione su Visioni.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPayloadPreview(!showPayloadPreview)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono border border-slate-200 transition cursor-pointer shadow-xs"
        >
          <Code2 className="w-3.5 h-3.5 text-amber-700" />
          {showPayloadPreview ? 'Nascondi Payload JSON' : 'Ispeziona Payload API'}
        </button>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {validation.checklist.map(item => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border flex items-start gap-3.5 transition shadow-xs ${
              item.passed
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : item.is_blocker
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {item.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : item.is_blocker ? (
                <XCircle className="w-4 h-4 text-rose-600 animate-pulse" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 truncate">{item.label}</span>
                {!item.passed && item.is_blocker && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    Bloccante
                  </span>
                )}
                {!item.passed && !item.is_blocker && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Warning
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* JSON Payload Inspector Drawer */}
      {showPayloadPreview && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-amber-800 font-bold">POST /v1/properties (Authorization: Bearer NEXUS_API_KEY)</span>
            <span className="text-xs font-mono text-slate-400">Contract v2.0</span>
          </div>
          <pre className="bg-white p-4 rounded-xl text-xs font-mono text-slate-800 overflow-x-auto max-h-64 leading-tight border border-slate-200 shadow-xs">
            {JSON.stringify(
              {
                property_id: property.property_id,
                property_type: property.property_type,
                status: 'ready',
                title: property.title,
                listing_type: property.listing_type,
                condition_state: property.condition_state,
                price: property.price,
                surface_sqm: property.surface_sqm,
                rooms: property.rooms,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                has_garden: property.has_garden,
                has_terrace: property.has_terrace,
                energy_class: property.energy_class,
                location: {
                  latitude: property.latitude,
                  longitude: property.longitude,
                  precision: property.location_precision,
                  source: property.location_source,
                  verified: property.location_verified,
                  place_id: property.google_place_id
                },
                address: {
                  street: property.address_street,
                  city: property.address_city,
                  province: property.address_province,
                  postal: property.address_postal,
                  zone: property.address_zone,
                  normalized: property.normalized_address
                },
                seo: {
                  title: property.seo_title,
                  description: property.seo_description,
                  slug: property.seo_slug,
                  primary_keyword: property.seo_keyword_primary,
                  secondary_keywords: property.seo_keywords_secondary
                },
                photos: (property.photos || []).map(p => ({ url: p.url, alt: p.alt })),
                version: property.sync_2d_version || 1
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* Sync Trigger Action Banner */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
            {property.sync_2d_status === 'synced' ? (
              <span className="text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Immobile Già Sincronizzato con il Backend 2D (v{property.sync_2d_version})
              </span>
            ) : isViewer ? (
              <span className="text-amber-900">
                Invia in Revisione all'Amministratore
              </span>
            ) : validation.is_valid ? (
              <span className="text-emerald-800">
                Tutti i requisiti soddisfatti. Pronto per la sincronizzazione!
              </span>
            ) : validation.can_force_send ? (
              <span className="text-amber-900">
                Presenti warning non bloccanti. Puoi procedere all'invio.
              </span>
            ) : (
              <span className="text-rose-800">
                Correggi gli errori bloccanti evidenziati in rosso prima di inviare.
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isViewer
              ? 'Come collaboratore, la scheda verrà revisionata da Domenico prima del passaggio al motore 2D.'
              : 'L\'invio aggiornerà automaticamente il Match Engine e la scheda Visioni WordPress.'}
          </p>
        </div>

        <button
          type="button"
          disabled={isSyncing || (!validation.is_valid && !validation.can_force_send && !isViewer)}
          onClick={onSync}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
            isSyncing
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : !validation.is_valid && !validation.can_force_send && !isViewer
              ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              : isViewer
              ? 'bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white hover:scale-105'
              : 'bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white hover:scale-105'
          }`}
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sincronizzazione in corso...
            </>
          ) : isViewer ? (
            <>
              <Send className="w-4 h-4" />
              Salva e Invia per Revisione
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Invia al Backend 2D
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
