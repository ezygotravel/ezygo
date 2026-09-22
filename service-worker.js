const CACHE='ezygo-v15';
const MEDIA_CACHE='ezygo-media-v13';
const CORE=['/','/index.html','/config.js','/app.js?v=15','/manifest.webmanifest','/favicon.ico','/icon-192.png','/icon-512.png','/logo.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==MEDIA_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).catch(()=>caches.match('/index.html')));
    return;
  }
  if(e.request.destination==='image'){
    e.respondWith(caches.open(MEDIA_CACHE).then(async cache=>{
      const cached=await cache.match(e.request);
      const network=fetch(e.request).then(response=>{
        if(response&&(response.ok||response.type==='opaque'))cache.put(e.request,response.clone());
        return response;
      }).catch(()=>cached);
      if(cached){e.waitUntil(network.catch(()=>{}));return cached}
      return network;
    }));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});
