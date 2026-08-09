import React, { useState, useEffect } from 'react';
import {
  Property,
  PropertyType,
  Operator,
  Territory,
  Market,
  LocationPrecision,
  LocationSource,
  PropertyPhoto,
  PropertyDocument,
  ValidationResult
} from '../types';
import { api } from '../services/api';
import { LeafletMapPicker } from './LeafletMapPicker';
import { SeoEngineCard } from './SeoEngineCard';
import { ValidationChecklistCard } from './ValidationChecklistCard';
import {
  Home,
  Building,
  FileSpreadsheet,
  Trees,
  Briefcase,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Save,
  Trash2,
  Plus,
  Compass,
  Check,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface PropertyFormProps {
  initialProperty?: Property | null;
  defaultType?: PropertyType;
  operator: Operator;
  territories: Territory[];
  markets: Market[];
  onSaveSuccess: (property: Property) => void;
  onCancel: () => void;
}

const SAMPLE_PHOTO_LIBRARY: { label: string; url: string; alt: string }[] = [
  { label: 'Villa con Piscina & Ulivi', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', alt: 'Villa moderna con piscina e uliveto Puglia' },
  { label: 'Trullo Ristrutturato', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', alt: 'Trullo storico in pietra ristrutturato Valle d\'Itria' },
  { label: 'Terreno Vista Mare', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', alt: 'Terreno agricolo panoramico vista mare' },
  { label: 'Nuovo Cantiere Residenze', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', alt: 'Render cantiere nuove ville indipendenti' },
  { label: 'Masseria Storica & Corte', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', alt: 'Masseria storica del settecento con corte interna' },
  { label: 'Living Luminoso', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80', alt: 'Zona living con ampie vetrate panoramiche' }
];

export const PropertyForm: React.FC<PropertyFormProps> = ({
  initialProperty,
  defaultType = 'immobili',
  operator,
  territories,
  markets,
  onSaveSuccess,
  onCancel
}) => {
  const isEditing = !!initialProperty;

  const [activeTab, setActiveTab] = useState<'tipo' | 'dati' | 'indirizzo' | 'mappa' | 'media' | 'seo' | 'invio'>('tipo');

  // Form State
  const [propertyType, setPropertyType] = useState<PropertyType>(initialProperty?.property_type || defaultType);
  const [propertyId, setPropertyId] = useState<string>(initialProperty?.property_id || '');
  const [status, setStatus] = useState(initialProperty?.status || (operator.role === 'viewer' ? 'review' : 'draft'));
  
  // Dati Base
  const [title, setTitle] = useState(initialProperty?.title || '');
  const [description, setDescription] = useState(initialProperty?.description || '');
  const [listingType, setListingType] = useState(initialProperty?.listing_type || (propertyType === 'immobili' ? 'villa' : propertyType === 'terreni' ? 'vista_mare' : 'appartamento'));
  const [conditionState, setConditionState] = useState(initialProperty?.condition_state || 'nuovo');
  const [price, setPrice] = useState<number>(initialProperty?.price || 300000);
  const [surfaceSqm, setSurfaceSqm] = useState<number>(initialProperty?.surface_sqm || 100);
  const [rooms, setRooms] = useState<number | undefined>(initialProperty?.rooms || 4);
  const [bedrooms, setBedrooms] = useState<number | undefined>(initialProperty?.bedrooms || 2);
  const [bathrooms, setBathrooms] = useState<number | undefined>(initialProperty?.bathrooms || 2);
  const [floor, setFloor] = useState<number | undefined>(initialProperty?.floor || 0);
  const [totalFloors, setTotalFloors] = useState<number | undefined>(initialProperty?.total_floors || 1);
  const [hasGarden, setHasGarden] = useState<boolean>(initialProperty?.has_garden ?? true);
  const [hasTerrace, setHasTerrace] = useState<boolean>(initialProperty?.has_terrace ?? true);
  const [hasGarage, setHasGarage] = useState<boolean>(initialProperty?.has_garage ?? false);
  const [hasCellar, setHasCellar] = useState<boolean>(initialProperty?.has_cellar ?? false);
  const [energyClass, setEnergyClass] = useState<string>(initialProperty?.energy_class || 'A2');
  
  // Specific Data per Type
  const [typeSpecific, setTypeSpecific] = useState(initialProperty?.type_specific || {});

  // Caratteristiche
  const [features, setFeatures] = useState<string[]>(initialProperty?.features || [
    'Riscaldamento a pavimento',
    'Aria condizionata canalizzata',
    'Giardino privato'
  ]);
  const [newFeatureInput, setNewFeatureInput] = useState('');

  // Indirizzo
  const [addressStreet, setAddressStreet] = useState(initialProperty?.address_street || '');
  const [addressZone, setAddressZone] = useState(initialProperty?.address_zone || '');
  const [addressCity, setAddressCity] = useState(initialProperty?.address_city || 'Monopoli');
  const [addressPostal, setAddressPostal] = useState(initialProperty?.address_postal || '70043');
  const [addressProvince, setAddressProvince] = useState(initialProperty?.address_province || 'BA');
  const [addressRegion, setAddressRegion] = useState(initialProperty?.address_region || 'Puglia');
  const [normalizedAddress, setNormalizedAddress] = useState(initialProperty?.normalized_address || '');

  // Localizzazione & Mappa
  const [latitude, setLatitude] = useState<number>(initialProperty?.latitude || 40.9508);
  const [longitude, setLongitude] = useState<number>(initialProperty?.longitude || 17.3033);
  const [locationPrecision, setLocationPrecision] = useState<LocationPrecision>(initialProperty?.location_precision || 'approximate');
  const [locationSource, setLocationSource] = useState<LocationSource>(initialProperty?.location_source || 'istat_centroid');
  const [locationVerified, setLocationVerified] = useState<boolean>(initialProperty?.location_verified || false);
  const [googlePlaceId, setGooglePlaceId] = useState<string | undefined>(initialProperty?.google_place_id);

  // Territorio & Mercato
  const [territoryId, setTerritoryId] = useState<number | undefined>(initialProperty?.territory_id || 4); // Monopoli
  const [marketId, setMarketId] = useState<number | undefined>(initialProperty?.market_id || 1);

  // Media
  const [photos, setPhotos] = useState<PropertyPhoto[]>(initialProperty?.photos || [
    {
      url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      alt: 'Villa moderna con patio e giardino a Monopoli',
      is_cover: true
    }
  ]);
  const [documents, setDocuments] = useState<PropertyDocument[]>(initialProperty?.documents || []);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoAlt, setNewPhotoAlt] = useState('');

  // SEO
  const [seoTitle, setSeoTitle] = useState(initialProperty?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialProperty?.seo_description || '');
  const [seoSlug, setSeoSlug] = useState(initialProperty?.seo_slug || '');
  const [seoKeywordPrimary, setSeoKeywordPrimary] = useState(initialProperty?.seo_keyword_primary || '');
  const [seoKeywordsSecondary, setSeoKeywordsSecondary] = useState<string[]>(initialProperty?.seo_keywords_secondary || []);
  const [seoScore, setSeoScore] = useState<number>(initialProperty?.seo_score || 85);

  // Sync state
  const [sync2dVersion, setSync2dVersion] = useState<number>(initialProperty?.sync_2d_version || 1);
  const [sync2dStatus, setSync2dStatus] = useState(initialProperty?.sync_2d_status || 'pending');

  // UI state
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [geocodingFeedback, setGeocodingFeedback] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Auto-generate title & SEO on initial mount or when city/type changes
  useEffect(() => {
    if (!isEditing && !title) {
      handleAutoSeo();
    }
  }, [propertyType, addressCity, listingType]);

  // Run validation pre-flight when state changes
  useEffect(() => {
    runPreFlightValidation();
  }, [
    propertyType,
    listingType,
    price,
    surfaceSqm,
    addressCity,
    latitude,
    longitude,
    locationPrecision,
    locationVerified,
    seoTitle,
    photos
  ]);

  const runPreFlightValidation = async () => {
    try {
      const draftProperty = buildPropertyObject();
      const res = await api.validate(draftProperty);
      setValidationResult(res.validation);
    } catch (e) {
      // ignore
    }
  };

  const buildPropertyObject = (): Partial<Property> => {
    return {
      ...(initialProperty || {}),
      property_type: propertyType,
      property_id: propertyId || undefined,
      status: status as any,
      title: title || `${listingType.toUpperCase()} in ${addressCity}`,
      description,
      listing_type: listingType,
      condition_state: conditionState,
      price: Number(price),
      surface_sqm: Number(surfaceSqm),
      rooms,
      bedrooms,
      bathrooms,
      floor,
      total_floors: totalFloors,
      has_garden: hasGarden,
      has_terrace: hasTerrace,
      has_garage: hasGarage,
      has_cellar: hasCellar,
      energy_class: energyClass,
      type_specific: typeSpecific,
      features,
      address_street: addressStreet,
      address_zone: addressZone,
      address_city: addressCity,
      address_postal: addressPostal,
      address_province: addressProvince,
      address_region: addressRegion,
      normalized_address: normalizedAddress,
      latitude: Number(latitude),
      longitude: Number(longitude),
      location_precision: locationPrecision,
      location_source: locationSource,
      location_verified: locationVerified,
      google_place_id: googlePlaceId,
      territory_id: territoryId,
      market_id: marketId,
      photos,
      documents,
      seo_title: seoTitle,
      seo_description: seoDescription,
      seo_slug: seoSlug,
      seo_keyword_primary: seoKeywordPrimary,
      seo_keywords_secondary: seoKeywordsSecondary,
      seo_score: seoScore,
      sync_2d_version: sync2dVersion,
      sync_2d_status: sync2dStatus as any
    };
  };

  // City change handles territory auto-fill
  const handleCityChange = (cityName: string) => {
    setAddressCity(cityName);
    const matchedTerritory = territories.find(t => t.name.toLowerCase() === cityName.toLowerCase());
    if (matchedTerritory) {
      setTerritoryId(matchedTerritory.id);
      if (matchedTerritory.province_code) {
        setAddressProvince(matchedTerritory.province_code);
      }
      if (matchedTerritory.latitude && matchedTerritory.longitude && !locationVerified) {
        setLatitude(matchedTerritory.latitude);
        setLongitude(matchedTerritory.longitude);
        setLocationPrecision('approximate');
        setLocationSource('istat_centroid');
      }
    }
  };

  // Step 4: Multi-tier Geocoding execution
  const handleExecuteGeocode = async () => {
    const query = [
      addressStreet,
      addressZone,
      addressPostal,
      addressCity,
      addressProvince,
      'Italia'
    ]
      .filter(Boolean)
      .join(', ');

    if (!addressStreet && !addressZone && !addressCity) {
      alert('Inserisci almeno la via, la contrada o il comune per geolocalizzare.');
      return;
    }

    setIsGeocoding(true);
    setGeocodingFeedback('Interrogazione cascata 4-tier: Cache SHA-256 → Google API → Nominatim → ISTAT...');

    try {
      const res = await api.geocode(query, addressCity, addressProvince);
      const geo = res.geocode;

      setLatitude(geo.latitude);
      setLongitude(geo.longitude);
      setNormalizedAddress(geo.formatted_address);
      setLocationPrecision(geo.precision);
      setLocationSource(geo.source);
      setLocationVerified(false); // operator must visually confirm on map
      setGooglePlaceId(geo.place_id);

      const cachedTag = geo.is_cached ? ' [Cache SHA-256 Hit ⚡]' : '';
      setGeocodingFeedback(`Localizzato con successo tramite ${geo.source.toUpperCase()}${cachedTag}. Verifica il pin sulla mappa.`);
      
      // Auto move to Mappa tab
      setActiveTab('mappa');
    } catch (err: any) {
      setGeocodingFeedback(`Errore geocoding: ${err.message}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Step 7: Auto SEO calculation
  const handleAutoSeo = async () => {
    try {
      const draft = buildPropertyObject();
      const res = await api.generateSeo(draft);
      const seo = res.seo;
      setSeoTitle(seo.seo_title);
      setSeoDescription(seo.seo_description);
      setSeoSlug(seo.seo_slug);
      setSeoKeywordPrimary(seo.seo_keyword_primary);
      setSeoKeywordsSecondary(seo.seo_keywords_secondary);
      setSeoScore(seo.seo_score);
      if (!title) {
        setTitle(seo.seo_title);
      }
    } catch (err) {
      // fallback
    }
  };

  // Features tag handling
  const handleAddFeature = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newFeatureInput.trim()) {
      e.preventDefault();
      const f = newFeatureInput.trim();
      if (!features.includes(f)) {
        setFeatures([...features, f]);
      }
      setNewFeatureInput('');
    }
  };

  const handleRemoveFeature = (fToRemove: string) => {
    setFeatures(features.filter(f => f !== fToRemove));
  };

  // Photos handling
  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    const newP: PropertyPhoto = {
      url: newPhotoUrl.trim(),
      alt: newPhotoAlt.trim() || `${listingType} a ${addressCity}`,
      is_cover: photos.length === 0
    };
    setPhotos([...photos, newP]);
    setNewPhotoUrl('');
    setNewPhotoAlt('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSetCoverPhoto = (index: number) => {
    setPhotos(photos.map((p, i) => ({ ...p, is_cover: i === index })));
  };

  const handleAddSamplePhoto = (sample: typeof SAMPLE_PHOTO_LIBRARY[0]) => {
    setPhotos([...photos, { url: sample.url, alt: sample.alt, is_cover: photos.length === 0 }]);
  };

  // Save / Submit to 2D
  const handleSave = async (andSync = false) => {
    setIsSaving(true);
    setSuccessBanner(null);

    try {
      const payload = buildPropertyObject();

      let savedProp: Property;
      if (isEditing && initialProperty) {
        const res = await api.updateProperty(initialProperty.id, payload);
        savedProp = res.property;
      } else {
        const res = await api.createProperty(payload);
        savedProp = res.property;
      }

      if (andSync) {
        setIsSyncing(true);
        const syncRes = await api.syncTo2D(savedProp.id);
        savedProp = syncRes.property;
        setSuccessBanner(`✅ Immobile inviato con successo al Backend 2D! Versione: ${savedProp.sync_2d_version}`);
      } else {
        setSuccessBanner('✅ Dati salvati con successo in Nexus CRM.');
      }

      onSaveSuccess(savedProp);
    } catch (err: any) {
      alert(`Errore nel salvataggio: ${err.message}`);
    } finally {
      setIsSaving(false);
      setIsSyncing(false);
    }
  };

  const getTabBadge = (tabKey: string) => {
    switch (tabKey) {
      case 'tipo':
        return propertyType ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500';
      case 'dati':
        return price > 0 && surfaceSqm > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
      case 'indirizzo':
        return addressStreet || addressCity ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500';
      case 'mappa':
        return locationVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
      case 'media':
        return photos.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
      case 'seo':
        return seoScore >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
      case 'invio':
        return validationResult?.is_valid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 border border-slate-200 transition cursor-pointer shadow-xs"
            title="Torna alla Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300 uppercase tracking-wider">
                {propertyId || 'NUOVO IMMOBILE'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200">
                {propertyType.toUpperCase()}
              </span>
              {locationVerified && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pin Verificato
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight truncate max-w-xl mt-1">
              {isEditing ? `Modifica: ${title || 'Scheda Immobile'}` : 'Caricamento Nuovo Immobile / Terreno / Cantiere 2D'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-700" />
            Salva Bozza
          </button>
          <button
            type="button"
            disabled={isSaving || isSyncing}
            onClick={() => handleSave(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold shadow-md transition hover:scale-105 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Salva e Invia a 2D
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between text-sm shadow-sm">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-xs text-emerald-800 hover:underline cursor-pointer font-bold"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* 7-Step Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm overflow-x-auto flex items-center gap-1.5">
        {[
          { key: 'tipo', label: '1. Tipo CPT', icon: Layers },
          { key: 'dati', label: '2. Dati Base', icon: Home },
          { key: 'indirizzo', label: '3. Indirizzo', icon: MapPin },
          { key: 'mappa', label: '4 & 5. Mappa Leaflet', icon: Compass },
          { key: 'media', label: '6. Foto & Doc', icon: ImageIcon },
          { key: 'seo', label: '7. SEO Rank Math', icon: Sparkles },
          { key: 'invio', label: '8 & 9. Validazione & Invio', icon: CheckCircle2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono font-bold ${getTabBadge(tab.key)}`}>
                ●
              </span>
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: SELEZIONE TIPO (CPT) --- */}
      {activeTab === 'tipo' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">
              Passo 1: Seleziona la Tipologia di Contenuto (CPT)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Riflette esattamente i Custom Post Types esistenti nell'Ecosistema Visioni / 2D Sviluppo Immobiliare.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                type: 'immobili' as PropertyType,
                title: 'IMMOBILI',
                prefix: '2D-IMM-xxxxxxx',
                desc: 'Ville, appartamenti, attici, commerciali, trulli. Archive pubblico e matching.',
                icon: Home,
                color: 'border-blue-200 text-blue-800 bg-blue-50/80 hover:bg-blue-100'
              },
              {
                type: 'cantieri' as PropertyType,
                title: 'CANTIERI',
                prefix: '2D-CAN-xxxxxxx',
                desc: 'Progetti in costruzione, sviluppi immobiliari residenziali con unità multiple.',
                icon: Building,
                color: 'border-amber-200 text-amber-800 bg-amber-50/80 hover:bg-amber-100'
              },
              {
                type: 'terreno' as PropertyType,
                title: 'TERRENO (Tecnico)',
                prefix: '2D-TER-xxxxxxx',
                desc: 'Scheda tecnica/catastale del singolo terreno (NO archive pubblico, uso interno/dossier).',
                icon: FileSpreadsheet,
                color: 'border-purple-200 text-purple-800 bg-purple-50/80 hover:bg-purple-100'
              },
              {
                type: 'terreni' as PropertyType,
                title: 'TERRENI (Annuncio)',
                prefix: '2D-TRN-xxxxxxx',
                desc: 'Annuncio pubblico di terreno in vendita con vista panoramica/uliveto (Archive pubblico).',
                icon: Trees,
                color: 'border-emerald-200 text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100'
              },
              {
                type: 'operazioni' as PropertyType,
                title: 'OPERAZIONI',
                prefix: '2D-OPR-xxxxxxx',
                desc: 'Operazioni complesse, pacchetti d\'investimento, masserie, frazionamenti.',
                icon: Briefcase,
                color: 'border-rose-200 text-rose-800 bg-rose-50/80 hover:bg-rose-100'
              }
            ].map(item => {
              const Icon = item.icon;
              const isSelected = propertyType === item.type;
              return (
                <div
                  key={item.type}
                  onClick={() => {
                    setPropertyType(item.type);
                    if (!isEditing) {
                      setPropertyId(''); // will auto-gen on server
                    }
                  }}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-50/90 ring-2 ring-amber-600 border-amber-400 shadow-md scale-[1.02]'
                      : `${item.color} shadow-xs hover:scale-[1.01]`
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-bold shadow-xs">
                          Selezionato
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 font-sans">{item.title}</h4>
                    <span className="text-[11px] font-mono text-slate-500 block mb-2 font-bold">{item.prefix}</span>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-center gap-2.5 shadow-xs">
            <Info className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              <strong>Attenzione Differenziazione:</strong> "terreno" (scheda tecnica catastale) e "terreni" (annuncio pubblico) sono due tipologie distinte e non vanno unificate.
            </span>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('dati')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-bold shadow-md transition hover:scale-105 cursor-pointer"
            >
              Prosegui: Dati Base
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 2: DATI BASE & SPECIFICI --- */}
      {activeTab === 'dati' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 tracking-tight">
                Passo 2: Dati Base e Specifici per {propertyType.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inserisci prezzo, superficie, caratteristiche ed eventuali parametri tecnici dedicati.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-lg bg-slate-100 text-amber-900 font-mono font-bold border border-slate-200">
              Tipo: {propertyType}
            </span>
          </div>

          {/* Core Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Title */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Titolo Inserzione / Identificativo Scheda:
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="es. Villa con giardino a Monopoli - Contrada Santo Stefano"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition font-medium"
              />
            </div>

            {/* Listing Sub-type */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Tipologia Dettagliata:
              </label>
              <select
                value={listingType}
                onChange={e => setListingType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition font-medium"
              >
                {propertyType === 'immobili' && (
                  <>
                    <option value="villa">Villa Indipendente</option>
                    <option value="appartamento">Appartamento</option>
                    <option value="attico">Attico / Penthouse</option>
                    <option value="trulli_masseria">Trulli / Masseria</option>
                    <option value="commerciale">Commerciale / Locale</option>
                  </>
                )}
                {propertyType === 'cantieri' && (
                  <>
                    <option value="sviluppo_residenziale">Complesso Residenziale Ville</option>
                    <option value="palazzina_appartamenti">Nuova Palazzina Appartamenti</option>
                    <option value="resort_turistico">Sviluppo Turistico / Resort</option>
                  </>
                )}
                {propertyType === 'terreno' && (
                  <>
                    <option value="scheda_tecnica_catastale">Scheda Tecnica Catastale</option>
                    <option value="lottizzazione_comparto">Lottizzazione di Comparto</option>
                    <option value="dossier_edificatorio">Dossier Edificatorio</option>
                  </>
                )}
                {propertyType === 'terreni' && (
                  <>
                    <option value="terreno_agricolo_panoramico">Terreno Agricolo Panoramico</option>
                    <option value="terreno_edificabile_villa">Terreno Edificabile per Villa</option>
                    <option value="uliveto_secolare">Uliveto Secolare in Produzione</option>
                    <option value="terreno_vista_mare">Terreno Vista Mare</option>
                  </>
                )}
                {propertyType === 'operazioni' && (
                  <>
                    <option value="operazione_sviluppo_ricettivo">Operazione Sviluppo Ricettivo</option>
                    <option value="frazionamento_palazzo">Frazionamento Palazzo Storico</option>
                    <option value="portfolio_investimento">Portfolio / Pacchetto a Rendita</option>
                  </>
                )}
              </select>
            </div>

            {/* Condition State */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Stato di Conservazione:
              </label>
              <select
                value={conditionState}
                onChange={e => setConditionState(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition font-medium"
              >
                <option value="nuovo">Nuovo / Prima Vendita</option>
                <option value="in_costruzione">In Costruzione</option>
                <option value="ristrutturato">Completamente Ristrutturato</option>
                <option value="ottimo">Ottimo Stato</option>
                <option value="buono">Buono Stato</option>
                <option value="da_ristrutturare">Da Ristrutturare</option>
                <option value="approvato">Progetto Approvato</option>
              </select>
            </div>

            {/* Energy Class */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Classe Energetica:
              </label>
              <select
                value={energyClass}
                onChange={e => setEnergyClass(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition font-medium"
              >
                <option value="A4">A4 (nZEB)</option>
                <option value="A3">A3</option>
                <option value="A2">A2</option>
                <option value="A1">A1</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="Esente">Esente (Terreni / Ruderi)</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Prezzo Richiesto (€):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-amber-700 font-bold">€</span>
                <input
                  type="number"
                  value={price || ''}
                  onChange={e => setPrice(Number(e.target.value))}
                  placeholder="320000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-3 text-sm text-amber-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                />
              </div>
            </div>

            {/* Surface SQM */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Superficie (mq):
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={surfaceSqm || ''}
                  onChange={e => setSurfaceSqm(Number(e.target.value))}
                  placeholder="95"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                />
                <span className="absolute right-3.5 top-3.5 text-slate-400 text-xs font-mono font-bold">mq</span>
              </div>
            </div>

            {/* Rooms / Bedrooms / Bathrooms */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Locali / Camere / Bagni:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={rooms ?? ''}
                  onChange={e => setRooms(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Locali"
                  title="Locali totali"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2 py-3 text-xs text-center text-slate-900 font-bold focus:outline-none focus:border-amber-600"
                />
                <input
                  type="number"
                  value={bedrooms ?? ''}
                  onChange={e => setBedrooms(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Camere"
                  title="Camere da letto"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2 py-3 text-xs text-center text-slate-900 font-bold focus:outline-none focus:border-amber-600"
                />
                <input
                  type="number"
                  value={bathrooms ?? ''}
                  onChange={e => setBathrooms(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Bagni"
                  title="Bagni"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2 py-3 text-xs text-center text-slate-900 font-bold focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Checkboxes Accessories */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Dotazioni e Accessori:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-amber-300 transition">
                <input
                  type="checkbox"
                  checked={hasGarden}
                  onChange={e => setHasGarden(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-0"
                />
                <span className="text-xs text-slate-800 font-semibold">Giardino Privato</span>
              </label>

              <label className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-amber-300 transition">
                <input
                  type="checkbox"
                  checked={hasTerrace}
                  onChange={e => setHasTerrace(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-0"
                />
                <span className="text-xs text-slate-800 font-semibold">Terrazzo Panoramico</span>
              </label>

              <label className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-amber-300 transition">
                <input
                  type="checkbox"
                  checked={hasGarage}
                  onChange={e => setHasGarage(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-0"
                />
                <span className="text-xs text-slate-800 font-semibold">Garage / Box Auto</span>
              </label>

              <label className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-amber-300 transition">
                <input
                  type="checkbox"
                  checked={hasCellar}
                  onChange={e => setHasCellar(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-0"
                />
                <span className="text-xs text-slate-800 font-semibold">Cantina / Deposito</span>
              </label>
            </div>
          </div>

          {/* Specific Custom Section per CPT */}
          {propertyType === 'terreno' && (
            <div className="p-5 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3.5">
              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-2 font-mono">
                <FileSpreadsheet className="w-4 h-4 text-purple-700" /> Parametri Tecnici Catastali (Scheda 'Terreno')
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] text-slate-700 font-bold mb-1">Destinazione d'Uso:</label>
                  <input
                    type="text"
                    value={typeSpecific.destinazione_duso || 'edificabile_residenziale'}
                    onChange={e => setTypeSpecific({ ...typeSpecific, destinazione_duso: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-700 font-bold mb-1">Indice Edificabilità:</label>
                  <input
                    type="text"
                    value={typeSpecific.indice_edificabilita || '0.80 mc/mq'}
                    onChange={e => setTypeSpecific({ ...typeSpecific, indice_edificabilita: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-700 font-bold mb-1">Area ZES Unica:</label>
                  <select
                    value={typeSpecific.in_area_zes ? 'true' : 'false'}
                    onChange={e => setTypeSpecific({ ...typeSpecific, in_area_zes: e.target.value === 'true' })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-medium"
                  >
                    <option value="true">Sì (Inclusa in ZES)</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] text-slate-700 font-bold mb-1">Dati Catastali (Foglio e Particella):</label>
                  <input
                    type="text"
                    value={typeSpecific.foglio_catastale || 'Foglio 48, Particella 1024'}
                    onChange={e => setTypeSpecific({ ...typeSpecific, foglio_catastale: e.target.value })}
                    placeholder="es. Foglio 48, Particelle 1024, 1025"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {propertyType === 'cantieri' && (
            <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3.5">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Building className="w-4 h-4 text-amber-700" /> Parametri Cantiere & Sviluppo Immobiliare
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] text-slate-700 font-bold mb-1">Data Consegna Prevista:</label>
                  <input
                    type="date"
                    value={typeSpecific.data_consegna || '2027-06-30'}
                    onChange={e => setTypeSpecific({ ...typeSpecific, data_consegna: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-700 font-bold mb-1">Unità Totali / Disponibili:</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={typeSpecific.unita_totali || 12}
                      onChange={e => setTypeSpecific({ ...typeSpecific, unita_totali: Number(e.target.value) })}
                      placeholder="Totali"
                      className="w-1/2 bg-white border border-slate-300 rounded-xl px-2.5 py-2.5 text-xs text-slate-900 text-center font-bold"
                    />
                    <input
                      type="number"
                      value={typeSpecific.unita_disponibili || 7}
                      onChange={e => setTypeSpecific({ ...typeSpecific, unita_disponibili: Number(e.target.value) })}
                      placeholder="Disp."
                      className="w-1/2 bg-white border border-slate-300 rounded-xl px-2.5 py-2.5 text-xs text-amber-900 text-center font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-700 font-bold mb-1">Avanzamento Lavori (%):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={typeSpecific.avanzamento_lavori ?? 45}
                    onChange={e => setTypeSpecific({ ...typeSpecific, avanzamento_lavori: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {propertyType === 'operazioni' && (
            <div className="p-5 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-3.5">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Briefcase className="w-4 h-4 text-rose-700" /> Dati Economici Operazione Complessa
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] text-slate-700 font-bold mb-1">Valore Stimato a Regime (€):</label>
                  <input
                    type="number"
                    value={typeSpecific.valore_stimato || 3900000}
                    onChange={e => setTypeSpecific({ ...typeSpecific, valore_stimato: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-amber-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-700 font-bold mb-1">Rendimento Previsto (% Lordo):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={typeSpecific.rendimento_previsto_perc || 18.5}
                    onChange={e => setTypeSpecific({ ...typeSpecific, rendimento_previsto_perc: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-emerald-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-700 font-bold mb-1">Target Investitore:</label>
                  <select
                    value={typeSpecific.target_investitore || 'family_office'}
                    onChange={e => setTypeSpecific({ ...typeSpecific, target_investitore: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium"
                  >
                    <option value="family_office">Family Office</option>
                    <option value="istituzionale">Fondo Istituzionale</option>
                    <option value="club_deal">Club Deal</option>
                    <option value="retail">Investitore Privato Retail</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Descrizione Completa Scheda:
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrivi dettagliatamente l'immobile, la posizione, le finiture e le potenzialità..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 leading-relaxed font-medium"
            />
          </div>

          {/* Features Tagging */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Caratteristiche & Tag (Premi Invio per aggiungere):
            </label>
            <div className="flex gap-2.5 mb-3">
              <input
                type="text"
                value={newFeatureInput}
                onChange={e => setNewFeatureInput(e.target.value)}
                onKeyDown={handleAddFeature}
                placeholder="es. Impianto fotovoltaico 6kW, Piscina a sfioro, Vista mare aperta..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-medium"
              />
              <button
                type="button"
                onClick={() => {
                  if (newFeatureInput.trim() && !features.includes(newFeatureInput.trim())) {
                    setFeatures([...features, newFeatureInput.trim()]);
                    setNewFeatureInput('');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition cursor-pointer"
              >
                Aggiungi
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {features.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 font-semibold shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 text-amber-700" />
                  {f}
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(f)}
                    className="text-slate-400 hover:text-rose-600 ml-1 transition cursor-pointer font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('tipo')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Indietro
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('indirizzo')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-bold shadow-md transition hover:scale-105 cursor-pointer"
            >
              Prosegui: Indirizzo & Territorio
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 3: INDIRIZZO & TERRITORIO --- */}
      {activeTab === 'indirizzo' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 tracking-tight">
              Passo 3: Indirizzo e Territorio ISTAT
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inserisci la via, la contrada o la zona. Il sistema comporrà la stringa per la geolocalizzazione automatica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Street */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Via / Piazza e Numero Civico:
              </label>
              <input
                type="text"
                value={addressStreet}
                onChange={e => setAddressStreet(e.target.value)}
                placeholder="es. Contrada Santo Stefano 45 oppure Via San Leonardo 18"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition font-medium"
              />
            </div>

            {/* Contrada / Zona */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Zona / Contrada (Cruciale in Puglia):
              </label>
              <input
                type="text"
                value={addressZone}
                onChange={e => setAddressZone(e.target.value)}
                placeholder="es. Contrada Santo Stefano, Capitolo, Lamalunga..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition font-medium"
              />
            </div>

            {/* City Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Comune (Registro Territori ISTAT):
              </label>
              <select
                value={addressCity}
                onChange={e => handleCityChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition font-medium"
              >
                {territories
                  .filter(t => t.type === 'comune')
                  .map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.province_code || 'Puglia'}) - ISTAT {c.istat_code}
                    </option>
                  ))}
              </select>
            </div>

            {/* CAP */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                CAP:
              </label>
              <input
                type="text"
                value={addressPostal}
                onChange={e => setAddressPostal(e.target.value)}
                placeholder="70043"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition font-medium"
              />
            </div>

            {/* Province & Region */}
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Provincia:</label>
                <input
                  type="text"
                  value={addressProvince}
                  onChange={e => setAddressProvince(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-sm text-slate-900 font-mono text-center font-bold"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Regione:</label>
                <input
                  type="text"
                  value={addressRegion}
                  onChange={e => setAddressRegion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-sm text-slate-900 font-mono text-center font-bold"
                />
              </div>
            </div>

            {/* Real Estate Market Selection */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Associazione al Mercato Immobiliare 2D:
              </label>
              <select
                value={marketId}
                onChange={e => setMarketId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition font-medium"
              >
                {markets.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.market_id} — {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Composed Address Display & Geocode Trigger */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="text-xs text-slate-700 font-bold flex items-center justify-between">
              <span>Indirizzo Composto per Geolocalizzazione:</span>
              <span className="font-mono text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300">Step 4 — Geocoding Engine</span>
            </div>

            <div className="font-mono text-sm text-amber-950 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs font-bold">
              {[addressStreet, addressZone, `${addressPostal} ${addressCity} ${addressProvince}`, 'Italia']
                .filter(Boolean)
                .join(', ')}
            </div>

            {geocodingFeedback && (
              <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-xs">
                <Compass className="w-4 h-4 text-amber-700 animate-spin shrink-0" />
                <span>{geocodingFeedback}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isGeocoding}
              onClick={handleExecuteGeocode}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold text-xs shadow-md transition hover:scale-[1.01] cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              {isGeocoding ? 'Localizzazione in corso...' : 'Avvia Geolocalizzazione Multi-Tier (Google → Nominatim → ISTAT)'}
            </button>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('dati')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Indietro
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mappa')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-bold shadow-md transition hover:scale-105 cursor-pointer"
            >
              Prosegui: Mappa Leaflet
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 4 & 5: MAPPA LEAFLET & VERIFICA PIN --- */}
      {activeTab === 'mappa' && (
        <div className="space-y-6">
          <LeafletMapPicker
            latitude={latitude}
            longitude={longitude}
            precision={locationPrecision}
            source={locationSource}
            verified={locationVerified}
            canEditCoords={operator.can_edit_coords || operator.role === 'admin'}
            addressLabel={[addressStreet, addressZone, addressCity].filter(Boolean).join(', ')}
            onCoordinatesChange={(lat, lng, src) => {
              setLatitude(lat);
              setLongitude(lng);
              setLocationSource(src);
              setLocationVerified(true);
            }}
            onVerifyToggle={verif => setLocationVerified(verif)}
          />

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('indirizzo')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Indietro
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-bold shadow-md transition hover:scale-105 cursor-pointer"
            >
              Prosegui: Media & Foto
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 6: FOTO & DOCUMENTI --- */}
      {activeTab === 'media' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 tracking-tight">
                Passo 6: Galleria Fotografica & Documenti
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Carica le immagini con il testo ALT descrittivo (obbligatorio per SEO Rank Math).
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-lg bg-slate-100 text-amber-900 font-mono font-bold border border-slate-200">
              {photos.length} Foto Caricate
            </span>
          </div>

          {/* Preset Photo Populator */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              Libreria Foto Tipiche Puglia 2D (Inserimento Rapido per Test):
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {SAMPLE_PHOTO_LIBRARY.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddSamplePhoto(sample)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-950 text-xs border border-slate-200 hover:border-amber-300 transition flex items-center gap-1.5 cursor-pointer font-bold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add Photo Form */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">URL Immagine:</label>
              <input
                type="url"
                value={newPhotoUrl}
                onChange={e => setNewPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-medium"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Testo ALT (SEO):</label>
              <input
                type="text"
                value={newPhotoAlt}
                onChange={e => setNewPhotoAlt(e.target.value)}
                placeholder="es. Villa Monopoli facciata principale"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-medium"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <button
                type="button"
                onClick={handleAddPhoto}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Aggiungi
              </button>
            </div>
          </div>

          {/* Photo Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((p, idx) => (
              <div
                key={idx}
                className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs group hover:border-amber-400 transition"
              >
                <div className="h-44 w-full bg-slate-100">
                  <img
                    src={p.url}
                    alt={p.alt || 'Foto Immobile'}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-3.5 space-y-1.5 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500 font-bold">Foto #{idx + 1}</span>
                    {p.is_cover ? (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-bold shadow-xs">
                        Copertina (OG Image)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetCoverPhoto(idx)}
                        className="text-[10px] text-amber-800 hover:text-amber-950 font-bold transition cursor-pointer"
                      >
                        Imposta come Copertina
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-700 truncate font-medium" title={p.alt}>
                    <strong className="text-slate-400 text-[10px]">ALT:</strong> {p.alt || 'Nessun ALT'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-white/90 text-slate-600 hover:text-rose-600 border border-slate-200 backdrop-blur transition cursor-pointer shadow-xs"
                  title="Rimuovi foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('mappa')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Indietro
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-bold shadow-md transition hover:scale-105 cursor-pointer"
            >
              Prosegui: Preparazione SEO
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 7: SEO RANK MATH --- */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <SeoEngineCard
            seoTitle={seoTitle}
            seoDescription={seoDescription}
            seoSlug={seoSlug}
            seoKeywordPrimary={seoKeywordPrimary}
            seoKeywordsSecondary={seoKeywordsSecondary}
            seoScore={seoScore}
            photos={photos}
            addressCity={addressCity}
            listingType={listingType}
            onChange={fields => {
              if (fields.seo_title !== undefined) setSeoTitle(fields.seo_title);
              if (fields.seo_description !== undefined) setSeoDescription(fields.seo_description);
              if (fields.seo_slug !== undefined) setSeoSlug(fields.seo_slug);
              if (fields.seo_keyword_primary !== undefined) setSeoKeywordPrimary(fields.seo_keyword_primary);
              if (fields.seo_keywords_secondary !== undefined) setSeoKeywordsSecondary(fields.seo_keywords_secondary);
            }}
            onAutoGenerate={handleAutoSeo}
          />

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Indietro
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invio')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-bold shadow-md transition hover:scale-105 cursor-pointer"
            >
              Prosegui: Validazione & Invio a 2D
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 8 & 9: VALIDAZIONE PRE-INVIO & INVIO A BACKEND 2D --- */}
      {activeTab === 'invio' && validationResult && (
        <div className="space-y-6">
          <ValidationChecklistCard
            validation={validationResult}
            property={buildPropertyObject() as Property}
            operator={operator}
            isSyncing={isSyncing}
            onSync={() => handleSave(true)}
          />

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Indietro
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 text-xs font-bold shadow-xs cursor-pointer transition hover:border-amber-400"
            >
              <Save className="w-4 h-4 text-amber-700" />
              Salva Tutto come Bozza Locale
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
