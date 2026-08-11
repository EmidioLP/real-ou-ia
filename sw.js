/* =========================================================
   Service worker do "Real ou IA?"
   Guarda o jogo inteiro no tablet na primeira abertura, para
   que ele funcione sem internet no dia da apresentação.
   ========================================================= */

const CACHE = 'real-ou-ia-v1';

const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icone-180.png',
  './icone-192.png',
  './icone-512.png'
];

// Guarda tudo assim que o app é aberto pela primeira vez.
self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

// Limpa versões antigas quando o jogo é atualizado.
self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* Cache primeiro: sem internet, responde do que já está guardado.
   Se estiver online, ainda assim atualiza a cópia em segundo plano. */
self.addEventListener('fetch', evento => {
  if (evento.request.method !== 'GET') return;

  evento.respondWith(
    caches.match(evento.request, { ignoreSearch: true }).then(guardado => {
      const daRede = fetch(evento.request)
        .then(resposta => {
          if (resposta && resposta.status === 200 && resposta.type === 'basic') {
            const copia = resposta.clone();
            caches.open(CACHE).then(cache => cache.put(evento.request, copia));
          }
          return resposta;
        })
        .catch(() => guardado);

      return guardado || daRede;
    })
  );
});
