/* =========================================================
   app.js — fluxo do jogo "Real ou IA?"
   ========================================================= */

(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  const estado = {
    rodadas: [],
    origem: '',
    indice: 0,
    acertos: 0,
    nome: '',
    inicioMs: 0,
    respondida: false,
    ultimoId: null   // id do registro recém-salvo, para destacar no ranking
  };

  // ---------------------------------------------------------------
  // Telas
  // ---------------------------------------------------------------
  const TELAS = ['tela-inicio', 'tela-jogo', 'tela-resultado', 'tela-ranking', 'tela-admin', 'tela-erro'];

  function mostrarTela(id) {
    TELAS.forEach(t => $(t).classList.toggle('tela--ativa', t === id));
  }

  // ---------------------------------------------------------------
  // Sons (WebAudio: não depende de arquivo nem de internet)
  // ---------------------------------------------------------------
  let audioCtx = null;
  function bip(frequencias, duracao = 0.12) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      frequencias.forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const vol = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        const t0 = audioCtx.currentTime + i * duracao;
        vol.gain.setValueAtTime(0.0001, t0);
        vol.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
        vol.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);
        osc.connect(vol).connect(audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + duracao + 0.02);
      });
    } catch { /* som é opcional */ }
  }
  const somAcerto = () => bip([660, 880, 1180]);
  const somErro = () => bip([300, 190], 0.18);

  // ---------------------------------------------------------------
  // Tela cheia
  // ---------------------------------------------------------------
  function pedirTelaCheia() {
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (fn && !document.fullscreenElement) {
      // Alguns navegadores/contextos bloqueiam tela cheia — o jogo segue normalmente.
      try {
        const p = fn.call(el);
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch { /* ignorado de propósito */ }
    }
  }

  // ---------------------------------------------------------------
  // Início
  // ---------------------------------------------------------------
  async function iniciar() {
    try {
      const { rodadas, origem } = await Dados.carregar();
      estado.rodadas = rodadas;
      estado.origem = origem;
      $('info-rodadas').textContent = `${rodadas.length} ${rodadas.length === 1 ? 'rodada' : 'rodadas'}`;
      $('admin-origem').textContent = origem;
      $('aviso-armazenamento').hidden = Ranking.disponivel();
      mostrarTela('tela-inicio');
      $('campo-nome').focus({ preventScroll: true });
    } catch (e) {
      console.error(e);
      $('erro-detalhe').textContent = e.message || String(e);
      mostrarTela('tela-erro');
    }
    ligarEventos();
  }

  function comecarPartida(nome) {
    estado.nome = nome;
    estado.indice = 0;
    estado.acertos = 0;
    estado.inicioMs = Date.now();
    estado.ultimoId = null;
    mostrarTela('tela-jogo');
    renderizarRodada();
  }

  // ---------------------------------------------------------------
  // Rodada
  // ---------------------------------------------------------------
  const ROTULO_NIVEL = { facil: 'FÁCIL', medio: 'MÉDIO', dificil: 'DIFÍCIL' };

  function renderizarRodada() {
    const r = estado.rodadas[estado.indice];
    const total = estado.rodadas.length;
    estado.respondida = false;

    $('contador-rodada').textContent = `RODADA ${estado.indice + 1}/${total}`;
    const selo = $('selo-nivel');
    selo.textContent = ROTULO_NIVEL[r.nivel] || r.nivel.toUpperCase();
    selo.dataset.nivel = r.nivel;
    $('progresso-preenchido').style.width = `${(estado.indice / total) * 100}%`;
    $('placar').textContent = `✅ ${estado.acertos}`;
    $('feedback').hidden = true;
    $('credito-midia').hidden = true;   // só reaparece ao responder
    mostrarExplicacao(false); // limpa o modo "ver imagem" da rodada anterior

    montarMidia(r);
    montarOpcoes(r);
    preCarregarProxima();
  }

  /**
   * Crédito/licença da mídia, exigido por CC BY e CC BY-SA.
   * Aparece só junto da explicação, depois da resposta: mostrado embaixo da
   * imagem, ele entregaria o gabarito ("Imagem gerada por IA: ...").
   */
  function aplicarCredito(r) {
    const alvo = $('credito-midia');
    alvo.textContent = r.credito || '';
    alvo.hidden = !r.credito;
  }

  function montarMidia(r) {
    const alvo = $('midia');
    alvo.innerHTML = '';
    alvo.classList.remove('midia--carregando');

    if (r.tipo === 'imagem') {
      alvo.classList.add('midia--carregando');
      const img = new Image();
      img.alt = 'Conteúdo da rodada';
      img.decoding = 'async';
      img.onload = () => alvo.classList.remove('midia--carregando');
      img.onerror = () => { alvo.classList.remove('midia--carregando'); alvo.replaceChildren(avisoArquivo(r.arquivo)); };
      img.src = r.arquivo;
      alvo.appendChild(img);

    } else if (r.tipo === 'video') {
      const video = document.createElement('video');
      video.src = r.arquivo;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;          // necessário para o autoplay funcionar
      video.playsInline = true;
      video.controls = true;
      video.onerror = () => alvo.replaceChildren(avisoArquivo(r.arquivo));
      alvo.appendChild(video);

    } else {
      alvo.appendChild(montarPost(r));
    }
  }

  function avisoArquivo(caminho) {
    const div = document.createElement('div');
    div.className = 'midia-erro';
    div.innerHTML = '📁 Não encontrei o arquivo desta rodada:<br><code></code>' +
                    '<br><br>Confira o caminho no <b>rounds.json</b>.';
    div.querySelector('code').textContent = caminho;
    return div;
  }

  function montarPost(r) {
    const post = document.createElement('article');
    post.className = 'post';

    const cab = document.createElement('div');
    cab.className = 'post__cabecalho';
    const avatar = document.createElement('div');
    avatar.className = 'post__avatar';
    avatar.textContent = (r.autor || '?').trim().charAt(0).toUpperCase();
    const bloco = document.createElement('div');
    const autor = document.createElement('div');
    autor.className = 'post__autor';
    autor.textContent = r.autor;
    const meta = document.createElement('div');
    meta.className = 'post__meta';
    meta.textContent = `${r.usuario} · ${r.tempo}`;
    bloco.append(autor, meta);
    cab.append(avatar, bloco);

    const texto = document.createElement('p');
    texto.className = 'post__texto';
    texto.textContent = r.texto_post;

    post.append(cab, texto);

    if (r.imagem_post) {
      const img = document.createElement('img');
      img.className = 'post__imagem';
      img.src = r.imagem_post;
      img.alt = '';
      img.onerror = () => img.remove();
      post.appendChild(img);
    }

    const acoes = document.createElement('div');
    acoes.className = 'post__acoes';
    acoes.textContent = `❤️ ${r.curtidas || '—'}    🔁 ${r.compartilhamentos || '—'}    💬`;
    post.appendChild(acoes);

    return post;
  }

  function montarOpcoes(r) {
    const caixa = $('opcoes');
    caixa.className = 'opcoes';
    caixa.innerHTML = '';

    const ehPost = r.tipo === 'fake_news';
    $('pergunta').textContent = r.pergunta ||
      (ehPost ? 'Essa publicação é REAL ou é FAKE NEWS?'
              : (r.tipo === 'video' ? 'Esse vídeo é REAL ou foi criado por IA?'
                                    : 'Essa imagem é REAL ou foi criada por IA?'));

    const opcoes = ehPost
      ? [{ valor: 'real', texto: '📰 REAL', cor: 'real' },
         { valor: 'fake', texto: '🚫 FAKE NEWS', cor: 'fake' }]
      : [{ valor: 'real', texto: '📷 REAL', cor: 'real' },
         { valor: 'ia', texto: '🤖 IA', cor: 'ia' }];

    opcoes.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'botao-opcao';
      b.dataset.cor = o.cor;
      b.dataset.valor = o.valor;
      b.textContent = o.texto;
      b.addEventListener('click', () => responder(o.valor, b));
      caixa.appendChild(b);
    });
  }

  /** Carrega a mídia da próxima rodada em segundo plano, para não travar na virada. */
  function preCarregarProxima() {
    const prox = estado.rodadas[estado.indice + 1];
    if (prox && prox.tipo === 'imagem' && prox.arquivo) {
      const img = new Image();
      img.src = prox.arquivo;
    }
  }

  // ---------------------------------------------------------------
  // Resposta e feedback
  // ---------------------------------------------------------------
  const NOME_RESPOSTA = {
    real: 'REAL',
    ia: 'IA',
    fake: 'FAKE NEWS'
  };

  function responder(valor, botao) {
    if (estado.respondida) return;
    estado.respondida = true;

    const r = estado.rodadas[estado.indice];
    const acertou = valor === r.resposta_correta;
    if (acertou) estado.acertos++;

    const caixa = $('opcoes');
    caixa.classList.add('opcoes--respondido');
    caixa.querySelectorAll('.botao-opcao').forEach(b => { b.disabled = true; });
    botao.classList.add('botao-opcao--escolhido');
    $('placar').textContent = `✅ ${estado.acertos}`;

    const cartao = $('feedback-cartao');
    cartao.dataset.status = acertou ? 'acerto' : 'erro';
    $('feedback-icone').textContent = acertou ? '✅' : '❌';
    $('feedback-veredito').textContent = acertou ? 'Você acertou!' : 'Você errou!';

    $('feedback-resposta').textContent = `Resposta: ${NOME_RESPOSTA[r.resposta_correta]}`;
    $('feedback-explicacao').textContent = r.explicacao || 'Sem explicação cadastrada para esta rodada.';
    aplicarCredito(r);

    const ultima = estado.indice === estado.rodadas.length - 1;
    $('btn-proxima').textContent = ultima ? 'VER RESULTADO 🏁' : 'PRÓXIMA ➜';

    mostrarExplicacao(true);
    (acertou ? somAcerto : somErro)();
  }

  /**
   * Alterna entre ver a explicação e reexaminar a imagem.
   * Só faz sentido depois de responder — antes disso o painel nem existe.
   * @param {boolean} visivel true = explicação na tela; false = imagem livre.
   */
  function mostrarExplicacao(visivel) {
    if (!estado.respondida) visivel = false;
    $('feedback').hidden = !visivel;
    $('pergunta').hidden = estado.respondida && !visivel;
    $('btn-voltar-explicacao').hidden = !(estado.respondida && !visivel);
    if (visivel) $('btn-proxima').focus({ preventScroll: true });
  }

  function avancar() {
    if (estado.indice < estado.rodadas.length - 1) {
      estado.indice++;
      renderizarRodada();
    } else {
      finalizar();
    }
  }

  // ---------------------------------------------------------------
  // Resultado
  // ---------------------------------------------------------------
  function mensagemPorDesempenho(pct) {
    if (pct === 100) return 'Impressionante! Olho de detetive digital. 🕵️';
    if (pct >= 80) return 'Muito bem! Você percebe os detalhes que a maioria deixa passar.';
    if (pct >= 60) return 'Bom resultado — mas alguns conteúdos te enganaram, viu?';
    if (pct >= 40) return 'Deu pra perceber: a IA está ficando convincente demais.';
    return 'Difícil, né? É exatamente por isso que precisamos verificar antes de compartilhar.';
  }

  function finalizar() {
    const total = estado.rodadas.length;
    const tempoMs = Date.now() - estado.inicioMs;
    const { registro, posicao, total: participantes, melhorQue } =
      Ranking.salvarPartida({ nome: estado.nome, acertos: estado.acertos, total, tempoMs });

    estado.ultimoId = registro.id;

    $('resultado-nome').textContent = `Boa, ${registro.nome}!`;
    $('resultado-porcento').textContent = `${registro.percentual}%`;
    $('resultado-acertos').textContent = `${registro.acertos} de ${total}`;
    $('resultado-mensagem').textContent = mensagemPorDesempenho(registro.percentual);

    const comparacao = participantes <= 1
      ? '🎉 Você é o primeiro participante do ranking!'
      : `🏅 ${posicao}º lugar entre ${participantes} participantes` +
        (melhorQue !== null ? ` · você se saiu melhor que ${melhorQue}% de quem já jogou.` : '');
    $('resultado-comparacao').textContent = comparacao;

    // Anima o anel de porcentagem
    const anel = $('resultado-anel');
    anel.style.setProperty('--p', 0);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      anel.style.setProperty('--p', registro.percentual);
    }));

    mostrarTela('tela-resultado');
    if (registro.percentual >= 80) bip([523, 659, 784, 1046], 0.1);
  }

  // ---------------------------------------------------------------
  // Ranking
  // ---------------------------------------------------------------
  const MEDALHA = { 1: '🥇', 2: '🥈', 3: '🥉' };

  function renderizarRanking() {
    const lista = Ranking.ordenado();
    const ol = $('ranking-lista');
    ol.innerHTML = '';

    $('ranking-vazio').hidden = lista.length > 0;
    $('ranking-total').textContent = lista.length
      ? `${lista.length} ${lista.length === 1 ? 'participante' : 'participantes'}`
      : '';

    // Mostra o top 10; se o jogador atual ficou fora, acrescenta a linha dele no fim.
    const topo = lista.slice(0, 10);
    const euForaDoTopo = estado.ultimoId && !topo.some(r => r.id === estado.ultimoId);
    const visiveis = topo.map((r, i) => ({ r, pos: i + 1 }));
    if (euForaDoTopo) {
      const idx = lista.findIndex(r => r.id === estado.ultimoId);
      if (idx > -1) visiveis.push({ r: lista[idx], pos: idx + 1 });
    }

    visiveis.forEach(({ r, pos }) => {
      const li = document.createElement('li');
      li.className = `linha-rank linha-rank--${pos}`;
      if (r.id === estado.ultimoId) li.classList.add('linha-rank--voce');

      const cPos = document.createElement('span');
      cPos.className = 'linha-rank__pos';
      cPos.textContent = MEDALHA[pos] || `${pos}º`;

      const cNome = document.createElement('span');
      cNome.className = 'linha-rank__nome';
      cNome.textContent = r.nome;
      if (r.id === estado.ultimoId) {
        const tag = document.createElement('small');
        tag.textContent = 'você';
        cNome.appendChild(tag);
      }

      const cAcertos = document.createElement('span');
      cAcertos.className = 'linha-rank__acertos';
      cAcertos.textContent = `${r.acertos}/${r.total}`;

      const cPct = document.createElement('span');
      cPct.className = 'linha-rank__pct';
      cPct.textContent = `${r.percentual}%`;

      li.append(cPos, cNome, cAcertos, cPct);
      ol.appendChild(li);
    });

    mostrarTela('tela-ranking');
  }

  // ---------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------
  function abrirAdmin() {
    $('admin-qtd').textContent = Ranking.quantidade();
    $('admin-origem').textContent = estado.origem || '—';
    $('btn-limpar-import').hidden = !Dados.temImportado();
    mostrarTela('tela-admin');
  }

  function baixarCsv() {
    const blob = new Blob(['﻿' + Ranking.paraCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking-real-ou-ia-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function importarJson(arquivo) {
    try {
      const texto = await arquivo.text();
      const bruto = JSON.parse(texto);
      const rodadas = Dados.salvarImportado(bruto);
      estado.rodadas = rodadas;
      estado.origem = 'rounds.json importado (modo admin)';
      $('info-rodadas').textContent = `${rodadas.length} ${rodadas.length === 1 ? 'rodada' : 'rodadas'}`;
      abrirAdmin();
      alert(`✅ Importado! ${rodadas.length} rodada(s) carregadas.`);
    } catch (e) {
      alert('❌ Não consegui importar esse arquivo.\n\n' + (e.message || e));
    }
  }

  // ---------------------------------------------------------------
  // Eventos
  // ---------------------------------------------------------------
  function ligarEventos() {
    // Tela inicial
    $('form-inicio').addEventListener('submit', ev => {
      ev.preventDefault();
      const nome = $('campo-nome').value.trim();
      if (!nome) {
        $('erro-nome').hidden = false;
        $('campo-nome').focus();
        return;
      }
      $('erro-nome').hidden = true;
      $('campo-nome').blur();
      pedirTelaCheia();
      comecarPartida(nome);
    });
    $('campo-nome').addEventListener('input', () => { $('erro-nome').hidden = true; });
    $('btn-ranking-inicio').addEventListener('click', () => { estado.ultimoId = null; renderizarRanking(); });

    // Jogo
    $('btn-proxima').addEventListener('click', avancar);
    $('btn-ver-imagem').addEventListener('click', () => mostrarExplicacao(false));
    $('btn-voltar-explicacao').addEventListener('click', () => mostrarExplicacao(true));

    // Resultado
    $('btn-ver-ranking').addEventListener('click', renderizarRanking);
    $('btn-jogar-novamente').addEventListener('click', voltarAoInicio);
    $('btn-novo-jogador').addEventListener('click', voltarAoInicio);

    // Admin
    $('btn-admin').addEventListener('click', abrirAdmin);
    $('btn-sair-admin').addEventListener('click', () => mostrarTela('tela-inicio'));
    $('btn-tela-cheia').addEventListener('click', pedirTelaCheia);
    $('btn-exportar').addEventListener('click', baixarCsv);
    $('btn-zerar').addEventListener('click', () => {
      if (confirm('Apagar TODOS os resultados do ranking?\n\nEssa ação não pode ser desfeita.')) {
        Ranking.zerar();
        estado.ultimoId = null;
        $('admin-qtd').textContent = '0';
        alert('🗑️ Ranking zerado.');
      }
    });
    $('input-json').addEventListener('change', ev => {
      const arquivo = ev.target.files && ev.target.files[0];
      if (arquivo) importarJson(arquivo);
      ev.target.value = '';
    });
    $('btn-limpar-import').addEventListener('click', () => {
      Dados.limparImportado();
      alert('↩️ Voltando ao rounds.json da pasta. O jogo vai recarregar.');
      location.reload();
    });

    // Toque secreto: 5 toques rápidos no título abrem o admin
    let toques = 0, ultimoToque = 0;
    $('logo-secreto').addEventListener('click', () => {
      const agora = Date.now();
      toques = (agora - ultimoToque < 700) ? toques + 1 : 1;
      ultimoToque = agora;
      if (toques >= 5) { toques = 0; abrirAdmin(); }
    });

    // Teclado (útil com teclado acoplado ao tablet)
    document.addEventListener('keydown', ev => {
      if (ev.ctrlKey && ev.shiftKey && ev.key.toLowerCase() === 'a') {
        ev.preventDefault();
        $('tela-admin').classList.contains('tela--ativa') ? mostrarTela('tela-inicio') : abrirAdmin();
        return;
      }
      if (!$('tela-jogo').classList.contains('tela--ativa')) return;
      if (!$('feedback').hidden) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); avancar(); }
        if (ev.key === 'ArrowDown' || ev.key.toLowerCase() === 'v') mostrarExplicacao(false);
        return;
      }
      // Já respondeu e está reexaminando a imagem: qualquer tecla de ação traz a explicação.
      if (estado.respondida) {
        if (['Enter', ' ', 'ArrowUp', 'Escape'].includes(ev.key) || ev.key.toLowerCase() === 'v') {
          ev.preventDefault();
          mostrarExplicacao(true);
        }
        return;
      }
      const botoes = $('opcoes').querySelectorAll('.botao-opcao');
      if (ev.key === '1' || ev.key === 'ArrowLeft') botoes[0]?.click();
      if (ev.key === '2' || ev.key === 'ArrowRight') botoes[1]?.click();
    });

    // Evita zoom por duplo toque no tablet
    let ultimoTouch = 0;
    document.addEventListener('touchend', ev => {
      const agora = Date.now();
      if (agora - ultimoTouch < 320) ev.preventDefault();
      ultimoTouch = agora;
    }, { passive: false });
  }

  function voltarAoInicio() {
    estado.ultimoId = null;
    $('campo-nome').value = '';
    $('erro-nome').hidden = true;
    mostrarTela('tela-inicio');
    $('campo-nome').focus({ preventScroll: true });
  }

  /**
   * Service worker: só serve na versão publicada (iPad instalado na tela de início),
   * onde ele guarda o jogo para funcionar sem internet.
   * Fica de fora em file:// e em localhost — em desenvolvimento ele só serviria
   * conteúdo velho em cache. Use ?sw=1 para forçar num teste local.
   */
  function registrarServiceWorker() {
    const local = ['localhost', '127.0.0.1'].includes(location.hostname);
    const forcado = location.search.includes('sw=1');
    if (!('serviceWorker' in navigator)) return;
    if (!location.protocol.startsWith('http')) return;
    if (local && !forcado) return;
    navigator.serviceWorker.register('sw.js').catch(() => { /* sem offline, o jogo roda igual */ });
  }

  document.addEventListener('DOMContentLoaded', () => { iniciar(); registrarServiceWorker(); });
})();
