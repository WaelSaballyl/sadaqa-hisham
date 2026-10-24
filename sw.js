'use strict';
const CACHE = 'hisham-static-20261024-1';
const FILES = ['./','index.html','style.css?v=quran-simple-20261024','app.js?v=quran-simple-20261024','data.js?v=quran-simple-20261024','quran-reader.js?v=quran-simple-20261024','theme.js?v=appearance-1','install.js?v=native-install-3','manifest.webmanifest','assets/mark.svg','assets/app-icon-192.png','assets/app-icon-512.png','assets/amiri.ttf','assets/noto-arabic.ttf','assets/noto-arabic-600.ttf'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hisham-static-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  event.respondWith(fetch(event.request).then(async response=>{
    if(response.ok){const copy=response.clone();await caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(async()=>{const cached=await caches.match(event.request);if(cached)return cached;if(event.request.mode==='navigate')return (await caches.match('./'))||Response.error();return Response.error();}));
});
