const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
const safeTables = new Set(['visa_groups','visa_cards','packages','galleries','feedback']);
const slug = s => String(s||'file').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100) || 'file';
export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405,{error:'Method not allowed'});
  const url = process.env.SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const expected = process.env.ADMIN_LOGIN_ID;
  if (!url || !service || !expected) return json(500,{error:'Server environment is not configured'});
  let body; try { body = JSON.parse(event.body||'{}'); } catch { return json(400,{error:'Invalid JSON'}); }
  if (!body.adminId || body.adminId !== expected) return json(401,{error:'Invalid Admin Login ID'});
  const headers = { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type':'application/json' };
  const req = async (path, options={}) => {
    const r = await fetch(`${url}${path}`, { ...options, headers:{...headers,...(options.headers||{})} });
    const text = await r.text(); let data=null; try{data=text?JSON.parse(text):null}catch{data=text}
    if(!r.ok) throw new Error(typeof data==='object'&&data?.message?data.message:(text||`HTTP ${r.status}`)); return data;
  };
  try {
    if (body.action === 'login') return json(200,{ok:true});
    if (body.action === 'list') {
      const [visa_groups,visa_cards,packages,galleries,feedback] = await Promise.all([
        req('/rest/v1/visa_groups?select=*&order=sort_order.asc'),
        req('/rest/v1/visa_cards?select=*&order=sort_order.asc'),
        req('/rest/v1/packages?select=*&order=sort_order.asc'),
        req('/rest/v1/galleries?select=*&order=sort_order.asc'),
        req('/rest/v1/feedback?select=*&order=created_at.desc')
      ]);
      return json(200,{data:{visa_groups,visa_cards,packages,galleries,feedback}});
    }
    if (body.action === 'upsert') {
      const table=body.table; if(!safeTables.has(table)||table==='feedback') return json(400,{error:'Invalid table'});
      const record={...(body.record||{})};
      if(record.sort_order===undefined){ const rows=await req(`/rest/v1/${table}?select=sort_order&order=sort_order.desc&limit=1`); record.sort_order=(rows?.[0]?.sort_order??-1)+1; }
      const out=await req(`/rest/v1/${table}?on_conflict=id`,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(record)});
      return json(200,{record:out?.[0]||null});
    }
    if (body.action === 'delete') {
      const table=body.table; if(!safeTables.has(table)) return json(400,{error:'Invalid table'}); if(!body.id)return json(400,{error:'Missing id'});
      await req(`/rest/v1/${table}?id=eq.${encodeURIComponent(body.id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}}); return json(200,{ok:true});
    }
    if (body.action === 'reorder') {
      const table=body.table; if(!safeTables.has(table)||table==='feedback') return json(400,{error:'Invalid table'});
      if(!Array.isArray(body.ids)) return json(400,{error:'Missing ids'});
      for(let i=0;i<body.ids.length;i++) await req(`/rest/v1/${table}?id=eq.${encodeURIComponent(body.ids[i])}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(table==='visa_groups'?{sort_order:i}:{sort_order:i,updated_at:new Date().toISOString()})});
      return json(200,{ok:true});
    }
    if (body.action === 'upload') {
      const match=String(body.dataUrl||'').match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/); if(!match)return json(400,{error:'Only JPEG, PNG or WebP images are allowed'});
      const bytes=Buffer.from(match[2],'base64'); if(bytes.length>8*1024*1024)return json(400,{error:'Image is too large'});
      const ext=match[1].split('/')[1].replace('jpeg','jpg'); const folder=String(body.folder||'uploads').split('/').map(slug).join('/'); const path=`${folder}/${Date.now()}-${slug((body.name||'image').replace(/\.[^.]+$/,''))}.${ext}`;
      await req(`/storage/v1/object/site-media/${path}`,{method:'POST',headers:{'Content-Type':match[1],'x-upsert':'true'},body:bytes}); return json(200,{path});
    }
    return json(400,{error:'Unknown action'});
  } catch (e) { return json(500,{error:e.message||'Server error'}); }
}
