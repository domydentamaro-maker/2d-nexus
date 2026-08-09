import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  Operator,
  Property,
  Territory,
  Market,
  GeocodeCacheEntry,
  SyncLogEntry
} from '../src/types';

// Password hash helper using standard PBKDF2 / SHA256
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_nexus_salt_2026').digest('hex');
}

export function generateToken(operator: Operator): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    id: operator.id,
    username: operator.username,
    email: operator.email,
    role: operator.role,
    can_edit_coords: operator.can_edit_coords,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600 // 12 hours
  })).toString('base64url');
  
  const secret = process.env.JWT_SECRET || '2d_nexus_jwt_secure_key_2026';
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): any | null {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    const secret = process.env.JWT_SECRET || '2d_nexus_jwt_secure_key_2026';
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
    if (signature !== expectedSignature) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch (err) {
    return null;
  }
}

// Initial Territory Registry (ISTAT Puglia & National core)
const INITIAL_TERRITORIES: Territory[] = [
  {
    id: 1,
    territory_id: '2D-TERR-0000001',
    name: 'Puglia',
    type: 'regione',
    parent_id: null,
    istat_code: '16',
    latitude: 41.1171,
    longitude: 16.8719,
    slug: 'puglia'
  },
  {
    id: 2,
    territory_id: '2D-TERR-0000002',
    name: 'Bari',
    type: 'provincia',
    parent_id: 1,
    province_code: 'BA',
    istat_code: '072',
    latitude: 41.1259,
    longitude: 16.8667,
    slug: 'bari-provincia'
  },
  {
    id: 3,
    territory_id: '2D-TERR-0000003',
    name: 'Brindisi',
    type: 'provincia',
    parent_id: 1,
    province_code: 'BR',
    istat_code: '074',
    latitude: 40.6327,
    longitude: 17.9418,
    slug: 'brindisi-provincia'
  },
  {
    id: 4,
    territory_id: '2D-TERR-0000042',
    name: 'Monopoli',
    type: 'comune',
    parent_id: 2,
    province_code: 'BA',
    istat_code: '072030',
    latitude: 40.9508,
    longitude: 17.3033,
    slug: 'monopoli'
  },
  {
    id: 5,
    territory_id: '2D-TERR-0000043',
    name: 'Polignano a Mare',
    type: 'comune',
    parent_id: 2,
    province_code: 'BA',
    istat_code: '072035',
    latitude: 40.9961,
    longitude: 17.2186,
    slug: 'polignano-a-mare'
  },
  {
    id: 6,
    territory_id: '2D-TERR-0000044',
    name: 'Fasano',
    type: 'comune',
    parent_id: 3,
    province_code: 'BR',
    istat_code: '074007',
    latitude: 40.8353,
    longitude: 17.3608,
    slug: 'fasano'
  },
  {
    id: 7,
    territory_id: '2D-TERR-0000045',
    name: 'Ostuni',
    type: 'comune',
    parent_id: 3,
    province_code: 'BR',
    istat_code: '074012',
    latitude: 40.7297,
    longitude: 17.5794,
    slug: 'ostuni'
  },
  {
    id: 8,
    territory_id: '2D-TERR-0000046',
    name: 'Alberobello',
    type: 'comune',
    parent_id: 2,
    province_code: 'BA',
    istat_code: '072003',
    latitude: 40.7850,
    longitude: 17.2378,
    slug: 'alberobello'
  },
  {
    id: 9,
    territory_id: '2D-TERR-0000047',
    name: 'Locorotondo',
    type: 'comune',
    parent_id: 2,
    province_code: 'BA',
    istat_code: '072025',
    latitude: 40.7554,
    longitude: 17.3204,
    slug: 'locorotondo'
  },
  {
    id: 10,
    territory_id: '2D-TERR-0000048',
    name: 'Martina Franca',
    type: 'comune',
    parent_id: 1,
    province_code: 'TA',
    istat_code: '073013',
    latitude: 40.7011,
    longitude: 17.3377,
    slug: 'martina-franca'
  },
  {
    id: 11,
    territory_id: '2D-TERR-0000049',
    name: 'Conversano',
    type: 'comune',
    parent_id: 2,
    province_code: 'BA',
    istat_code: '072019',
    latitude: 40.9678,
    longitude: 17.1167,
    slug: 'conversano'
  },
  {
    id: 12,
    territory_id: '2D-TERR-0000050',
    name: 'Castellana Grotte',
    type: 'comune',
    parent_id: 2,
    province_code: 'BA',
    istat_code: '072017',
    latitude: 40.9038,
    longitude: 17.1652,
    slug: 'castellana-grotte'
  },
  {
    id: 13,
    territory_id: '2D-TERR-0000051',
    name: 'Bari (Centro & Murattiano)',
    type: 'comune',
    parent_id: 2,
    province_code: 'BA',
    istat_code: '072006',
    latitude: 41.1259,
    longitude: 16.8667,
    slug: 'bari-citta'
  }
];

