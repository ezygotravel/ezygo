const CACHE='ezygo-v16';
const MEDIA_CACHE='ezygo-media-v16';
const CORE=['/','/index.html','/config.js?v=16','/packages-v16.js?v=16','/app.js?v=16','/manifest.webmanifest','/favicon.ico','/icon-192.png','/icon-512.png','/logo.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==MEDIA_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);

  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match('/index.html')));
    return;
  }

  if(req.destination==='image'){
    event.respondWith(caches.open(MEDIA_CACHE).then(async cache=>{
      const cached=await cache.match(req);
      if(cached) return cached;
      try{
        const response=await fetch(req);
        if(response && (response.ok || response.type==='opaque')) event.waitUntil(cache.put(req,response.clone()));
        return response;
      }catch(err){
        return cached || Response.error();
      }
    }));
    return;
  }

  // Versioned core resources: network first so deploys are picked up immediately, cache as fallback.
  event.respondWith(fetch(req).then(response=>{
    if(response && response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,copy)));}
    return response;
  }).catch(()=>caches.match(req)));
});
