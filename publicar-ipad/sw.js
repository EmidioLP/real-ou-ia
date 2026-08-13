/* =========================================================
   Service worker do "Real ou IA?"
   Guarda o jogo no tablet para funcionar sem internet.

   Estratégia:
   - A PÁGINA (index.html, que é o jogo inteiro): rede primeiro, cache
     como reserva. Assim, com internet, ela sempre pega a versão nova;
     sem internet, cai no que está guardado.
   - Os arquivos de apoio (ícones, manifesto): cache primeiro, com
     atualização em segundo plano protegida por waitUntil.

   A versão anterior usava cache primeiro para tudo e disparava a
   atualização sem waitUntil — o navegador matava o worker antes de
   terminar de baixar os 6 MB e a versão nova nunca chegava.
   ========================================================= */

const CACHE = 'real-ou-ia-v2';
const PAGINA = './index.html';
const LIMITE_REDE = 5000; // ms esperando a rede antes de usar o que está guardado

const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icone-180.png',
  './icone-192.png',
  './icone-512.png'
];

self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

// Apaga os caches de versões antigas (inclusive o v1, que ficava preso).
self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function comLimiteDeTempo(promessa, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('rede lenta')), ms);
    promessa.then(v => { clearTimeout(t); resolve(v); },
                  e => { clearTimeout(t); reject(e); });
  });
}

/** Rede primeiro: garante que, online, o jogador sempre veja a versão publicada. */
async function redePrimeiro(requisicao) {
  try {
    const resposta = await comLimiteDeTempo(fetch(requisicao), LIMITE_REDE);
    if (resposta && resposta.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(PAGINA, resposta.clone());
    }
    return resposta;
  } catch {
    const guardado = await caches.match(requisicao, { ignoreSearch: true });
    return guardado || await caches.match(PAGINA) || Response.error();
  }
}

/** Cache primeiro, atualizando depois — protegido por waitUntil. */
async function cachePrimeiro(evento) {
  const guardado = await caches.match(evento.request, { ignoreSearch: true });
  if (guardado) {
    evento.waitUntil((async () => {
      try {
        const nova = await fetch(evento.request);
        if (nova && nova.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(evento.request, nova);
        }
      } catch { /* offline: segue com o que já está guardado */ }
    })());
    return guardado;
  }
  try {
    const nova = await fetch(evento.request);
    if (nova && nova.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(evento.request, nova.clone());
    }
    return nova;
  } catch {
    return Response.error();
  }
}

self.addEventListener('fetch', evento => {
  if (evento.request.method !== 'GET') return;

  const ehPagina = evento.request.mode === 'navigate' ||
                   evento.request.destination === 'document';

  evento.respondWith(ehPagina ? redePrimeiro(evento.request) : cachePrimeiro(evento));
});
