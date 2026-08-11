/* =========================================================
   ranking.js — placar acumulado no localStorage
   O tablet fica ligado durante toda a apresentação, então os
   resultados de todos os participantes se acumulam aqui.
   ========================================================= */

const Ranking = (() => {
  const CHAVE = 'realouia:ranking:v1';

  /**
   * Alguns navegadores bloqueiam armazenamento em página aberta como arquivo
   * (file://) ou em aba anônima. Sem isso o jogo funciona, mas o ranking não
   * acumula entre os participantes — e isso precisa ficar visível para quem
   * está conduzindo a dinâmica.
   */
  function disponivel() {
    try {
      const teste = '__realouia_teste__';
      localStorage.setItem(teste, '1');
      localStorage.removeItem(teste);
      return true;
    } catch {
      return false;
    }
  }

  function ler() {
    try {
      const cru = localStorage.getItem(CHAVE);
      const lista = cru ? JSON.parse(cru) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      console.warn('[Real ou IA?] Não consegui ler o ranking salvo.', e);
      return [];
    }
  }

  function gravar(lista) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(lista));
      return true;
    } catch (e) {
      // Modo anônimo ou armazenamento cheio: o jogo continua, só não persiste.
      console.error('[Real ou IA?] Não consegui salvar o ranking.', e);
      return false;
    }
  }

  /** Melhor primeiro: mais acertos, depois menos tempo, depois quem jogou antes. */
  function comparar(a, b) {
    if (b.percentual !== a.percentual) return b.percentual - a.percentual;
    if (b.acertos !== a.acertos) return b.acertos - a.acertos;
    if (a.tempoMs !== b.tempoMs) return a.tempoMs - b.tempoMs;
    return a.quando - b.quando;
  }

  function ordenado() {
    return ler().sort(comparar);
  }

  /**
   * Salva a partida e devolve as estatísticas já calculadas.
   * @returns {{registro:object, posicao:number, total:number, melhorQue:number, lista:object[]}}
   */
  function salvarPartida({ nome, acertos, total, tempoMs }) {
    const registro = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nome: String(nome || 'Anônimo').trim().slice(0, 18) || 'Anônimo',
      acertos,
      total,
      percentual: total > 0 ? Math.round((acertos / total) * 100) : 0,
      tempoMs,
      quando: Date.now()
    };

    const lista = ler();
    lista.push(registro);
    gravar(lista);

    const listaOrdenada = lista.sort(comparar);
    const posicao = listaOrdenada.findIndex(r => r.id === registro.id) + 1;

    // "Melhor que X%": porcentagem dos outros participantes que fizeram menos pontos.
    const outros = listaOrdenada.filter(r => r.id !== registro.id);
    const piores = outros.filter(r => r.percentual < registro.percentual).length;
    const melhorQue = outros.length ? Math.round((piores / outros.length) * 100) : null;

    return { registro, posicao, total: listaOrdenada.length, melhorQue, lista: listaOrdenada };
  }

  function zerar() {
    localStorage.removeItem(CHAVE);
  }

  function quantidade() {
    return ler().length;
  }

  /** CSV para levar os resultados do dia embora (abre no Excel). */
  function paraCsv() {
    const linhas = [['posicao', 'nome', 'acertos', 'total', 'percentual', 'tempo_segundos', 'data_hora']];
    ordenado().forEach((r, i) => {
      linhas.push([
        i + 1,
        `"${String(r.nome).replace(/"/g, '""')}"`,
        r.acertos,
        r.total,
        r.percentual,
        Math.round((r.tempoMs || 0) / 1000),
        new Date(r.quando).toLocaleString('pt-BR')
      ]);
    });
    return linhas.map(l => l.join(';')).join('\r\n');
  }

  return { ler, ordenado, salvarPartida, zerar, quantidade, paraCsv, disponivel };
})();
