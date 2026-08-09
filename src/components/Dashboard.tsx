import React, { useState } from 'react';
import {
  Property,
  PropertyType,
  Operator,
  Territory,
  Market
} from '../types';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Send,
  Home,
  Building,
  FileSpreadsheet,
  Trees,
  Briefcase,
  MapPin,
  Eye,
  Edit3,
  Trash2,
  Sparkles,
  Compass,
  ArrowUpRight
} from 'lucide-react';

interface DashboardProps {
  properties: Property[];
  operator: Operator;
  territories: Territory[];
  markets: Market[];
  onNewProperty: (type: PropertyType) => void;
  onEditProperty: (property: Property) => void;
  onViewProperty: (property: Property) => void;
  onDeleteProperty: (id: number) => void;
  onQuickSync: (property: Property) => void;
  isSyncingId?: number | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  properties,
  operator,
  territories,
  markets,
  onNewProperty,
  onEditProperty,
  onViewProperty,
  onDeleteProperty,
  onQuickSync,
  isSyncingId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<string>('all');

  // Metrics
  const totalCount = properties.length;
  const draftCount = properties.filter(p => p.status === 'draft').length;
  const reviewCount = properties.filter(p => p.status === 'review').length;
  const readyCount = properties.filter(p => p.status === 'ready').length;
  const syncedCount = properties.filter(p => p.sync_2d_status === 'synced' || p.status === 'synced').length;
  const verifiedCount = properties.filter(p => p.location_verified).length;

