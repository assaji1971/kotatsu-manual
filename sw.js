/* 虎龍 調理マニュアル — Service Worker
   役割：①ネットがある時は常に最新版を取得して保存 ②ネットがない時は保存済みのコピーで起動
   このファイルは index.html と同じ場所（GitHub等）に置いてください。 */
'use strict';

const CACHE = 'kotatsu-manual-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./']).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    // 古いキャッシュを削除
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // ページ本体のみ対象（YouTube等の外部リソースは素通し）
  if (req.mode !== 'navigate' && !new URL(req.url).pathname.endsWith('.html')) return;

  e.respondWith((async () => {
    try {
      // ネット優先：最新を取得してキャッシュを更新
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      // オフライン：保存済みのコピーを返す
      const cached = await caches.match(req) || await caches.match('./');
      if (cached) return cached;
      throw err;
    }
  })());
});
