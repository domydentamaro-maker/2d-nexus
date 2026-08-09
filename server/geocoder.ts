import crypto from 'crypto';
import { db } from './db';
import { GeocodeResult, LocationPrecision, LocationSource } from '../src/types';

export class MultiTierGeocoder {
  /**
   * Geocode an address using the 4-tier cascade:
   * 1. SHA-256 Local Cache
   * 2. Google Geocoding API (if key available)
   * 3. Nominatim (OpenStreetMap)
   * 4. ISTAT Municipality Centroid
   */
  public async geocode(
    address: string,
    city?: string,
    province?: string
  ): Promise<GeocodeResult> {
    const rawAddress = address.trim();
    if (!rawAddress) {
      throw new Error('Indirizzo non specificato');
    }

    const hash = crypto.createHash('sha256').update(rawAddress.toLowerCase().trim()).digest('hex');

    // Tier 1: Local Cache Check
    const cached = db.findInGeocodeCache(rawAddress);
    if (cached) {
      return {
        latitude: cached.latitude,
        longitude: cached.longitude,
        formatted_address: cached.formatted_addr,
        precision: cached.precision_level,
        source: cached.source as LocationSource,
        place_id: cached.place_id,
        is_cached: true
      };
    }

    // Tier 2: Google Geocoding API
    const googleApiKey = process.env.GOOGLE_GEOCODING_API_KEY;
    if (googleApiKey && googleApiKey !== 'MY_GOOGLE_GEOCODING_API_KEY' && googleApiKey.length > 5) {
      try {
        const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          rawAddress
        )}&region=it&language=it&key=${googleApiKey}`;
        const res = await fetch(googleUrl);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const first = data.results[0];
            const lat = first.geometry.location.lat;
            const lng = first.geometry.location.lng;
            const locationType = first.geometry.location_type;

            let precision: LocationPrecision = 'street';
            if (locationType === 'ROOFTOP') precision = 'rooftop';
            else if (locationType === 'RANGE_INTERPOLATED') precision = 'building';
            else if (locationType === 'GEOMETRIC_CENTER') precision = 'locality';
            else if (locationType === 'APPROXIMATE') precision = 'approximate';

            const result: GeocodeResult = {
              latitude: lat,
              longitude: lng,
              formatted_address: first.formatted_address,
              precision,
              source: 'google_geocoding',
              place_id: first.place_id,
              is_cached: false
            };

            // Save to cache
            db.saveToGeocodeCache({
              raw_address: rawAddress,
              normalized_hash: hash,
              latitude: lat,
              longitude: lng,
              formatted_addr: first.formatted_address,
              place_id: first.place_id,
              precision_level: precision,
              source: 'google'
            });

            return result;
          }
        }
      } catch (err) {
        console.warn('Google Geocoding API attempt failed, proceeding to Nominatim fallback:', err);
      }
    }

    // Tier 3: OpenStreetMap Nominatim Fallback
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        rawAddress
      )}&countrycodes=it&addressdetails=1&limit=1`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const osmRes = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': '2D-Nexus-Real-Estate-CRM/2.0 (domenico@2dsviluppoimmobiliare.it)'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (osmRes.ok) {
        const osmData = (await osmRes.json()) as any;
        if (Array.isArray(osmData) && osmData.length > 0) {
          const first = osmData[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);

          let precision: LocationPrecision = 'street';
          if (first.type === 'house' || first.type === 'building' || first.class === 'building') {
            precision = 'building';
          } else if (first.type === 'administrative' || first.type === 'city' || first.type === 'village') {
            precision = 'locality';
          }

          const formatted = first.display_name;

          const result: GeocodeResult = {
            latitude: lat,
            longitude: lng,
            formatted_address: formatted,
            precision,
            source: 'openstreetmap',
            place_id: `osm-${first.osm_id || first.place_id}`,
            is_cached: false
          };

          db.saveToGeocodeCache({
            raw_address: rawAddress,
            normalized_hash: hash,
            latitude: lat,
            longitude: lng,
            formatted_addr: formatted,
            place_id: `osm-${first.osm_id || first.place_id}`,
            precision_level: precision,
            source: 'openstreetmap'
          });

          return result;
        }
      }
    } catch (err) {
      console.warn('Nominatim Geocoding fallback failed or timed out:', err);
    }

    // Tier 4: ISTAT Municipality Centroid (Final Deterministic Fallback)
    const territories = db.getTerritories();
    let matchedTerritory = territories.find(
      t =>
        (city && t.name.toLowerCase().includes(city.toLowerCase())) ||
        rawAddress.toLowerCase().includes(t.name.toLowerCase())
    );

    if (!matchedTerritory) {
      // Default to Monopoli (center of operations)
      matchedTerritory = territories.find(t => t.slug === 'monopoli') || territories[3];
    }

    const fallbackResult: GeocodeResult = {
      latitude: matchedTerritory.latitude,
      longitude: matchedTerritory.longitude,
      formatted_address: `${matchedTerritory.name} (${matchedTerritory.province_code || 'Puglia'}), Italia [Centroide ISTAT]`,
      precision: 'approximate',
      source: 'istat_centroid',
      place_id: `istat-${matchedTerritory.istat_code}`,
      is_cached: false
    };

    db.saveToGeocodeCache({
      raw_address: rawAddress,
      normalized_hash: hash,
      latitude: matchedTerritory.latitude,
      longitude: matchedTerritory.longitude,
      formatted_addr: fallbackResult.formatted_address,
      place_id: fallbackResult.place_id!,
      precision_level: 'approximate',
      source: 'istat_centroid'
    });

    return fallbackResult;
  }
}

export const geocoder = new MultiTierGeocoder();
