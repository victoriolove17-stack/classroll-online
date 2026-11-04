/* Cache only public application files, never Supabase data/API responses. */
const CACHE='classroll-pwa-v2';
const APP=['/','/index.html','/config.js','/offline-store.js','/manifest.webmanifest','/icon.svg','/icon-192.png','/icon-512.png'];
const SDK='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(APP);
    try{await cache.add(new Request(SDK,{mode:'cors'}));}catch(error){console.warn('Supabase offline SDK unavailable:',error);}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys())if(key.startsWith('classroll-pwa-')&&key!==CACHE)await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin===self.location.origin){
    if(request.mode==='navigate'){
      event.respondWith((async()=>{
        try{const response=await fetch(request);if(response.ok){const cache=await caches.open(CACHE);await cache.put('/index.html',response.clone());}return response;}
        catch(error){return await caches.match('/index.html')||Response.error();}
      })());return;
    }
    if(APP.includes(url.pathname)){
      event.respondWith((async()=>{const cached=await caches.match(request);return cached||fetch(request);})());return;
    }
  }
  if(url.origin==='https://cdn.jsdelivr.net'&&url.pathname.startsWith('/npm/@supabase/supabase-js@2')){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const cached=await cache.match(SDK);
      if(cached)return cached;
      const response=await fetch(request);
      if(response.ok)await cache.put(SDK,response.clone());
      return response;
    })());
  }
});