import { Property } from '../src/types';

export interface SeoGenerationResult {
  seo_title: string;
  seo_description: string;
  seo_slug: string;
  seo_keyword_primary: string;
  seo_keywords_secondary: string[];
  seo_score: number;
  recommendations: string[];
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function generateSeoPackage(property: Partial<Property>): SeoGenerationResult {
  const typeMap: Record<string, string> = {
    immobili: property.listing_type ? property.listing_type.replace('_', ' ') : 'Immobile',
    cantieri: 'Nuove Costruzioni e Ville',
    terreno: 'Dossier Tecnico Terreno',
    terreni: 'Terreno in Vendita',
    operazioni: 'Operazione Immobiliare'
  };

  const typeName = typeMap[property.property_type || 'immobili'] || 'Immobile';
  const city = property.address_city || 'Puglia';
  const zone = property.address_zone ? ` - ${property.address_zone}` : '';
  const surface = property.surface_sqm ? ` di ${property.surface_sqm} mq` : '';
  const mainFeature = property.features && property.features.length > 0 ? ` con ${property.features[0].toLowerCase()}` : '';

  // Title formula
  let generatedTitle = `${typeName.charAt(0).toUpperCase() + typeName.slice(1)} in Vendita a ${city}${zone}`;
  if (generatedTitle.length > 60) {
    generatedTitle = `${typeName.charAt(0).toUpperCase() + typeName.slice(1)} in Vendita ${city}${zone}`.slice(0, 60);
  }

  // Meta description formula (~155 chars)
  let generatedDesc = `${typeName.charAt(0).toUpperCase() + typeName.slice(1)} in vendita a ${city}${surface}${mainFeature}. Dati verificati da 2D Sviluppo Immobiliare. Contatta per info e dettagli.`;
  if (generatedDesc.length > 158) {
    generatedDesc = generatedDesc.slice(0, 155) + '...';
  }

  // Primary keyword
  const primaryKw = `${typeName.toLowerCase()} ${city.toLowerCase()}`.replace(/  +/g, ' ');

  // Secondary keywords
  const secondaryKws = [
    `${typeName.toLowerCase()} in vendita ${city.toLowerCase()}`,
    `${city.toLowerCase()} ${property.address_province ? property.address_province.toLowerCase() : 'puglia'} immobili`,
    property.address_zone ? `${typeName.toLowerCase()} ${property.address_zone.toLowerCase()}` : `case in vendita ${city.toLowerCase()}`
  ];

  // Slug
  const generatedSlug = slugify(`${typeName}-vendita-${city}${property.address_zone ? '-' + property.address_zone : ''}`);

  // Calculate SEO Score
  const { score, recommendations } = calculateSeoScore({
    title: property.seo_title || generatedTitle,
    description: property.seo_description || generatedDesc,
    slug: property.seo_slug || generatedSlug,
    primaryKeyword: property.seo_keyword_primary || primaryKw,
    photos: property.photos || []
  });

  return {
    seo_title: property.seo_title || generatedTitle,
    seo_description: property.seo_description || generatedDesc,
    seo_slug: property.seo_slug || generatedSlug,
    seo_keyword_primary: property.seo_keyword_primary || primaryKw,
    seo_keywords_secondary: property.seo_keywords_secondary && property.seo_keywords_secondary.length > 0 ? property.seo_keywords_secondary : secondaryKws,
    seo_score: score,
    recommendations
  };
}

export function calculateSeoScore(params: {
  title?: string;
  description?: string;
  slug?: string;
  primaryKeyword?: string;
  photos?: { url: string; alt: string }[];
}): { score: number; recommendations: string[] } {
  let score = 0;
  const recommendations: string[] = [];

  const title = params.title?.trim() || '';
  const desc = params.description?.trim() || '';
  const slug = params.slug?.trim() || '';
  const kw = params.primaryKeyword?.toLowerCase().trim() || '';
  const photos = params.photos || [];

  // Title checks (max 25 pts)
  if (title.length >= 35 && title.length <= 65) {
    score += 25;
  } else if (title.length > 0) {
    score += 15;
    recommendations.push(title.length < 35 ? 'Il titolo SEO è troppo corto (consigliato: 40-60 caratteri).' : 'Il titolo SEO supera i 65 caratteri (rischia troncamento su Google).');
  } else {
    recommendations.push('Aggiungi un titolo SEO ottimizzato.');
  }

  // Meta Description checks (max 25 pts)
  if (desc.length >= 120 && desc.length <= 165) {
    score += 25;
  } else if (desc.length > 0) {
    score += 15;
    recommendations.push(desc.length < 120 ? 'Meta description troppo breve (ottimale 130-155 caratteri).' : 'Meta description troppo lunga (supera 160 caratteri).');
  } else {
    recommendations.push('Inserisci la meta description per snippet di ricerca.');
  }

  // Keyword check (max 20 pts)
  if (kw.length > 3) {
    if (title.toLowerCase().includes(kw)) {
      score += 10;
    } else {
      recommendations.push(`Includi la keyword principale "${kw}" nel titolo SEO.`);
    }

    if (desc.toLowerCase().includes(kw)) {
      score += 10;
    } else {
      recommendations.push(`Includi la keyword principale "${kw}" nella meta description.`);
    }
  } else {
    recommendations.push('Definisci una keyword principale (es. "villa monopoli").');
  }

  // Slug check (max 15 pts)
  if (slug.length >= 5 && /^[a-z0-9-]+$/.test(slug)) {
    score += 15;
  } else {
    recommendations.push('Lo slug URL deve contenere solo caratteri minuscoli, numeri e trattini.');
  }

  // Image ALT text check (max 15 pts)
  if (photos.length > 0) {
    const hasAltOnAll = photos.every(p => p.alt && p.alt.trim().length > 3);
    if (hasAltOnAll) {
      score += 15;
    } else {
      score += 8;
      recommendations.push('Assicurati che tutte le foto caricate abbiano un testo ALT descrittivo per la SEO immagini.');
    }
  } else {
    recommendations.push('Carica almeno una foto con testo ALT ottimizzato.');
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    recommendations
  };
}
