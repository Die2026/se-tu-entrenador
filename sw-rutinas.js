/* ==========================================================
   SERVICE WORKER - "RUTINAS" (Sé Tu Entrenador)
   ----------------------------------------------------------
   Objetivo: permitir que la sección "Rutinas" (Rutinas de
   Adaptación y "Diseñá tu propia rutina") pueda utilizarse sin
   conexión a Internet, incluyendo el registro de pesos y la
   descarga de los PDF.

   Este Service Worker es intencionalmente acotado: solo cachea
   los recursos necesarios para que rutinas.html funcione
   offline (el propio HTML, style.css, script.js y las librerías
   externas que usa esa página para generar los PDF). No cachea
   ni intercepta el resto del sitio.
   ========================================================== */

const CACHE_VERSION = 'v1';
const CACHE_NAME = 'setuentrenador-rutinas-' + CACHE_VERSION;

// Recursos propios del sitio necesarios para "Rutinas"
const LOCAL_FILES = [
  'rutinas.html',
  'style.css',
  'script.js'
];

// Recursos externos (CDN) que usa rutinas.html: iconos y
// generación de PDF (jsPDF + AutoTable).
const CDN_FILES = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const base = self.registration.scope;

      await Promise.all(
        LOCAL_FILES.map(async (file) => {
          try {
            await cache.add(new Request(base + file, { cache: 'reload' }));
          } catch (err) {
            /* si un recurso no está disponible al instalar, no se interrumpe el resto */
          }
        })
      );

      await Promise.all(
        CDN_FILES.map(async (url) => {
          try {
            await cache.add(new Request(url, { mode: 'cors' }));
          } catch (err) {
            /* si el CDN no responde durante la instalación, se reintentará en runtime */
          }
        })
      );
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('setuentrenador-rutinas-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

function esRecursoDeRutinas(request) {
  const url = request.url;
  const esArchivoLocal = LOCAL_FILES.some((file) => url.endsWith('/' + file) || url.endsWith(file));
  const esArchivoCdn = CDN_FILES.includes(url);
  return esArchivoLocal || esArchivoCdn;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  // No interceptar recursos que no sean de "Rutinas": el resto del
  // sitio sigue funcionando exactamente igual que antes.
  if (!esRecursoDeRutinas(request)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);

      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })()
  );
});
