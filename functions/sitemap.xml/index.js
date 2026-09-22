const SITE = 'https://ezygotravel.in';
const SUPABASE_URL = 'https://eqtitceuapjuwockosnm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JdC2juUOVDRVe0Rt-OC7AA_IpbzZU8Z';

function xmlEscape(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function entry(loc, lastmod = '', priority = '') {
  return [
    '<url>',
    `<loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : '',
    priority ? `<priority>${priority}</priority>` : '',
    '</url>'
  ].filter(Boolean).join('');
}

async function table(name) {
  const query = 'select=id,created_at,updated_at&active=eq.true&order=sort_order.asc';
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${name}?${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  return response.json();
}

export async function onRequestGet() {
  const urls = [
    entry(`${SITE}/`, '', '1.0'),
    entry(`${SITE}/packages`, '', '0.9'),
    entry(`${SITE}/services`, '', '0.8'),
    entry(`${SITE}/gallery`, '', '0.6')
  ];

  try {
    const [visas, packages, galleries] = await Promise.all([
      table('visa_cards'),
      table('packages'),
      table('galleries')
    ]);

    for (const item of visas) {
      urls.push(entry(`${SITE}/visa/${encodeURIComponent(item.id)}`, isoDate(item.updated_at || item.created_at), '0.8'));
    }
    for (const item of packages) {
      urls.push(entry(`${SITE}/package/${encodeURIComponent(item.id)}`, isoDate(item.updated_at || item.created_at), '0.8'));
    }
    for (const item of galleries) {
      urls.push(entry(`${SITE}/gallery/${encodeURIComponent(item.id)}`, isoDate(item.updated_at || item.created_at), '0.5'));
    }
  } catch (error) {
    console.error('sitemap generation failed', error);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
