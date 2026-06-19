// Service worker: cache app để dùng offline sau khi đã cài.
// HTML chính (index.html) luôn ưu tiên tải bản mới nhất từ mạng (network-first),
// chỉ dùng bản cache khi không có mạng — để không bị kẹt ở bản cũ sau khi cập nhật.
// Các file tĩnh khác (icon, manifest) dùng cache-first cho nhanh + đỡ tốn dữ liệu.
const CACHE_NAME = 'cho-vay-cache-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isHtmlRequest(request) {
  if (request.mode === 'navigate') return true;
  const url = new URL(request.url);
  return url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const request = event.request;

  if (isHtmlRequest(request)) {
    // Network-first cho trang HTML chính: luôn cố lấy bản mới nhất.
    event.respondWith(
      fetch(request, { cache: 'no-store' }).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first cho các file tĩnh còn lại.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => cached);
    })
  );
});
