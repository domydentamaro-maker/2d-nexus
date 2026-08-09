import { Property, ValidationCheckItem, ValidationResult } from '../src/types';

export function validateProperty(property: Partial<Property>): ValidationResult {
  const checklist: ValidationCheckItem[] = [];

  // 1. Coordinate presenti
  const hasCoords = !!(
    property.latitude &&
    property.longitude &&
    !isNaN(Number(property.latitude)) &&
    !isNaN(Number(property.longitude)) &&
    (Math.abs(Number(property.latitude)) > 0 || Math.abs(Number(property.longitude)) > 0)
  );
  checklist.push({
    id: 'coords',
    label: 'Coordinate Geografiche',
    description: hasCoords
      ? `Coordinate valide (${Number(property.latitude).toFixed(5)}, ${Number(property.longitude).toFixed(5)})`
      : 'Coordinate mancanti. Esegui la geolocalizzazione o posiziona il pin.',
    passed: hasCoords,
    is_blocker: true
  });

  // 2. Precisione Geocoding
  const precision = property.location_precision || 'unknown';
  const isLand = property.property_type === 'terreno' || property.property_type === 'terreni';
  const precisionOk = isLand
    ? ['rooftop', 'building', 'street', 'locality'].includes(precision)
    : ['rooftop', 'building', 'street'].includes(precision);

  checklist.push({
    id: 'precision',
    label: 'Precisione Localizzazione',
    description: precisionOk
      ? `Livello di precisione adeguato (${precision.toUpperCase()})`
      : `Precisione "${precision}" insufficiente per ${property.property_type}. Sposta il pin per verificare.`,
    passed: precisionOk,
    is_blocker: !isLand // Warning for lands, Blocker for buildings
  });

  // 3. Verifica Posizione Mappa
  const isVerified = !!property.location_verified;
  checklist.push({
    id: 'verified',
    label: 'Verifica Posizione su Mappa',
    description: isVerified
      ? 'Posizione confermata dall\'operatore su mappa Leaflet'
      : 'Posizione non ancora verificata. Clicca "Conferma Posizione" o trascina il pin.',
    passed: isVerified,
    is_blocker: false // Warning, operator can force send or review
  });

  // 4. Prezzo valorizzato
  const hasPrice = typeof property.price === 'number' && property.price > 0;
  const isTechnicalTerreno = property.property_type === 'terreno';
  checklist.push({
    id: 'price',
    label: 'Prezzo Immobile',
    description: hasPrice
      ? `Prezzo indicato: € ${Number(property.price).toLocaleString('it-IT')}`
      : isTechnicalTerreno
      ? 'Prezzo opzionale per scheda tecnica catastale'
      : 'Prezzo mancante o pari a zero.',
    passed: hasPrice || isTechnicalTerreno,
    is_blocker: !isTechnicalTerreno
  });

  // 5. Superficie valorizzata
  const hasSurface = typeof property.surface_sqm === 'number' && property.surface_sqm > 0;
  checklist.push({
    id: 'surface',
    label: 'Superficie Immobile',
    description: hasSurface
      ? `Superficie: ${property.surface_sqm} mq`
      : 'Superficie non specificata o pari a zero.',
    passed: hasSurface,
    is_blocker: true
  });

  // 6. Tipologia & Comune
  const hasType = !!(property.property_type && property.listing_type);
  checklist.push({
    id: 'type',
    label: 'Tipologia e Categoria',
    description: hasType
      ? `Tipo: ${property.property_type} (${property.listing_type})`
      : 'Tipologia o categoria non definita.',
    passed: hasType,
    is_blocker: true
  });

  const hasCity = !!(property.address_city && property.address_city.trim().length > 1);
  checklist.push({
    id: 'city',
    label: 'Comune e Territorio',
    description: hasCity
      ? `Comune: ${property.address_city} (${property.address_province || 'BA'})`
      : 'Comune non specificato.',
    passed: hasCity,
    is_blocker: true
  });

  // 7. SEO Title compilato
  const hasSeoTitle = !!(property.seo_title && property.seo_title.trim().length >= 10);
  checklist.push({
    id: 'seo_title',
    label: 'Titolo SEO Ottimizzato',
    description: hasSeoTitle
      ? `Titolo SEO presente (${property.seo_title?.length} caratteri)`
      : 'Titolo SEO assente o troppo breve.',
    passed: hasSeoTitle,
    is_blocker: true
  });

  // 8. Almeno 1 foto caricata
  const hasPhotos = !!(property.photos && property.photos.length > 0);
  checklist.push({
    id: 'photos',
    label: 'Galleria Fotografica',
    description: hasPhotos
      ? `${property.photos?.length} foto caricate`
      : 'Nessuna foto caricata. Carica almeno una foto con testo ALT.',
    passed: hasPhotos,
    is_blocker: !isTechnicalTerreno
  });

  const blockers = checklist.filter(c => c.is_blocker && !c.passed);
  const warnings = checklist.filter(c => !c.is_blocker && !c.passed);
  const totalPassed = checklist.filter(c => c.passed).length;
  const score = Math.round((totalPassed / checklist.length) * 100);

  const isValid = blockers.length === 0;
  const hasBlockers = blockers.length > 0;
  const canForceSend = !hasBlockers || (blockers.length === 1 && blockers[0].id === 'precision' && isLand);

  return {
    is_valid: isValid,
    can_force_send: canForceSend,
    has_blockers: hasBlockers,
    checklist,
    score
  };
}
