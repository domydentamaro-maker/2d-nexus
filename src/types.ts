export type OperatorRole = 'admin' | 'editor' | 'viewer';

export interface Operator {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: OperatorRole;
  can_edit_coords: boolean;
  failed_attempts?: number;
  failed_login_attempts?: number;
  locked_until?: string | null;
  is_locked?: boolean;
  last_login_at?: string | null;
  created_at?: string;
  password?: string;
}

export type PropertyType = 'immobili' | 'cantieri' | 'terreno' | 'terreni' | 'operazioni';

export type PropertyStatus = 'draft' | 'review' | 'ready' | 'synced' | 'published' | 'archived';

export type LocationPrecision = 'rooftop' | 'building' | 'street' | 'locality' | 'approximate' | 'unknown';

export type LocationSource = 'google_geocoding' | 'openstreetmap' | 'manual' | 'imported' | 'cadastral' | 'istat_centroid' | 'other';

export type Sync2DStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface PropertyPhoto {
  url: string;
  alt: string;
  is_cover?: boolean;
  caption?: string;
}

export interface PropertyDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size_kb?: number;
  uploaded_at: string;
}

export interface TypeSpecificData {
  // Per 'terreno' (scheda tecnica)
  destinazione_duso?: 'agricolo' | 'edificabile_residenziale' | 'edificabile_commerciale' | 'edificabile_industriale' | 'turistico_ricettivo';
  indice_edificabilita?: string; // es. 0.03 mc/mq
  in_area_zes?: boolean;
  foglio_catastale?: string;
  particella_catastale?: string;
  vincoli_paesaggistici?: string;

  // Per 'terreni' (annuncio pubblico)
  tipo_terreno?: 'agricolo' | 'edificabile' | 'vista_mare' | 'con_trulli' | 'uliveto_secolare' | 'commerciale';
  vista_panoramica?: boolean;
  accesso_strada?: 'asfaltata' | 'sterrata' | 'vicinale' | 'principale';
  allaccio_acqua_luce?: boolean;
  uliveto_presente?: boolean;
  recintato?: boolean;

  // Per 'cantieri'
  data_consegna?: string;
  unita_totali?: number;
  unita_disponibili?: number;
  avanzamento_lavori?: number; // % 0-100
  costruttore?: string;
  classe_energetica_progetto?: string;

  // Per 'operazioni'
  stato_operazione?: 'acquisizione' | 'progettazione' | 'in_corso' | 'completata' | 'liquidazione';
  valore_stimato?: number;
  rendimento_previsto_perc?: number;
  tipo_investimento?: 'frazionamento' | 'sviluppo_turistico' | 'riqualificazione' | 'cessione_blocco';
  target_investitore?: 'retail' | 'istituzionale' | 'family_office' | 'club_deal';
}

export interface Property {
  id: number;
  property_id: string; // 2D-IMM-0001847, 2D-CAN-0000312, 2D-TER-0000098, 2D-TRN-0000041, 2D-OPR-0000015
  property_type: PropertyType;
  status: PropertyStatus;

  // Dati generali
  title: string;
  description: string;
  listing_type: string; // appartamento, villa, attico, commerciale, ecc.
  condition_state: string; // nuovo, ristrutturato, buono_stato, da_ristrutturare

  // Indirizzo raw (input operatore)
  address_street: string;
  address_zone: string; // contrada / zona
  address_city: string;
  address_postal: string;
  address_province: string;
  address_region: string;

  // Indirizzo normalizzato (da geocoding)
  normalized_address: string;

  // Coordinate
  latitude: number;
  longitude: number;
  location_precision: LocationPrecision;
  location_source: LocationSource;
  location_verified: boolean;
  google_place_id?: string;

  // Dati tecnici (comuni)
  price: number;
  price_currency: string;
  surface_sqm: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  total_floors?: number;
  has_garden: boolean;
  has_terrace: boolean;
  has_garage: boolean;
  has_cellar: boolean;
  energy_class: string;

  // Dati tecnici specifici per tipo (JSON)
  type_specific: TypeSpecificData;

  // Caratteristiche flessibili (array/object)
  features: string[];

  // Territorio e mercato
  territory_id?: number;
  territory_code?: string;
  market_id?: number;
  market_code?: string;

  // SEO
  seo_title: string;
  seo_description: string;
  seo_slug: string;
  seo_keyword_primary: string;
  seo_keywords_secondary: string[];
  seo_og_image?: string;
  seo_og_image_alt?: string;
  seo_score: number; // 0-100

  // Media
  photos: PropertyPhoto[];
  documents: PropertyDocument[];

  // Sync verso backend 2D
  sync_2d_version: number;
  sync_2d_status: Sync2DStatus;
  sync_2d_error?: string | null;
  sync_2d_last_at?: string | null;

  // Tracciamento
  created_by: number;
  created_by_name?: string;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface Territory {
  id: number;
  territory_id: string; // 2D-TERR-0000042
  name: string;
  type: 'regione' | 'provincia' | 'comune' | 'zona' | 'quartiere' | 'contrada';
  parent_id: number | null;
  parent_name?: string;
  province_code?: string;
  istat_code: string;
  latitude: number;
  longitude: number;
  slug: string;
}

export interface Market {
  id: number;
  market_id: string; // 2D-MKT-0000012
  name: string;
  territory_id: number;
  territory_name?: string;
  slug: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  precision: LocationPrecision;
  source: LocationSource;
  place_id?: string;
  is_cached?: boolean;
}

export interface GeocodeCacheEntry {
  id: number;
  raw_address: string;
  normalized_hash: string;
  latitude: number;
  longitude: number;
  formatted_addr: string;
  place_id: string;
  precision_level: LocationPrecision;
  source: string;
  cached_at: string;
  hits?: number;
}

export interface SyncLogEntry {
  id: number;
  property_id: string | number;
  property_id_str?: string;
  property_title?: string;
  action?: string;
  event_type?: string;
  version: number;
  operator_id?: number;
  operator_name?: string;
  payload?: any;
  response?: any;
  status?: 'success' | 'error';
  success?: boolean;
  message?: string;
  created_at: string;
}

export type SyncLog = SyncLogEntry;

export interface ValidationCheckItem {
  id: string;
  label: string;
  description: string;
  passed: boolean;
  is_blocker: boolean;
}

export interface ValidationResult {
  is_valid: boolean;
  can_force_send: boolean;
  has_blockers: boolean;
  checklist: ValidationCheckItem[];
  score: number;
}