  // Filter logic
  const filteredProperties = properties.filter(p => {
    if (selectedType !== 'all' && p.property_type !== selectedType) return false;
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    if (selectedVerification === 'verified' && !p.location_verified) return false;
    if (selectedVerification === 'unverified' && p.location_verified) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = p.property_id.toLowerCase().includes(q);
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchCity = p.address_city.toLowerCase().includes(q);
      const matchStreet = p.address_street.toLowerCase().includes(q);
      const matchZone = p.address_zone.toLowerCase().includes(q);
      return matchId || matchTitle || matchCity || matchStreet || matchZone;
    }

    return true;
  });

  const getTypeIcon = (type: PropertyType) => {
    switch (type) {
      case 'immobili':
        return <Home className="w-3.5 h-3.5" />;
      case 'cantieri':
        return <Building className="w-3.5 h-3.5" />;
      case 'terreno':
        return <FileSpreadsheet className="w-3.5 h-3.5" />;
      case 'terreni':
        return <Trees className="w-3.5 h-3.5" />;
      case 'operazioni':
        return <Briefcase className="w-3.5 h-3.5" />;
      default:
        return <Home className="w-3.5 h-3.5" />;
    }
  };

  const getTypeBadge = (type: PropertyType) => {
    switch (type) {
      case 'immobili':
        return 'bg-blue-50 text-blue-900 border-blue-200';
      case 'cantieri':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'terreno':
        return 'bg-purple-50 text-purple-900 border-purple-200';
      case 'terreni':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'operazioni':
        return 'bg-rose-50 text-rose-900 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status: string, syncStatus: string) => {
    if (syncStatus === 'synced') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sincronizzato 2D
        </span>
      );
    }
    if (status === 'review') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-semibold shadow-xs">
          In Revisione
        </span>
      );
    }
    if (status === 'ready') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-semibold shadow-xs">
          Pronto per Invio
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
        Bozza
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Metric KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 inset-x-0 h-1 bg-slate-300" />
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Bozze Locali</span>
          <span className="text-3xl font-black text-slate-900 mt-1.5 block font-sans tracking-tight">{draftCount}</span>
          <span className="text-xs text-slate-400 mt-1 block">In compilazione</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 inset-x-0 h-1 bg-purple-500" />
          <span className="text-xs text-purple-800 font-bold uppercase tracking-wider block">In Revisione</span>
          <span className="text-3xl font-black text-purple-950 mt-1.5 block font-sans tracking-tight">{reviewCount}</span>
          <span className="text-xs text-purple-600 mt-1 block">Da collaboratori</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
          <span className="text-xs text-amber-800 font-bold uppercase tracking-wider block">Pronte per Invio</span>
          <span className="text-3xl font-black text-amber-950 mt-1.5 block font-sans tracking-tight">{readyCount}</span>
          <span className="text-xs text-amber-700 mt-1 block">Validazione OK</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
          <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">Sincronizzate 2D</span>
          <span className="text-3xl font-black text-emerald-950 mt-1.5 block font-sans tracking-tight">{syncedCount}</span>
          <span className="text-xs text-emerald-700 mt-1 block">Nel Match Engine</span>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/90 rounded-2xl p-5 shadow-xs col-span-2 sm:col-span-1 relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-emerald-500" />
          <span className="text-xs text-amber-900 font-bold uppercase tracking-wider block">Totale Immobili</span>
          <span className="text-3xl font-black text-slate-950 mt-1.5 block font-sans tracking-tight">{totalCount}</span>
          <span className="text-xs text-emerald-800 mt-1 block font-semibold">✓ {verifiedCount} pin verificati</span>
        </div>
      </div>

      {/* Quick Inserimento Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Plus className="w-4 h-4 text-amber-600" />
            Nuova Inserimento nel Portfolio 2D:
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Seleziona la tipologia CPT per aprire il form guidato
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <button
            type="button"
            onClick={() => onNewProperty('immobili')}
            className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-blue-50/80 hover:bg-blue-100/90 text-blue-950 border border-blue-200 text-xs font-bold transition shadow-xs hover:scale-[1.02] cursor-pointer group"
          >
            <Home className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
            + Nuovo Immobile
          </button>

          <button
            type="button"
            onClick={() => onNewProperty('cantieri')}
            className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-amber-50/80 hover:bg-amber-100/90 text-amber-950 border border-amber-300 text-xs font-bold transition shadow-xs hover:scale-[1.02] cursor-pointer group"
          >
            <Building className="w-4 h-4 text-amber-700 group-hover:scale-110 transition" />
            + Nuovo Cantiere
          </button>

          <button
            type="button"
            onClick={() => onNewProperty('terreno')}
            className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-purple-50/80 hover:bg-purple-100/90 text-purple-950 border border-purple-200 text-xs font-bold transition shadow-xs hover:scale-[1.02] cursor-pointer group"
            title="Scheda Tecnica Catastale (Uso interno)"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-600 group-hover:scale-110 transition" />
            + Terreno (Tecnico)
          </button>

          <button
            type="button"
            onClick={() => onNewProperty('terreni')}
            className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-950 border border-emerald-200 text-xs font-bold transition shadow-xs hover:scale-[1.02] cursor-pointer group"
            title="Annuncio Pubblico Terreno in Vendita"
          >
            <Trees className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
            + Terreni (Annuncio)
          </button>

          <button
            type="button"
            onClick={() => onNewProperty('operazioni')}
            className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-rose-50/80 hover:bg-rose-100/90 text-rose-950 border border-rose-200 text-xs font-bold transition shadow-xs hover:scale-[1.02] cursor-pointer group col-span-2 sm:col-span-1"
          >
            <Briefcase className="w-4 h-4 text-rose-600 group-hover:scale-110 transition" />
            + Nuova Operazione
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca per codice ID (es. 2D-IMM-001), titolo, comune o zona..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-600 transition"
          >
            <option value="all">Tutti i Tipi CPT</option>
            <option value="immobili">Immobili (2D-IMM)</option>
            <option value="cantieri">Cantieri (2D-CAN)</option>
            <option value="terreno">Terreno Tecnico (2D-TER)</option>
            <option value="terreni">Terreni Annuncio (2D-TRN)</option>
            <option value="operazioni">Operazioni (2D-OPR)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-600 transition"
          >
            <option value="all">Tutti gli Stati</option>
            <option value="draft">Bozze</option>
            <option value="review">In Revisione</option>
            <option value="ready">Pronte per Invio</option>
            <option value="synced">Sincronizzate 2D</option>
          </select>

          {/* Verification Filter */}
          <select
            value={selectedVerification}
            onChange={e => setSelectedVerification(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-600 transition"
          >
            <option value="all">Tutte le Posizioni</option>
            <option value="verified">📍 Solo Posizione Verificata</option>
            <option value="unverified">⚠️ Da Verificare su Mappa</option>
          </select>
        </div>
      </div>

      {/* Properties Table / Grid */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/70">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 font-display">
            Patrimonio Immobiliare 2D
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono font-bold">
              {filteredProperties.length} di {totalCount}
            </span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {operator.role === 'viewer' ? 'Visualizzi solo i tuoi inserimenti' : 'Accesso operatore completo'}
          </span>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
              <Home className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Nessun immobile trovato</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Nessun elemento corrisponde ai filtri di ricerca. Modifica i parametri o inserisci un nuovo immobile.
            </p>
            <button
              type="button"
              onClick={() => onNewProperty('immobili')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 text-white text-xs font-bold shadow-md hover:scale-105 transition cursor-pointer"
            >
              + Inserisci Nuovo Immobile
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProperties.map(property => {
              const isSyncing = isSyncingId === property.id;
              const coverPhoto = property.photos.find(p => p.is_cover) || property.photos[0];

              return (
                <div
                  key={property.id}
                  className="p-5 hover:bg-slate-50/80 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
                >
                  {/* Left: Thumbnail + Identity */}
                  <div className="flex items-start gap-4.5 flex-1 min-w-0">
                    <div className="w-28 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative group shadow-xs">
                      {coverPhoto ? (
                        <img
                          src={coverPhoto.url}
                          alt={coverPhoto.alt || property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Home className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/90 text-slate-800 font-bold border border-slate-200 shadow-xs">
                        {property.photos.length} foto
                      </span>
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-md border border-amber-300">
                          {property.property_id}
                        </span>

                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getTypeBadge(property.property_type)}`}>
                          {getTypeIcon(property.property_type)}
                          {property.property_type.toUpperCase()}
                        </span>

                        {getStatusBadge(property.status, property.sync_2d_status)}

                        {property.sync_2d_version > 1 && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                            v{property.sync_2d_version}
                          </span>
                        )}
                      </div>

                      <h4
                        onClick={() => onViewProperty(property)}
                        className="text-base font-bold text-slate-900 group-hover:text-amber-800 cursor-pointer truncate transition font-sans"
                      >
                        {property.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          {property.address_city} {property.address_zone ? `(${property.address_zone})` : ''}
                        </span>

                        <span className="text-slate-300">•</span>

                        <span className="font-mono font-bold text-amber-800 text-sm">
                          € {property.price > 0 ? property.price.toLocaleString('it-IT') : 'Trattativa Riservata'}
                        </span>

                        <span className="text-slate-300">•</span>

                        <span className="font-medium text-slate-700">{property.surface_sqm} mq</span>

                        <span className="text-slate-300">•</span>

                        <span className="text-slate-500">
                          Operatore: <strong className="text-slate-800 font-medium">{property.created_by_name || '2D Staff'}</strong>
                        </span>
                      </div>

                      {/* Location Precision & SEO score line */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {property.location_verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Posizione Verificata ({property.location_precision.toUpperCase()})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Da verificare su mappa ({property.location_precision.toUpperCase()})
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono font-medium">
                          <Sparkles className="w-3 h-3 text-indigo-600" /> SEO Score: {property.seo_score}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onViewProperty(property)}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 border border-slate-200 transition cursor-pointer shadow-xs"
                      title="Vedi Scheda Completa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditProperty(property)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-800 hover:text-amber-900 text-xs font-bold border border-slate-200 hover:border-amber-300 transition cursor-pointer shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                      Modifica
                    </button>

                    {/* Quick Sync action button */}
                    {operator.role !== 'viewer' && (
                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={() => onQuickSync(property)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                          property.sync_2d_status === 'synced'
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white shadow-amber-600/20 hover:scale-105'
                        }`}
                        title={property.sync_2d_status === 'synced' ? 'Risincronizza con Backend 2D' : 'Invia a Backend 2D'}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isSyncing ? 'Invio...' : property.sync_2d_status === 'synced' ? 'Risincronizza' : 'Invia a 2D'}
                      </button>
                    )}

                    {/* Admin only: Delete */}
                    {operator.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Sei sicuro di voler eliminare l'immobile ${property.property_id}?`)) {
                            onDeleteProperty(property.id);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition cursor-pointer shadow-xs"
                        title="Elimina immobile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
