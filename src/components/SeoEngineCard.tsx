import React from 'react';
import { Sparkles, Globe, Search, Tag, RefreshCw } from 'lucide-react';
import { PropertyPhoto } from '../types';

interface SeoEngineCardProps {
  seoTitle: string;
  seoDescription: string;
  seoSlug: string;
  seoKeywordPrimary: string;
  seoKeywordsSecondary: string[];
  seoScore: number;
  photos: PropertyPhoto[];
  addressCity: string;
  listingType: string;
  onChange: (fields: {
    seo_title?: string;
    seo_description?: string;
    seo_slug?: string;
    seo_keyword_primary?: string;
    seo_keywords_secondary?: string[];
  }) => void;
  onAutoGenerate: () => void;
}

export const SeoEngineCard: React.FC<SeoEngineCardProps> = ({
  seoTitle,
  seoDescription,
  seoSlug,
  seoKeywordPrimary,
  seoKeywordsSecondary,
  seoScore,
  photos,
  addressCity,
  listingType,
  onChange,
  onAutoGenerate
}) => {
  const [newKeywordInput, setNewKeywordInput] = React.useState('');

  const coverPhoto = photos.find(p => p.is_cover) || photos[0] || {
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    alt: 'Anteprima Immobile'
  };

  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newKeywordInput.trim()) {
      e.preventDefault();
      const kw = newKeywordInput.trim().toLowerCase();
      if (!seoKeywordsSecondary.includes(kw)) {
        onChange({
          seo_keywords_secondary: [...seoKeywordsSecondary, kw]
        });
      }
      setNewKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    onChange({
      seo_keywords_secondary: seoKeywordsSecondary.filter(k => k !== kwToRemove)
    });
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) {
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        label: 'Eccellente (Pronto per Visioni & Rank Math)'
      };
    }
    if (score >= 60) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        label: 'Discreto (Ottimizzabile)'
      };
    }
    return {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      label: 'Insufficiente'
    };
  };

  const scoreBadge = getScoreBadge(seoScore);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-6">
      {/* Header with Auto-generate */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 tracking-tight flex items-center gap-2.5">
              Motore Preparazione SEO (Rank Math Ready)
              <span className={`text-xs px-3 py-0.5 rounded-full font-mono font-bold border ${scoreBadge.bg} ${scoreBadge.text} ${scoreBadge.border} shadow-xs`}>
                SEO Score: {seoScore}/100
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura i metadati per l'indicizzazione su Google e la condivisione social dell'ecosistema 2D.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAutoGenerate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-800 hover:text-amber-900 border border-slate-200 hover:border-amber-300 text-xs font-bold transition cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
          Rigenera con Formula 2D
        </button>
      </div>

      {/* Grid of Inputs & SERP Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-bold text-slate-800">
                SEO Title (Meta Title):
              </label>
              <span className={`font-mono text-xs font-bold ${seoTitle.length >= 40 && seoTitle.length <= 60 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {seoTitle.length} / 60 caratteri (consigliato: 40-60)
              </span>
            </div>
            <input
              type="text"
              value={seoTitle}
              onChange={e => onChange({ seo_title: e.target.value })}
              placeholder="es. Villa con giardino in vendita a Monopoli - Contrada Santo Stefano"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition font-medium"
            />
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-bold text-slate-800">
                Meta Description:
              </label>
              <span className={`font-mono text-xs font-bold ${seoDescription.length >= 130 && seoDescription.length <= 160 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {seoDescription.length} / 160 caratteri (consigliato: 130-155)
              </span>
            </div>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={e => onChange({ seo_description: e.target.value })}
              placeholder="Descrizione accattivante e sintetica con caratteristiche chiave per i motori di ricerca..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition leading-relaxed font-medium"
            />
          </div>

          {/* Slug URL */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              URL Slug (Permalink):
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm shadow-xs">
              <span className="text-slate-500 select-none text-xs font-mono font-semibold">visioni.2d.../immobili/</span>
              <input
                type="text"
                value={seoSlug}
                onChange={e => onChange({ seo_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="villa-vendita-monopoli-contrada-santo-stefano"
                className="w-full bg-transparent border-none text-amber-900 font-mono text-xs focus:outline-none ml-1 font-bold"
              />
            </div>
          </div>

          {/* Keywords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Keyword Primaria (Focus):
              </label>
              <input
                type="text"
                value={seoKeywordPrimary}
                onChange={e => onChange({ seo_keyword_primary: e.target.value })}
                placeholder="es. villa monopoli"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Aggiungi Keyword Secondaria:
              </label>
              <input
                type="text"
                value={newKeywordInput}
                onChange={e => setNewKeywordInput(e.target.value)}
                onKeyDown={handleAddKeyword}
                placeholder="Digita e premi Invio..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition font-medium"
              />
            </div>
          </div>

          {/* Tags pill list */}
          {seoKeywordsSecondary && seoKeywordsSecondary.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {seoKeywordsSecondary.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 font-semibold shadow-xs"
                >
                  <Tag className="w-3.5 h-3.5 text-amber-700" />
                  {kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="text-slate-400 hover:text-rose-600 transition ml-0.5 cursor-pointer font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Live SERP & Social Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-amber-700" />
            Anteprima Risultato Google:
          </div>

          {/* Google SERP Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1.5 font-sans">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-5 h-5 rounded-md bg-amber-600 flex items-center justify-center text-[10px] font-black text-white">
                2D
              </div>
              <div className="truncate">
                <span className="text-slate-800 font-semibold">2D Sviluppo Immobiliare</span>
                <span className="text-slate-400 text-xs ml-1">› immobili › {seoSlug || 'scheda'}</span>
              </div>
            </div>

            <div className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer line-clamp-1">
              {seoTitle || 'Titolo Scheda Immobile - 2D Sviluppo Immobiliare'}
            </div>

            <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-0.5">
              {seoDescription || 'Nessuna meta description definita. Inserisci una descrizione sintetica per comparire al meglio nei risultati di ricerca Google.'}
            </div>
          </div>

          {/* OpenGraph Social Card Preview */}
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pt-2">
            <Globe className="w-3.5 h-3.5 text-amber-700" />
            Anteprima Social (WhatsApp / Facebook / LinkedIn):
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-36 w-full bg-slate-100 relative">
              <img
                src={coverPhoto.url}
                alt={coverPhoto.alt || 'Cover Immobile'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-800 border border-slate-200">
                <span className="text-amber-700 mr-1 font-bold">OG:</span> {coverPhoto.alt || 'ALT text pronto'}
              </div>
            </div>
            <div className="p-3.5 space-y-1 bg-slate-50">
              <div className="text-[10px] font-mono uppercase text-amber-800 font-bold tracking-wider">
                2dsviluppoimmobiliare.it
              </div>
              <div className="text-xs font-bold text-slate-900 line-clamp-1">
                {seoTitle || 'Titolo Immobile'}
              </div>
              <div className="text-xs text-slate-500 line-clamp-1">
                {seoDescription || 'Descrizione immobile...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