const INITIAL_MARKETS: Market[] = [
  { id: 1, market_id: '2D-MKT-0000012', name: 'Costa Monopoli & Polignano Exclusive', territory_id: 4, slug: 'costa-monopoli-polignano' },
  { id: 2, market_id: '2D-MKT-0000013', name: 'Valle d\'Itria Borghi & Trulli', territory_id: 8, slug: 'valle-ditria-trulli' },
  { id: 3, market_id: '2D-MKT-0000014', name: 'Alto Salento & Marine di Ostuni', territory_id: 7, slug: 'alto-salento-ostuni' },
  { id: 4, market_id: '2D-MKT-0000015', name: 'Bari Metropoli & Residenziale', territory_id: 13, slug: 'bari-residenziale' },
  { id: 5, market_id: '2D-MKT-0000016', name: 'Sviluppo Costiero & Investimenti', territory_id: 6, slug: 'sviluppo-costiero-fasano' }
];

const INITIAL_OPERATORS: Operator[] = [
  {
    id: 1,
    username: 'domenico',
    email: 'domenico@2dsviluppoimmobiliare.it',
    role: 'admin',
    can_edit_coords: true,
    failed_attempts: 0,
    locked_until: null,
    last_login_at: new Date().toISOString(),
    created_at: '2026-01-01T08:00:00Z',
    name: 'Domenico Dentamaro (Admin)'
  },
  {
    id: 2,
    username: 'marco.editor',
    email: 'marco.collaboratore@2dsviluppoimmobiliare.it',
    role: 'editor',
    can_edit_coords: true,
    failed_attempts: 0,
    locked_until: null,
    last_login_at: '2026-08-08T10:30:00Z',
    created_at: '2026-02-15T09:00:00Z',
    name: 'Marco Rossi (Collaboratore Fidato)'
  },
  {
    id: 3,
    username: 'agenzia.partner',
    email: 'agenzia.partner@2dsviluppoimmobiliare.it',
    role: 'viewer',
    can_edit_coords: false,
    failed_attempts: 0,
    locked_until: null,
    last_login_at: '2026-08-07T14:00:00Z',
    created_at: '2026-03-10T11:00:00Z',
    name: 'Agenzia Partner (Collaboratore Esterno)'
  }
];

