const C='unwritten-v6';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html','./cover.svg','./manifest.webmanifest','./icon.svg'])));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(cache=>cache.put(e.request,c)).catch(()=>{});return r;}).catch(()=>caches.match(e.request)));});
