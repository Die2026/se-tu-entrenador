/* ==========================================================
   SERVICE WORKER - "MI EVALUACIÓN" (Sé Tu Entrenador)
   ----------------------------------------------------------
   Objetivo: permitir que la sección "Mi Evaluación" (IMC,
   Hidratación, Evaluación Metabólica y Test de Cooper) pueda
   utilizarse sin conexión a Internet, incluyendo la descarga
   del PDF de resultados.

   Este Service Worker es intencionalmente acotado: solo cachea
   los recursos necesarios para que evaluacion.html funcione
   offline (el propio HTML, style.css, script.js y las librerías
   externas que usa esa página para generar el PDF). No cachea
   ni intercepta el resto del sitio.
   ========================================================== */

const CACHE_VERSION = 'v1';
const CACHE_NAME = 'setuentrenador-mievaluacion-' + CACHE_VERSION;

// Recursos propios del sitio necesarios para "Mi Evaluación"
const LOCAL_FILES = [
  'evaluacion.html',
  'style.css',
  'script.js'
];

// Recursos externos (CDN) que usa evaluacion.html: iconos y
// generación de PDF (jsPDF + AutoTable). Font Awesome también
// se precachea para que los íconos se vean igual sin conexión.
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

      // Precachea los archivos propios de la página (rutas relativas al scope del SW)
      await Promise.all(
        LOCAL_FILES.map(async (file) => {
          try {
            await cache.add(new Request(base + file, { cache: 'reload' }));
          } catch (err) {
            /* si un recurso no está disponible al instalar, no se interrumpe el resto */
          }
        })
      );

      // Precachea las librerías externas (CDN) usadas para el PDF y los íconos
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
          .filter((key) => key.startsWith('setuentrenador-mievaluacion-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Determina si una petición corresponde a un recurso que este
// Service Worker debe manejar (solo los de "Mi Evaluación").
function esRecursoDeMiEvaluacion(request) {
  const url = request.url;

  const esArchivoLocal = LOCAL_FILES.some((file) => url.endsWith('/' + file) || url.endsWith(file));
  const esArchivoCdn = CDN_FILES.includes(url);

  return esArchivoLocal || esArchivoCdn;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo intervenir en peticiones GET
  if (request.method !== 'GET') return;

  // No interceptar recursos que no sean de "Mi Evaluación": el resto
  // del sitio sigue funcionando exactamente igual que antes, sin
  // pasar por este Service Worker.
  if (!esRecursoDeMiEvaluacion(request)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);

      // Estrategia "stale-while-revalidate": responde inmediatamente
      // con la copia guardada (funciona sin Internet) y, si hay
      // conexión, actualiza la caché en segundo plano para la
      // próxima vez que se use offline.
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