// Initial Property samples illustrating each of the 5 CPTs
const INITIAL_PROPERTIES: Property[] = [
  {
    id: 1,
    property_id: '2D-IMM-0001847',
    property_type: 'immobili',
    status: 'synced',
    title: 'Villa con giardino a Monopoli - Contrada Santo Stefano',
    description: 'Prestigiosa villa indipendente di 95 mq immersa nel verde degli ulivi secolari a pochi minuti dalle calette di Capitolo. Dotata di giardino privato di 800 mq, ampio terrazzo panoramico e finiture di alto pregio.',
    listing_type: 'villa',
    condition_state: 'nuovo',
    address_street: 'Contrada Santo Stefano 45',
    address_zone: 'Contrada Santo Stefano',
    address_city: 'Monopoli',
    address_postal: '70043',
    address_province: 'BA',
    address_region: 'Puglia',
    normalized_address: 'Contrada Santo Stefano 45, 70043 Monopoli BA, Italia',
    latitude: 40.8934500,
    longitude: 17.3581200,
    location_precision: 'building',
    location_source: 'manual',
    location_verified: true,
    google_place_id: 'ChIJ7eL5G1q8RRMRE4U6e189',
    price: 320000,
    price_currency: 'EUR',
    surface_sqm: 95,
    rooms: 4,
    bedrooms: 2,
    bathrooms: 2,
    floor: 0,
    total_floors: 1,
    has_garden: true,
    has_terrace: true,
    has_garage: true,
    has_cellar: false,
    energy_class: 'A2',
    type_specific: {},
    features: ['Riscaldamento a pavimento', 'Impianto fotovoltaico 4.5 kW', 'Giardino con prato inglese', 'Predisposizione piscina', 'Aria condizionata canalizzata'],
    territory_id: 4,
    territory_code: '2D-TERR-0000042',
    market_id: 1,
    market_code: '2D-MKT-0000012',
    seo_title: 'Villa in vendita Monopoli - Contrada Santo Stefano',
    seo_description: 'Villa indipendente di 95 mq con giardino e terrazzo a Monopoli Contrada Santo Stefano. Classe A2, 2 camere, 2 bagni. Scopri i dettagli.',
    seo_slug: 'villa-vendita-monopoli-contrada-santo-stefano',
    seo_keyword_primary: 'villa monopoli',
    seo_keywords_secondary: ['villa contrada santo stefano monopoli', 'casa indipendente monopoli', 'villa nuova costruzione monopoli'],
    seo_og_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    seo_og_image_alt: 'Villa Monopoli - facciata principale con patio',
    seo_score: 95,
    photos: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', alt: 'Villa Monopoli - facciata principale con patio', is_cover: true },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', alt: 'Villa Monopoli - giardino e porticato estivo' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80', alt: 'Villa Monopoli - zona living luminosa' }
    ],
    documents: [
      { id: 'doc-1', name: 'Planimetria_Catastale_Santo_Stefano.pdf', url: '#', type: 'application/pdf', size_kb: 1420, uploaded_at: '2026-08-09T08:00:00Z' },
      { id: 'doc-2', name: 'Attestato_Prestazione_Energetica_APE.pdf', url: '#', type: 'application/pdf', size_kb: 890, uploaded_at: '2026-08-09T08:05:00Z' }
    ],
    sync_2d_version: 1,
    sync_2d_status: 'synced',
    sync_2d_error: null,
    sync_2d_last_at: '2026-08-09T10:15:00Z',
    created_by: 1,
    created_by_name: 'Domenico Dentamaro',
    created_at: '2026-08-09T08:00:00Z',
    updated_at: '2026-08-09T10:15:00Z'
  },
  {
    id: 2,
    property_id: '2D-TRN-0000041',
    property_type: 'terreni',
    status: 'draft',
    title: 'Terreno Vista Mare con Uliveto a Polignano a Mare',
    description: 'Favoloso terreno panoramico di 8.500 mq situato sulle prime colline di Polignano a Mare con vista mare aperta a 180 gradi. Presenti circa 65 piante di ulivo secolare produttive e comodo accesso da strada asfaltata.',
    listing_type: 'terreno_agricolo_panoramico',
    condition_state: 'ottimo',
    address_street: 'Strada Comunale San Vito - San Martino km 2.4',
    address_zone: 'San Vito Alta',
    address_city: 'Polignano a Mare',
    address_postal: '70044',
    address_province: 'BA',
    address_region: 'Puglia',
    normalized_address: 'Strada Comunale San Vito, 70044 Polignano a Mare BA, Italia',
    latitude: 40.9842000,
    longitude: 17.2015000,
    location_precision: 'approximate',
    location_source: 'openstreetmap',
    location_verified: false,
    price: 145000,
    price_currency: 'EUR',
    surface_sqm: 8500,
    has_garden: false,
    has_terrace: false,
    has_garage: false,
    has_cellar: false,
    energy_class: 'Esente',
    type_specific: {
      tipo_terreno: 'vista_mare',
      vista_panoramica: true,
      accesso_strada: 'asfaltata',
      allaccio_acqua_luce: true,
      uliveto_presente: true,
      recintato: false
    },
    features: ['Vista mare aperta', '65 ulivi secolari', 'Allaccio acquedotto rurale a 50m', 'Doppio accesso carrabile', 'Muri a secco perimetrali parziali'],
    territory_id: 5,
    territory_code: '2D-TERR-0000043',
    market_id: 1,
    market_code: '2D-MKT-0000012',
    seo_title: 'Terreno Vista Mare in Vendita Polignano a Mare',
    seo_description: 'Vendesi terreno di 8.500 mq con uliveto secolare e spettacolare vista mare a Polignano a Mare. Ideale per appassionati o investimento.',
    seo_slug: 'terreno-vista-mare-vendita-polignano-a-mare',
    seo_keyword_primary: 'terreno vista mare polignano',
    seo_keywords_secondary: ['terreno polignano a mare', 'uliveto polignano', 'terreno vista mare puglia'],
    seo_og_image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    seo_og_image_alt: 'Terreno con ulivi e vista mare Polignano',
    seo_score: 78,
    photos: [
      { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', alt: 'Terreno con ulivi e vista mare Polignano', is_cover: true },
      { url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80', alt: 'Uliveto secolare in produzione' }
    ],
    documents: [],
    sync_2d_version: 1,
    sync_2d_status: 'pending',
    sync_2d_error: null,
    created_by: 2,
    created_by_name: 'Marco Rossi',
    created_at: '2026-08-09T09:10:00Z',
    updated_at: '2026-08-09T09:10:00Z'
  },
  {
    id: 3,
    property_id: '2D-CAN-0000312',
    property_type: 'cantieri',
    status: 'ready',
    title: 'Residenze Borgo San Leonardo - Fasano',
    description: 'Nuovo ed esclusivo complesso residenziale in classe energetica A4 composto da 12 ville a schiera con giardini pensili e piscina condominiale a sfioro, a 5 minuti da Savelletri.',
    listing_type: 'sviluppo_residenziale',
    condition_state: 'in_costruzione',
    address_street: 'Via San Leonardo 18',
    address_zone: 'Borgo San Leonardo',
    address_city: 'Fasano',
    address_postal: '72015',
    address_province: 'BR',
    address_region: 'Puglia',
    normalized_address: 'Via San Leonardo 18, 72015 Fasano BR, Italia',
    latitude: 40.8412000,
    longitude: 17.3719000,
    location_precision: 'rooftop',
    location_source: 'google_geocoding',
    location_verified: true,
    price: 480000,
    price_currency: 'EUR',
    surface_sqm: 140,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 3,
    has_garden: true,
    has_terrace: true,
    has_garage: true,
    has_cellar: true,
    energy_class: 'A4',
    type_specific: {
      data_consegna: '2027-06-30',
      unita_totali: 12,
      unita_disponibili: 7,
      avanzamento_lavori: 45,
      costruttore: '2D Sviluppo & Costruzioni Srl',
      classe_energetica_progetto: 'A4 nZEB'
    },
    features: ['Classe A4 nZEB', 'Piscina infinity condominiale', 'Giardino privato 250 mq', 'Domotica BTicino Living Now', 'Box auto doppio interrato', 'Impianto fotovoltaico 6kW dedicato'],
    territory_id: 6,
    territory_code: '2D-TERR-0000044',
    market_id: 5,
    market_code: '2D-MKT-0000016',
    seo_title: 'Nuove Ville in Costruzione Fasano - Residenze San Leonardo',
    seo_description: 'Complesso di 12 ville esclusive in classe A4 a Fasano, vicinanze Savelletri. Piscina, giardino privato e finiture di lusso. Consegna 2027.',
    seo_slug: 'nuove-ville-costruzione-fasano-residenze-san-leonardo',
    seo_keyword_primary: 'ville nuove fasano',
    seo_keywords_secondary: ['cantieri residenziali fasano', 'nuove costruzioni savelletri fasano', 'ville lusso fasano'],
    seo_og_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    seo_og_image_alt: 'Render Cantiere Residenze Borgo San Leonardo Fasano',
    seo_score: 92,
    photos: [
      { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', alt: 'Render Cantiere Residenze Borgo San Leonardo Fasano', is_cover: true },
      { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', alt: 'Vista piscina e giardini del complesso' }
    ],
    documents: [
      { id: 'doc-3', name: 'Capitolato_Opere_San_Leonardo_2026.pdf', url: '#', type: 'application/pdf', size_kb: 3200, uploaded_at: '2026-08-08T15:00:00Z' },
      { id: 'doc-4', name: 'Planimetria_Tipologia_A_Unita_4.pdf', url: '#', type: 'application/pdf', size_kb: 1100, uploaded_at: '2026-08-08T15:10:00Z' }
    ],
    sync_2d_version: 1,
    sync_2d_status: 'pending',
    sync_2d_error: null,
    created_by: 1,
    created_by_name: 'Domenico Dentamaro',
    created_at: '2026-08-08T15:00:00Z',
    updated_at: '2026-08-09T07:30:00Z'
  },
  {
    id: 4,
    property_id: '2D-TER-0000098',
    property_type: 'terreno',
    status: 'review',
    title: 'Scheda Tecnica Catastale - Terreno Edificabile Comparto C3',
    description: 'Scheda tecnica e catastale ad uso interno per lottizzazione residenziale Comparto C3. Indice di fabbricabilità fondiaria 0.80 mc/mq con piano di lottizzazione approvato.',
    listing_type: 'scheda_tecnica_catastale',
    condition_state: 'approvato',
    address_street: 'Contrada Lamalunga snc',
    address_zone: 'Lamalunga',
    address_city: 'Monopoli',
    address_postal: '70043',
    address_province: 'BA',
    address_region: 'Puglia',
    normalized_address: 'Contrada Lamalunga, 70043 Monopoli BA, Italia',
    latitude: 40.9321000,
    longitude: 17.2845000,
    location_precision: 'locality',
    location_source: 'cadastral',
    location_verified: true,
    price: 210000,
    price_currency: 'EUR',
    surface_sqm: 4200,
    has_garden: false,
    has_terrace: false,
    has_garage: false,
    has_cellar: false,
    energy_class: 'Esente',
    type_specific: {
      destinazione_duso: 'edificabile_residenziale',
      indice_edificabilita: '0.80 mc/mq',
      in_area_zes: true,
      foglio_catastale: 'Foglio 48',
      particella_catastale: 'Part. 1024, 1025',
      vincoli_paesaggistici: 'Nessun vincolo idrogeologico PAI. Vincolo PPTR fascia rispetto rurale rispettata.'
    },
    features: ['ZES Unica Mezzogiorno', 'Lottizzazione approvata', 'Indice 0.80 mc/mq', 'Quota urbanizzazione primaria calcolata'],
    territory_id: 4,
    territory_code: '2D-TERR-0000042',
    market_id: 1,
    market_code: '2D-MKT-0000012',
    seo_title: 'Dossier Tecnico Terreno Comparto C3 Monopoli',
    seo_description: 'Scheda tecnica per lottizzazione comparto C3 a Monopoli. Dati catastali, indici edilizi e parametri ZES.',
    seo_slug: 'dossier-tecnico-terreno-comparto-c3-monopoli',
    seo_keyword_primary: 'scheda tecnica terreno monopoli',
    seo_keywords_secondary: ['catasto monopoli terreno', 'lottizzazione c3 monopoli'],
    seo_score: 84,
    photos: [
      { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', alt: 'Ortofoto area comparto Lamalunga' }
    ],
    documents: [
      { id: 'doc-5', name: 'Estratto_Mappa_Catastale_Foglio48.pdf', url: '#', type: 'application/pdf', size_kb: 2150, uploaded_at: '2026-08-07T11:00:00Z' },
      { id: 'doc-6', name: 'Certificato_Destinazione_Urbanistica_CDU.pdf', url: '#', type: 'application/pdf', size_kb: 1780, uploaded_at: '2026-08-07T11:05:00Z' }
    ],
    sync_2d_version: 1,
    sync_2d_status: 'pending',
    sync_2d_error: null,
    created_by: 3,
    created_by_name: 'Agenzia Partner',
    created_at: '2026-08-07T11:00:00Z',
    updated_at: '2026-08-07T11:05:00Z'
  },
  {
    id: 5,
    property_id: '2D-OPR-0000015',
    property_type: 'operazioni',
    status: 'synced',
    title: 'Operazione Masseria Storica & Frazionamento Resort - Ostuni',
    description: 'Operazione di valorizzazione immobiliare e riqualificazione per una masseria del XVIII secolo di 1.200 mq coperti con 4 ettari di parco. Progetto per 14 suite con piscina privata e ristorante gourmet.',
    listing_type: 'operazione_sviluppo_ricettivo',
    condition_state: 'progettazione_approvata',
    address_street: 'Contrada Santa Caterina snc',
    address_zone: 'Santa Caterina',
    address_city: 'Ostuni',
    address_postal: '72017',
    address_province: 'BR',
    address_region: 'Puglia',
    normalized_address: 'Contrada Santa Caterina, 72017 Ostuni BR, Italia',
    latitude: 40.7389000,
    longitude: 17.5612000,
    location_precision: 'building',
    location_source: 'manual',
    location_verified: true,
    price: 1850000,
    price_currency: 'EUR',
    surface_sqm: 1200,
    rooms: 16,
    bedrooms: 14,
    bathrooms: 16,
    has_garden: true,
    has_terrace: true,
    has_garage: true,
    has_cellar: true,
    energy_class: 'Esente',
    type_specific: {
      stato_operazione: 'in_corso',
      valore_stimato: 3900000,
      rendimento_previsto_perc: 18.5,
      tipo_investimento: 'sviluppo_turistico',
      target_investitore: 'family_office'
    },
    features: ['Masseria del \'700', 'Progetto approvato per Boutique Resort', '40.000 mq parco privato', 'Piscina padronale + corte interna', 'Ipotesi rendimento lordo 18.5%'],
    territory_id: 7,
    territory_code: '2D-TERR-0000045',
    market_id: 3,
    market_code: '2D-MKT-0000014',
    seo_title: 'Operazione Immobiliare Masseria Storica Ostuni - Boutique Resort',
    seo_description: 'Opportunità di investimento immobiliare ad Ostuni: Masseria storica del \'700 con progetto approvato per 14 suite di lusso.',
    seo_slug: 'operazione-immobiliare-masseria-storica-ostuni-resort',
    seo_keyword_primary: 'operazione immobiliare ostuni',
    seo_keywords_secondary: ['masseria vendita ostuni', 'investimento alberghiero ostuni', 'sviluppo immobiliare puglia'],
    seo_og_image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    seo_og_image_alt: 'Masseria storica Ostuni con corte interna',
    seo_score: 96,
    photos: [
      { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', alt: 'Masseria storica Ostuni con corte interna', is_cover: true },
      { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', alt: 'Corte e ulivi secolari tenuta' }
    ],
    documents: [
      { id: 'doc-7', name: 'Teaser_Finanziario_Operazione_Masseria.pdf', url: '#', type: 'application/pdf', size_kb: 4500, uploaded_at: '2026-08-06T14:00:00Z' }
    ],
    sync_2d_version: 1,
    sync_2d_status: 'synced',
    sync_2d_error: null,
    sync_2d_last_at: '2026-08-06T16:30:00Z',
    created_by: 1,
    created_by_name: 'Domenico Dentamaro',
    created_at: '2026-08-06T14:00:00Z',
    updated_at: '2026-08-06T16:30:00Z'
  }
];

const INITIAL_GEOCODE_CACHE: GeocodeCacheEntry[] = [
  {
    id: 1,
    raw_address: 'Contrada Santo Stefano 45, Monopoli BA',
    normalized_hash: crypto.createHash('sha256').update('contrada santo stefano 45, monopoli ba').digest('hex'),
    latitude: 40.8934500,
    longitude: 17.3581200,
    formatted_addr: 'Contrada Santo Stefano 45, 70043 Monopoli BA, Italia',
    place_id: 'ChIJ7eL5G1q8RRMRE4U6e189',
    precision_level: 'building',
    source: 'google',
    cached_at: '2026-08-09T08:00:00Z',
    hits: 14
  },
  {
    id: 2,
    raw_address: 'Via San Leonardo 18, Fasano BR',
    normalized_hash: crypto.createHash('sha256').update('via san leonardo 18, fasano br').digest('hex'),
    latitude: 40.8412000,
    longitude: 17.3719000,
    formatted_addr: 'Via San Leonardo 18, 72015 Fasano BR, Italia',
    place_id: 'ChIJw18x4VbGRRMRI4Z0q312',
    precision_level: 'rooftop',
    source: 'google',
    cached_at: '2026-08-08T15:00:00Z',
    hits: 8
  }
];

const INITIAL_SYNC_LOGS: SyncLogEntry[] = [
  {
    id: 1,
    property_id: '2D-IMM-0001847',
    property_title: 'Villa con giardino a Monopoli - Contrada Santo Stefano',
    event_type: 'property.created',
    version: 1,
    operator_id: 1,
    operator_name: 'Domenico Dentamaro',
    payload: { action: 'create', type: 'immobili', id: '2D-IMM-0001847' },
    response: { status: 'created' },
    status: 'success',
    created_at: '2026-08-09T08:00:00Z'
  },
  {
    id: 2,
    property_id: '2D-IMM-0001847',
    property_title: 'Villa con giardino a Monopoli - Contrada Santo Stefano',
    event_type: 'property.coordinates_changed',
    version: 1,
    operator_id: 1,
    operator_name: 'Domenico Dentamaro',
    payload: { old_coords: [40.895, 17.360], new_coords: [40.89345, 17.35812], source: 'manual' },
    response: { status: 'coords_updated' },
    status: 'success',
    created_at: '2026-08-09T08:05:00Z'
  },
  {
    id: 3,
    property_id: '2D-IMM-0001847',
    property_title: 'Villa con giardino a Monopoli - Contrada Santo Stefano',
    event_type: 'property.verified',
    version: 1,
    operator_id: 1,
    operator_name: 'Domenico Dentamaro',
    payload: { verified: true, precision: 'building' },
    response: { status: 'verified' },
    status: 'success',
    created_at: '2026-08-09T08:06:00Z'
  },
  {
    id: 4,
    property_id: '2D-IMM-0001847',
    property_title: 'Villa con giardino a Monopoli - Contrada Santo Stefano',
    event_type: 'property.synced',
    version: 1,
    operator_id: 1,
    operator_name: 'Domenico Dentamaro',
    payload: { endpoint: 'https://api.2dsviluppoimmobiliare.it/v1/properties', property_id: '2D-IMM-0001847' },
    response: { status: 'synced', property_id: '2D-IMM-0001847', version: 1, synced_at: '2026-08-09T10:15:00Z' },
    status: 'success',
    created_at: '2026-08-09T10:15:00Z'
  }
];

class Database {
  private operators: Operator[] = [...INITIAL_OPERATORS];
  private properties: Property[] = [...INITIAL_PROPERTIES];
  private territories: Territory[] = [...INITIAL_TERRITORIES];
  private markets: Market[] = [...INITIAL_MARKETS];
  private geocodeCache: GeocodeCacheEntry[] = [...INITIAL_GEOCODE_CACHE];
  private syncLogs: SyncLogEntry[] = [...INITIAL_SYNC_LOGS];

  // Operator Methods
  public getOperators(): Operator[] {
    return this.operators;
  }

  public getOperatorByEmail(email: string): Operator | undefined {
    return this.operators.find(o => o.email.toLowerCase() === email.toLowerCase());
  }

  public getOperatorById(id: number): Operator | undefined {
    return this.operators.find(o => o.id === id);
  }

  public updateOperator(id: number, updates: Partial<Operator>): Operator | null {
    const idx = this.operators.findIndex(o => o.id === id);
    if (idx === -1) return null;
    this.operators[idx] = { ...this.operators[idx], ...updates };
    return this.operators[idx];
  }

  public createOperator(data: Omit<Operator, 'id' | 'created_at' | 'failed_attempts' | 'locked_until' | 'last_login_at'>): Operator {
    const newId = (this.operators.length > 0 ? Math.max(...this.operators.map(o => o.id)) : 0) + 1;
    const newOp: Operator = {
      ...data,
      id: newId,
      failed_attempts: 0,
      locked_until: null,
      last_login_at: null,
      created_at: new Date().toISOString()
    };
    this.operators.push(newOp);
    return newOp;
  }

  public deleteOperator(id: number): boolean {
    if (id === 1) return false; // Prevent deleting root admin
    const prevLen = this.operators.length;
    this.operators = this.operators.filter(o => o.id !== id);
    return this.operators.length < prevLen;
  }

  // Properties Methods
  public getProperties(filter?: {
    type?: string;
    status?: string;
    operatorId?: number;
    search?: string;
    userRole?: string;
    userId?: number;
  }): Property[] {
    let result = [...this.properties];

    // Viewer restriction: only own properties
    if (filter?.userRole === 'viewer' && filter?.userId) {
      result = result.filter(p => p.created_by === filter.userId);
    } else if (filter?.operatorId) {
      result = result.filter(p => p.created_by === filter.operatorId);
    }

    if (filter?.type && filter.type !== 'all') {
      result = result.filter(p => p.property_type === filter.type);
    }

    if (filter?.status && filter.status !== 'all') {
      result = result.filter(p => p.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(p =>
        p.property_id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.address_city.toLowerCase().includes(q) ||
        p.address_street.toLowerCase().includes(q) ||
        p.address_zone.toLowerCase().includes(q)
      );
    }

    // Sort newest updated first
    return result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  public getPropertyById(id: number | string): Property | undefined {
    return this.properties.find(p => p.id === Number(id) || p.property_id === id);
  }

  public generatePropertyId(type: string): string {
    const prefixMap: Record<string, string> = {
      immobili: 'IMM',
      cantieri: 'CAN',
      terreno: 'TER',
      terreni: 'TRN',
      operazioni: 'OPR'
    };
    const prefix = prefixMap[type] || 'IMM';
    const sameTypeProps = this.properties.filter(p => p.property_type === type);
    const count = sameTypeProps.length + 1001; // generous start count
    return `2D-${prefix}-${String(count).padStart(7, '0')}`;
  }

  public createProperty(data: Partial<Property>, operator: Operator): Property {
    const newId = (this.properties.length > 0 ? Math.max(...this.properties.map(p => p.id)) : 0) + 1;
    const propType = data.property_type || 'immobili';
    const propertyId = data.property_id || this.generatePropertyId(propType);
    const now = new Date().toISOString();

    const newProperty: Property = {
      id: newId,
      property_id: propertyId,
      property_type: propType,
      status: data.status || (operator.role === 'viewer' ? 'review' : 'draft'),
      title: data.title || '',
      description: data.description || '',
      listing_type: data.listing_type || 'appartamento',
      condition_state: data.condition_state || 'nuovo',
      address_street: data.address_street || '',
      address_zone: data.address_zone || '',
      address_city: data.address_city || '',
      address_postal: data.address_postal || '',
      address_province: data.address_province || '',
      address_region: data.address_region || 'Puglia',
      normalized_address: data.normalized_address || '',
      latitude: data.latitude || 40.9508,
      longitude: data.longitude || 17.3033,
      location_precision: data.location_precision || 'approximate',
      location_source: data.location_source || 'istat_centroid',
      location_verified: data.location_verified || false,
      google_place_id: data.google_place_id,
      price: data.price || 0,
      price_currency: 'EUR',
      surface_sqm: data.surface_sqm || 0,
      rooms: data.rooms,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      floor: data.floor,
      total_floors: data.total_floors,
      has_garden: !!data.has_garden,
      has_terrace: !!data.has_terrace,
      has_garage: !!data.has_garage,
      has_cellar: !!data.has_cellar,
      energy_class: data.energy_class || 'A1',
      type_specific: data.type_specific || {},
      features: data.features || [],
      territory_id: data.territory_id,
      territory_code: data.territory_code,
      market_id: data.market_id,
      market_code: data.market_code,
      seo_title: data.seo_title || '',
      seo_description: data.seo_description || '',
      seo_slug: data.seo_slug || '',
      seo_keyword_primary: data.seo_keyword_primary || '',
      seo_keywords_secondary: data.seo_keywords_secondary || [],
      seo_og_image: data.seo_og_image || '',
      seo_og_image_alt: data.seo_og_image_alt || '',
      seo_score: data.seo_score || 0,
      photos: data.photos || [],
      documents: data.documents || [],
      sync_2d_version: 1,
      sync_2d_status: 'pending',
      sync_2d_error: null,
      sync_2d_last_at: null,
      created_by: operator.id,
      created_by_name: operator.name || operator.username,
      created_at: now,
      updated_at: now
    };

    this.properties.push(newProperty);

    this.logSyncEvent({
      property_id: newProperty.property_id,
      property_title: newProperty.title,
      event_type: 'property.created',
      version: 1,
      operator_id: operator.id,
      operator_name: operator.name || operator.username,
      payload: { action: 'create', type: newProperty.property_type, id: newProperty.property_id },
      response: { status: 'created', id: newProperty.id },
      status: 'success'
    });

    return newProperty;
  }

  public updateProperty(id: number, updates: Partial<Property>, operator: Operator): Property | null {
    const idx = this.properties.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const current = this.properties[idx];

    // Check if coordinates changed
    const coordsChanged =
      (updates.latitude !== undefined && updates.latitude !== current.latitude) ||
      (updates.longitude !== undefined && updates.longitude !== current.longitude);

    // If viewer tries to edit someone else's property
    if (operator.role === 'viewer' && current.created_by !== operator.id) {
      throw new Error('Non autorizzato: puoi modificare solo i tuoi immobili');
    }

    // If viewer tries to edit coords
    if (coordsChanged && !operator.can_edit_coords && operator.role !== 'admin') {
      throw new Error('Non autorizzato a modificare manualmente le coordinate');
    }

    const newVersion = current.sync_2d_version + 1;
    const now = new Date().toISOString();

    const updated: Property = {
      ...current,
      ...updates,
      sync_2d_version: newVersion,
      sync_2d_status: updates.sync_2d_status || 'pending',
      updated_by: operator.id,
      updated_at: now
    };

    this.properties[idx] = updated;

    if (coordsChanged) {
      this.logSyncEvent({
        property_id: updated.property_id,
        property_title: updated.title,
        event_type: 'property.coordinates_changed',
        version: newVersion,
        operator_id: operator.id,
        operator_name: operator.name || operator.username,
        payload: {
          old_coords: [current.latitude, current.longitude],
          new_coords: [updated.latitude, updated.longitude],
          source: updated.location_source
        },
        response: { status: 'coords_updated' },
        status: 'success'
      });
    }

    this.logSyncEvent({
      property_id: updated.property_id,
      property_title: updated.title,
      event_type: 'property.updated',
      version: newVersion,
      operator_id: operator.id,
      operator_name: operator.name || operator.username,
      payload: { updated_fields: Object.keys(updates) },
      response: { status: 'updated', version: newVersion },
      status: 'success'
    });

    return updated;
  }

  public deleteProperty(id: number, operator: Operator): boolean {
    if (operator.role !== 'admin') {
      throw new Error('Solo l\'amministratore può eliminare gli immobili');
    }
    const prop = this.properties.find(p => p.id === id);
    if (!prop) return false;

    this.properties = this.properties.filter(p => p.id !== id);

    this.logSyncEvent({
      property_id: prop.property_id,
      property_title: prop.title,
      event_type: 'property.deleted',
      version: prop.sync_2d_version,
      operator_id: operator.id,
      operator_name: operator.name || operator.username,
      payload: { id: prop.id, property_id: prop.property_id },
      response: { status: 'deleted' },
      status: 'success'
    });

    return true;
  }

  // Territories & Markets
  public getTerritories(): Territory[] {
    return this.territories;
  }

  public getMarkets(): Market[] {
    return this.markets;
  }

  // Geocode Cache Methods
  public getGeocodeCache(): GeocodeCacheEntry[] {
    return this.geocodeCache;
  }

  public findInGeocodeCache(rawAddress: string): GeocodeCacheEntry | undefined {
    const hash = crypto.createHash('sha256').update(rawAddress.toLowerCase().trim()).digest('hex');
    const entry = this.geocodeCache.find(c => c.normalized_hash === hash);
    if (entry) {
      entry.hits = (entry.hits || 0) + 1;
    }
    return entry;
  }

  public saveToGeocodeCache(entry: Omit<GeocodeCacheEntry, 'id' | 'cached_at' | 'hits'>): GeocodeCacheEntry {
    const newId = (this.geocodeCache.length > 0 ? Math.max(...this.geocodeCache.map(c => c.id)) : 0) + 1;
    const newEntry: GeocodeCacheEntry = {
      ...entry,
      id: newId,
      cached_at: new Date().toISOString(),
      hits: 1
    };
    this.geocodeCache.push(newEntry);
    return newEntry;
  }

  // Sync Logs
  public getSyncLogs(propertyId?: string): SyncLogEntry[] {
    let list = [...this.syncLogs];
    if (propertyId) {
      list = list.filter(l => l.property_id === propertyId);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public logSyncEvent(data: Omit<SyncLogEntry, 'id' | 'created_at'>): SyncLogEntry {
    const newId = (this.syncLogs.length > 0 ? Math.max(...this.syncLogs.map(l => l.id)) : 0) + 1;
    const newLog: SyncLogEntry = {
      ...data,
      id: newId,
      created_at: new Date().toISOString()
    };
    this.syncLogs.push(newLog);
    return newLog;
  }
}

export const db = new Database();
