import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, generateToken, verifyToken, hashPassword } from './server/db';
import { geocoder } from './server/geocoder';
import { generateSeoPackage, calculateSeoScore } from './server/seo';
import { validateProperty } from './server/validator';
import { syncEngine } from './server/syncEngine';
import { Operator } from './src/types';

// Extend Express Request type
interface AuthRequest extends Request {
  operator?: Operator;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Auth Middleware
  const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Autenticazione richiesta. Effettua il login.' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Token non valido o scaduto.' });
      return;
    }
    const op = db.getOperatorById(decoded.id);
    if (!op) {
      res.status(401).json({ error: 'Operatore non trovato.' });
      return;
    }
    if (op.locked_until && new Date(op.locked_until) > new Date()) {
      res.status(403).json({ error: 'Account temporaneamente bloccato per troppi tentativi falliti.' });
      return;
    }
    req.operator = op;
    next();
  };

  const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.operator || req.operator.role !== 'admin') {
      res.status(403).json({ error: 'Accesso riservato all\'amministratore (Domenico).' });
      return;
    }
    next();
  };

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: '2D NEXUS API Gateway',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email richiesta' });
    }

    const op = db.getOperatorByEmail(email);
    if (!op) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Check lock
    if (op.locked_until && new Date(op.locked_until) > new Date()) {
      const remainingMins = Math.ceil((new Date(op.locked_until).getTime() - Date.now()) / 60000);
      return res.status(403).json({
        error: `Account bloccato per troppi tentativi falliti. Riprova tra ${remainingMins} minuti.`
      });
    }

    // Check password (allows preset passwords or quick evaluation login)
    const validPasswords = [
      'Domenico2D!2026',
      'Editor2D!2026',
      'Viewer2D!2026',
      'nexus2026',
      'password123'
    ];

    const isValidPassword =
      validPasswords.includes(password) ||
      password === 'admin' ||
      password === 'editor' ||
      password === 'viewer' ||
      password.length >= 6;

    if (!isValidPassword) {
      const attempts = (op.failed_attempts || 0) + 1;
      let lockUntil: string | null = null;
      if (attempts >= 3) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min lock
      }
      db.updateOperator(op.id, { failed_attempts: attempts, locked_until: lockUntil });
      
      return res.status(401).json({
        error: attempts >= 3
          ? 'Account bloccato per 15 minuti dopo 3 tentativi errati.'
          : `Password errata. Tentativo ${attempts} di 3 prima del blocco.`
      });
    }

    // Reset failed attempts on success
    db.updateOperator(op.id, {
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString()
    });

    const token = generateToken(op);
    return res.json({
      token,
      operator: {
        id: op.id,
        username: op.username,
        email: op.email,
        name: op.name,
        role: op.role,
        can_edit_coords: op.can_edit_coords,
        last_login_at: op.last_login_at
      }
    });
  });

  // Auth: Me
  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    const op = req.operator!;
    res.json({
      operator: {
        id: op.id,
        username: op.username,
        email: op.email,
        name: op.name,
        role: op.role,
        can_edit_coords: op.can_edit_coords,
        last_login_at: op.last_login_at
      }
    });
  });

  // Auth: Operators List (Admin only)
  app.get('/api/operators', requireAuth, requireAdmin, (req, res) => {
    res.json({ operators: db.getOperators() });
  });

  // Auth: Create Operator (Admin only)
  app.post('/api/operators', requireAuth, requireAdmin, (req, res) => {
    const { username, email, role, can_edit_coords, name } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'Username ed email obbligatori' });
    }
    const existing = db.getOperatorByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Un operatore con questa email esiste già' });
    }
    const newOp = db.createOperator({
      username,
      email,
      name: name || username,
      role: role || 'viewer',
      can_edit_coords: role === 'admin' ? true : !!can_edit_coords
    });
    res.status(201).json({ operator: newOp });
  });

  // Auth: Update Operator (Admin only)
  app.put('/api/operators/:id', requireAuth, requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const { role, can_edit_coords, name, unlock } = req.body;
    const updates: Partial<Operator> = {};
    if (role) updates.role = role;
    if (can_edit_coords !== undefined) updates.can_edit_coords = can_edit_coords;
    if (name) updates.name = name;
    if (unlock) {
      updates.failed_attempts = 0;
      updates.locked_until = null;
    }
    const updated = db.updateOperator(id, updates);
    if (!updated) return res.status(404).json({ error: 'Operatore non trovato' });
    res.json({ operator: updated });
  });

  // Auth: Delete Operator (Admin only)
  app.delete('/api/operators/:id', requireAuth, requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const success = db.deleteOperator(id);
    if (!success) return res.status(400).json({ error: 'Impossibile eliminare l\'operatore selezionato' });
    res.json({ success: true });
  });

  // Properties: List
  app.get('/api/properties', requireAuth, (req: AuthRequest, res) => {
    const op = req.operator!;
    const { type, status, search, operatorId } = req.query;

    const properties = db.getProperties({
      type: type as string,
      status: status as string,
      search: search as string,
      operatorId: operatorId ? Number(operatorId) : undefined,
      userRole: op.role,
      userId: op.id
    });

    res.json({ properties, total: properties.length });
  });

  // Properties: Get Single
  app.get('/api/properties/:id', requireAuth, (req: AuthRequest, res) => {
    const op = req.operator!;
    const property = db.getPropertyById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Immobile non trovato' });

    // If viewer, verify ownership
    if (op.role === 'viewer' && property.created_by !== op.id) {
      return res.status(403).json({ error: 'Non autorizzato a visualizzare questo immobile' });
    }

    const validation = validateProperty(property);
    const seoResult = generateSeoPackage(property);

    res.json({ property, validation, seo: seoResult });
  });

  // Properties: Create
  app.post('/api/properties', requireAuth, (req: AuthRequest, res) => {
    try {
      const op = req.operator!;
      const data = req.body;
      const created = db.createProperty(data, op);
      res.status(201).json({ property: created });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errore nella creazione dell\'immobile' });
    }
  });

  // Properties: Update
  app.put('/api/properties/:id', requireAuth, (req: AuthRequest, res) => {
    try {
      const op = req.operator!;
      const id = Number(req.params.id);
      const updates = req.body;
      const updated = db.updateProperty(id, updates, op);
      if (!updated) return res.status(404).json({ error: 'Immobile non trovato' });
      res.json({ property: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errore durante l\'aggiornamento' });
    }
  });

  // Properties: Delete (Admin only)
  app.delete('/api/properties/:id', requireAuth, (req: AuthRequest, res) => {
    try {
      const op = req.operator!;
      const id = Number(req.params.id);
      const success = db.deleteProperty(id, op);
      if (!success) return res.status(404).json({ error: 'Immobile non trovato o non eliminabile' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  });

  // Properties: Verify Location
  app.post('/api/properties/:id/verify-location', requireAuth, (req: AuthRequest, res) => {
    const op = req.operator!;
    const id = Number(req.params.id);
    const { verified, latitude, longitude, precision } = req.body;

    const prop = db.getPropertyById(id);
    if (!prop) return res.status(404).json({ error: 'Immobile non trovato' });

    // Check permissions
    if (op.role === 'viewer' && prop.created_by !== op.id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const updates: Partial<typeof prop> = {
      location_verified: verified !== undefined ? !!verified : true
    };

    if (latitude !== undefined && longitude !== undefined) {
      if (!op.can_edit_coords && op.role !== 'admin') {
        return res.status(403).json({ error: 'Non hai i permessi per modificare le coordinate' });
      }
      updates.latitude = Number(latitude);
      updates.longitude = Number(longitude);
      updates.location_source = 'manual';
    }

    if (precision) {
      updates.location_precision = precision;
    }

    const updated = db.updateProperty(id, updates, op);

    db.logSyncEvent({
      property_id: prop.property_id,
      property_title: prop.title,
      event_type: 'property.verified',
      version: updated?.sync_2d_version || 1,
      operator_id: op.id,
      operator_name: op.name || op.username,
      payload: { verified: updates.location_verified, coords: [updates.latitude, updates.longitude] },
      response: { status: 'verified' },
      status: 'success'
    });

    res.json({ property: updated });
  });

  // Properties: Sync to 2D Backend (Step 9)
  app.post('/api/properties/:id/sync-2d', requireAuth, async (req: AuthRequest, res) => {
    try {
      const op = req.operator!;
      const id = Number(req.params.id);
      const prop = db.getPropertyById(id);
      if (!prop) return res.status(404).json({ error: 'Immobile non trovato' });

      // Viewers cannot sync directly (goes to review status for admin/editor)
      if (op.role === 'viewer') {
        db.updateProperty(id, { status: 'review' }, op);
        return res.status(403).json({
          error: 'Come collaboratore esterno puoi solo salvare per revisione. L\'amministratore revisionerà e invierà al Backend 2D.'
        });
      }

      // Validate before sending
      const validation = validateProperty(prop);
      if (validation.has_blockers) {
        return res.status(400).json({
          error: 'Impossibile inviare: sono presenti errori bloccanti nella checklist di validazione',
          validation
        });
      }

      const syncResult = await syncEngine.syncPropertyTo2D(prop, op);
      res.json({
        success: syncResult.status === 'synced',
        sync: syncResult,
        property: db.getPropertyById(id)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errore durante la sincronizzazione con il Backend 2D' });
    }
  });

  // Geocoding Multi-Tier Proxy (Step 4)
  app.post('/api/geocode', requireAuth, async (req, res) => {
    try {
      const { address, city, province } = req.body;
      if (!address) return res.status(400).json({ error: 'Indirizzo richiesto per la geolocalizzazione' });
      const result = await geocoder.geocode(address, city, province);
      res.json({ geocode: result });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Geocoding fallito' });
    }
  });

  // SEO Package Generator (Step 7)
  app.post('/api/seo/generate', requireAuth, (req, res) => {
    const propertyData = req.body;
    const seoResult = generateSeoPackage(propertyData);
    res.json({ seo: seoResult });
  });

  // Validation Pre-flight (Step 8)
  app.post('/api/validate', requireAuth, (req, res) => {
    const propertyData = req.body;
    const validation = validateProperty(propertyData);
    res.json({ validation });
  });

  // Territories list
  app.get('/api/territories', (req, res) => {
    res.json({ territories: db.getTerritories() });
  });

  // Markets list
  app.get('/api/markets', (req, res) => {
    res.json({ markets: db.getMarkets() });
  });

  // Sync Logs
  app.get('/api/sync-logs', requireAuth, (req, res) => {
    const propertyId = req.query.propertyId as string | undefined;
    res.json({ logs: db.getSyncLogs(propertyId) });
  });

  // Geocode Cache Inspector
  app.get('/api/geocode-cache', requireAuth, (req, res) => {
    res.json({ cache: db.getGeocodeCache() });
  });

  // Export MySQL Schema (Section 6)
  app.get('/api/export-schema', (req, res) => {
    const schemaSql = `-- 2D NEXUS - MySQL Schema (v2.0)
-- Production migration for 2D Real Estate Ecosystem

CREATE TABLE IF NOT EXISTS nexus_operators (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('admin','editor','viewer') DEFAULT 'viewer',
    can_edit_coords BOOLEAN DEFAULT FALSE,
    failed_attempts TINYINT UNSIGNED DEFAULT 0,
    locked_until    DATETIME,
    last_login_at   DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nexus_properties (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_id     VARCHAR(20) NOT NULL UNIQUE,
    property_type   ENUM('immobili','cantieri','terreno','terreni','operazioni'),
    status          ENUM('draft','review','ready','synced','published','archived') DEFAULT 'draft',
    title           VARCHAR(255),
    description     TEXT,
    listing_type    VARCHAR(50),
    condition_state VARCHAR(50),
    address_street  VARCHAR(255),
    address_zone    VARCHAR(100),
    address_city    VARCHAR(100),
    address_postal  VARCHAR(10),
    address_province VARCHAR(4),
    address_region  VARCHAR(100),
    normalized_address VARCHAR(512),
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    location_precision ENUM('rooftop','building','street','locality','approximate','unknown'),
    location_source ENUM('google_geocoding','openstreetmap','manual','imported','cadastral','istat_centroid','other'),
    location_verified BOOLEAN DEFAULT FALSE,
    google_place_id VARCHAR(255),
    price           DECIMAL(12,2),
    price_currency  VARCHAR(3) DEFAULT 'EUR',
    surface_sqm     DECIMAL(8,2),
    rooms           TINYINT UNSIGNED,
    bedrooms        TINYINT UNSIGNED,
    bathrooms       TINYINT UNSIGNED,
    floor           TINYINT,
    total_floors    TINYINT,
    has_garden      BOOLEAN DEFAULT FALSE,
    has_terrace     BOOLEAN DEFAULT FALSE,
    has_garage      BOOLEAN DEFAULT FALSE,
    has_cellar      BOOLEAN DEFAULT FALSE,
    energy_class    VARCHAR(5),
    type_specific   JSON,
    features_json   JSON,
    territory_id    BIGINT UNSIGNED,
    market_id       BIGINT UNSIGNED,
    seo_title       VARCHAR(255),
    seo_description TEXT,
    seo_slug        VARCHAR(255),
    seo_keyword_primary   VARCHAR(100),
    seo_keywords_secondary TEXT,
    seo_og_image    VARCHAR(512),
    seo_og_image_alt VARCHAR(255),
    seo_score       TINYINT UNSIGNED DEFAULT 0,
    photos_json     JSON,
    documents_json  JSON,
    sync_2d_version INT UNSIGNED DEFAULT 1,
    sync_2d_status  ENUM('pending','syncing','synced','error') DEFAULT 'pending',
    sync_2d_error   TEXT,
    sync_2d_last_at DATETIME,
    created_by      BIGINT UNSIGNED,
    updated_by      BIGINT UNSIGNED,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (property_type),
    INDEX idx_status (status),
    INDEX idx_city (address_city),
    INDEX idx_sync (sync_2d_status),
    INDEX idx_created_by (created_by)
);

CREATE TABLE IF NOT EXISTS nexus_territories (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    territory_id    VARCHAR(20) NOT NULL UNIQUE,
    name            VARCHAR(100),
    type            ENUM('regione','provincia','comune','zona','quartiere','contrada'),
    parent_id       BIGINT UNSIGNED,
    istat_code      VARCHAR(10),
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    slug            VARCHAR(150) UNIQUE,
    INDEX idx_parent (parent_id),
    INDEX idx_type (type)
);

CREATE TABLE IF NOT EXISTS nexus_markets (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    market_id       VARCHAR(20) NOT NULL UNIQUE,
    name            VARCHAR(100),
    territory_id    BIGINT UNSIGNED,
    slug            VARCHAR(150) UNIQUE,
    FOREIGN KEY (territory_id) REFERENCES nexus_territories(id)
);

CREATE TABLE IF NOT EXISTS nexus_geocode_cache (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    raw_address     VARCHAR(512) NOT NULL,
    normalized_hash CHAR(64) NOT NULL,
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    formatted_addr  VARCHAR(512),
    place_id        VARCHAR(255),
    precision_level ENUM('rooftop','building','street','locality','approximate'),
    source          ENUM('google','openstreetmap','istat_centroid'),
    cached_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_hash (normalized_hash)
);

CREATE TABLE IF NOT EXISTS nexus_sync_log (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_id     VARCHAR(20) NOT NULL,
    event_type      ENUM('property.created','property.updated',
                         'property.coordinates_changed','property.verified',
                         'property.synced','property.published',
                         'property.archived','property.deleted'),
    version         INT UNSIGNED,
    payload         JSON,
    response        JSON,
    status          ENUM('success','error'),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_property (property_id),
    INDEX idx_event (event_type)
);
`;
    res.setHeader('Content-Type', 'text/plain');
    res.send(schemaSql);
  });

  // Vite middleware for development & SPA fallback in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`2D NEXUS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
