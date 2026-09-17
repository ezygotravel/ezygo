const safeTables = new Set(['visa_groups', 'visa_cards', 'packages', 'galleries', 'feedback']);

const slug = (value) => String(value || 'file')
  .toLowerCase()
  .replace(/[^a-z0-9._-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 100) || 'file';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  }
});

function decodeBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'GET') return json({ ok: true, status: 'EzyGo admin API is running' });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = String(env.SUPABASE_URL || '').trim().replace(/\\/$/, '');
  // Accept the existing Cloudflare variable name, the newer name, and the
  // accidentally-shortened name visible in some setups.
  const service = String(
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SECRET_KEY ||
    env.SUPABASE_SERVICE_ROLE_K ||
    ''
  ).trim();
  const expected = String(env.ADMIN_LOGIN_ID || '').trim();

  if (!url) return json({ error: 'Missing Cloudflare variable: SUPABASE_URL' }, 500);
  if (!service) return json({ error: 'Missing Cloudflare Supabase secret variable' }, 500);
  if (!expected) return json({ error: 'Missing Cloudflare variable: ADMIN_LOGIN_ID' }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const suppliedAdminId = String(body.adminId || '').trim();
  if (!suppliedAdminId || suppliedAdminId !== expected) {
    return json({ error: 'Invalid Admin Login ID' }, 401);
  }

  // IMPORTANT: sb_secret_* keys are opaque API keys, not JWTs.
  // Sending them as Authorization: Bearer causes Supabase to reject the
  // request with Invalid JWT. New secret keys must be sent in `apikey`.
  // Legacy service_role JWT keys still support the Bearer header, so keep
  // that header only for legacy JWT-shaped keys.
  const headers = {
    apikey: service,
    'Content-Type': 'application/json'
  };
  const isLegacyJwt = service.startsWith('eyJ') || service.split('.').length === 3;
  if (isLegacyJwt) headers.Authorization = `Bearer ${service}`;

  const req = async (path, options = {}) => {
    const response = await fetch(`${url}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) {
      const message = (data && typeof data === 'object' && (data.message || data.error || data.msg))
        ? (data.message || data.error || data.msg)
        : (text || `Supabase HTTP ${response.status}`);
      throw new Error(message);
    }
    return data;
  };

  try {
    if (body.action === 'login') {
      await req('/rest/v1/visa_groups?select=id&limit=1');
      return json({ ok: true });
    }

    if (body.action === 'list') {
      const [visa_groups, visa_cards, packages, galleries, feedback] = await Promise.all([
        req('/rest/v1/visa_groups?select=*&order=sort_order.asc'),
        req('/rest/v1/visa_cards?select=*&order=sort_order.asc'),
        req('/rest/v1/packages?select=*&order=sort_order.asc'),
        req('/rest/v1/galleries?select=*&order=sort_order.asc'),
        req('/rest/v1/feedback?select=*&order=created_at.desc')
      ]);
      return json({ data: { visa_groups, visa_cards, packages, galleries, feedback } });
    }

    if (body.action === 'upsert') {
      const table = body.table;
      if (!safeTables.has(table) || table === 'feedback') return json({ error: 'Invalid table' }, 400);
      const record = { ...(body.record || {}) };
      if (record.sort_order === undefined) {
        const rows = await req(`/rest/v1/${table}?select=sort_order&order=sort_order.desc&limit=1`);
        record.sort_order = (rows?.[0]?.sort_order ?? -1) + 1;
      }
      const out = await req(`/rest/v1/${table}?on_conflict=id`, {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(record)
      });
      return json({ record: out?.[0] || null });
    }

    if (body.action === 'delete') {
      const table = body.table;
      if (!safeTables.has(table)) return json({ error: 'Invalid table' }, 400);
      if (!body.id) return json({ error: 'Missing id' }, 400);
      await req(`/rest/v1/${table}?id=eq.${encodeURIComponent(body.id)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' }
      });
      return json({ ok: true });
    }

    if (body.action === 'reorder') {
      const table = body.table;
      if (!safeTables.has(table) || table === 'feedback') return json({ error: 'Invalid table' }, 400);
      if (!Array.isArray(body.ids)) return json({ error: 'Missing ids' }, 400);
      for (let i = 0; i < body.ids.length; i++) {
        const patch = table === 'visa_groups'
          ? { sort_order: i }
          : { sort_order: i, updated_at: new Date().toISOString() };
        await req(`/rest/v1/${table}?id=eq.${encodeURIComponent(body.ids[i])}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(patch)
        });
      }
      return json({ ok: true });
    }

    if (body.action === 'upload') {
      const match = String(body.dataUrl || '').match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
      if (!match) return json({ error: 'Only JPEG, PNG or WebP images are allowed' }, 400);

      const bytes = decodeBase64(match[2]);
      if (bytes.byteLength > 8 * 1024 * 1024) return json({ error: 'Image is too large' }, 400);

      const ext = match[1].split('/')[1].replace('jpeg', 'jpg');
      const folder = String(body.folder || 'uploads').split('/').map(slug).join('/');
      const path = `${folder}/${Date.now()}-${slug((body.name || 'image').replace(/\.[^.]+$/, ''))}.${ext}`;

      await req(`/storage/v1/object/site-media/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': match[1],
          'x-upsert': 'true'
        },
        body: bytes
      });
      return json({ path });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    return json({ error: error?.message || 'Server error' }, 500);
  }
}
