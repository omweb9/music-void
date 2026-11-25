// Void Music - sw.js
// Service Worker: بيخلي التطبيق يشتغل أوفلاين + يفتح أسرع

const CACHE_NAME = 'void-music-v1';

// الملفات اللي هتتحفظ على الموبايل أول ما يفتح التطبيق
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './search.js',
  './player.js',
  './artist.js',
  './library.js',
  './downloads.js',
  './install.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './logo.png',
  './logo.svg',
  './placeholder.png',
  './home.html',
  './search.html',
  './artist.html',
  './library.html',
  './downloads.html'
];

// 1) أول ما يتثبت: حمّل كل الملفات وحطها في الكاش
self.addEventListener('install', (event) => {
  console.log('Void Music: بيتم تثبيت التطبيق...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    }).then(() => {
      // فعّله على طول من غير ما تستنى
      return self.skipWaiting();
    })
  );
});

// 2) لما ييجي تحديث جديد: امسح الكاش القديم
self.addEventListener('activate', (event) => {
  console.log('Void Music: التطبيق اتفعّل');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('بمسح كاش قديم:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3) أي طلب من التطبيق: هاته من الكاش لو موجود، لو لأ هاته من النت
self.addEventListener('fetch', (event) => {
  // iTunes API مينفعش يتخزن، ده لازم نت على طول
  if (event.request.url.includes('itunes.apple.com')) {
    return; // سيبه يروح للنت عادي
  }

  // أي ملف تاني: الكاش الأول، وبعدين النت
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      // مش في الكاش؟ هاته من النت وحطه في الكاش للمرة الجاية
      return fetch(event.request).then((response) => {
        // متخزنش غير اللي نجح
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copy);
        });
        return response;
      }).catch(() => {
        // لو النت قطع ومفيش كاش: رجّع الرئيسية
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// 4) رسالة من التطبيق: امسح الكاش كله
self.addEventListener('message', (event) => {
  if (event.data === 'clear-cache') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('الكاش اتمسح');
    });
  }
});