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
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = env.SUPABASE_URL;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  const expected = env.ADMIN_LOGIN_ID;
  if (!url || !service || !expected) return json({ error: 'Server environment is not configured' }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.adminId || body.adminId !== expected) {
    return json({ error: 'Invalid Admin Login ID' }, 401);
  }

  const headers = {
    apikey: service,
    Authorization: `Bearer ${service}`,
    'Content-Type': 'application/json'
  };

  const req = async (path, options = {}) => {
    const response = await fetch(`${url}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) {
      const message = typeof data === 'object' && data?.message ? data.message : (text || `HTTP ${response.status}`);
      throw new Error(message);
    }
    return data;
  };

  try {
    if (body.action === 'login') return json({ ok: true });

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
