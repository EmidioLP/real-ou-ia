/* =========================================================
   dados.js — carregamento e validação das rodadas
   ---------------------------------------------------------
   Ordem de prioridade:
     1) rounds.json importado pelo modo admin (fica no localStorage)
     2) data/rounds.json lido pela rede (funciona em http/servidor)
     3) data/rounds.js embutido (funciona abrindo o arquivo direto)
   ========================================================= */

const Dados = (() => {
  const CHAVE_IMPORTADO = 'realouia:rodadas_importadas:v1';

  const TIPOS_VALIDOS = ['imagem', 'video', 'fake_news'];

  /** Tira acentos, espaços e deixa minúsculo — para comparar valores do JSON com folga. */
  function chave(valor) {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
  }

  function normalizarNivel(valor, indice) {
    const k = chave(valor);
    if (k.startsWith('fac') || k === 'easy') return 'facil';
    if (k.startsWith('med')) return 'medio';
    if (k.startsWith('dif') || k.startsWith('hard')) return 'dificil';
    // Sem nível informado: usa a regra do roteiro (1-3 fácil, 4-7 médio, 8-10 difícil).
    if (indice < 3) return 'facil';
    if (indice < 7) return 'medio';
    return 'dificil';
  }

  function normalizarTipo(valor) {
    const k = chave(valor);
    if (['imagem', 'image', 'img', 'foto'].includes(k)) return 'imagem';
    if (['video', 'filme', 'clipe'].includes(k)) return 'video';
    if (['fake_news', 'fakenews', 'fake', 'post', 'noticia'].includes(k)) return 'fake_news';
    return null;
  }

  function normalizarResposta(valor, tipo) {
    const k = chave(valor);
    if (tipo === 'fake_news') {
      // Aceita também o formato antigo: "compartilharia" = notícia verdadeira,
      // "nao_compartilharia" = notícia falsa. Assim um rounds.json antigo continua valendo.
      if (['real', 'verdadeira', 'verdadeiro', 'true', 'compartilharia', 'sim', 'compartilhar'].includes(k)) {
        return 'real';
      }
      if (['fake', 'fake_news', 'fakenews', 'falsa', 'falso', 'false',
           'nao_compartilharia', 'nao', 'n', 'nao_compartilhar'].includes(k)) {
        return 'fake';
      }
      return null;
    }
    if (['real', 'verdadeira', 'verdadeiro', 'foto'].includes(k)) return 'real';
    if (['ia', 'ai', 'artificial', 'gerada', 'falsa', 'fake'].includes(k)) return 'ia';
    return null;
  }

  /** Aceita tanto `[ {...} ]` quanto `{ "rodadas": [ {...} ] }`. */
  function extrairLista(bruto) {
    if (Array.isArray(bruto)) return bruto;
    if (bruto && Array.isArray(bruto.rodadas)) return bruto.rodadas;
    if (bruto && Array.isArray(bruto.rounds)) return bruto.rounds;
    return null;
  }

  /**
   * Valida cada rodada e descarta as inválidas (em vez de derrubar o jogo inteiro
   * por causa de um erro de digitação numa rodada só).
   */
  function validar(bruto) {
    const lista = extrairLista(bruto);
    if (!lista) throw new Error('O arquivo precisa ter uma lista "rodadas".');

    const rodadas = [];
    const avisos = [];

    lista.forEach((item, i) => {
      const rotulo = `rodada ${item?.id ?? i + 1}`;
      const tipo = normalizarTipo(item?.tipo);
      if (!tipo) {
        avisos.push(`${rotulo}: tipo inválido (use imagem, video ou fake_news).`);
        return;
      }
      const resposta = normalizarResposta(item?.resposta_correta, tipo);
      if (!resposta) {
        avisos.push(`${rotulo}: resposta_correta inválida.`);
        return;
      }
      if (tipo !== 'fake_news' && !item?.arquivo) {
        avisos.push(`${rotulo}: falta o campo "arquivo".`);
        return;
      }
      if (tipo === 'fake_news' && !item?.texto_post) {
        avisos.push(`${rotulo}: falta o campo "texto_post".`);
        return;
      }

      rodadas.push({
        id: item.id ?? rodadas.length + 1,
        nivel: normalizarNivel(item.nivel, rodadas.length),
        tipo,
        arquivo: item.arquivo || '',
        resposta_correta: resposta,
        explicacao: item.explicacao || '',
        // Crédito/licença da mídia — obrigatório nas licenças CC BY e CC BY-SA.
        credito: item.credito || '',
        // Campos opcionais usados pelo post de rede social
        autor: item.autor || 'Perfil Desconhecido',
        usuario: item.usuario || '@perfil_qualquer',
        tempo: item.tempo || 'há pouco',
        texto_post: item.texto_post || '',
        imagem_post: item.imagem_post || item.imagem || '',
        curtidas: item.curtidas || '',
        compartilhamentos: item.compartilhamentos || '',
        pergunta: item.pergunta || ''
      });
    });

    if (!rodadas.length) {
      throw new Error('Nenhuma rodada válida foi encontrada. ' + avisos.join(' '));
    }
    if (avisos.length) console.warn('[Real ou IA?] Rodadas ignoradas:\n' + avisos.join('\n'));

    return rodadas;
  }

  // ---------- Importação manual (modo admin) ----------

  function lerImportado() {
    try {
      const cru = localStorage.getItem(CHAVE_IMPORTADO);
      return cru ? JSON.parse(cru) : null;
    } catch {
      return null;
    }
  }

  function salvarImportado(bruto) {
    const rodadas = validar(bruto); // valida antes de salvar
    localStorage.setItem(CHAVE_IMPORTADO, JSON.stringify(bruto));
    return rodadas;
  }

  function limparImportado() {
    localStorage.removeItem(CHAVE_IMPORTADO);
  }

  function temImportado() {
    return lerImportado() !== null;
  }

  // ---------- Carregamento ----------

  async function carregar() {
    const importado = lerImportado();
    if (importado) {
      try {
        return { rodadas: validar(importado), origem: 'rounds.json importado (modo admin)' };
      } catch (e) {
        console.warn('[Real ou IA?] rounds.json importado está inválido, ignorando.', e);
        limparImportado();
      }
    }

    // No arquivo único (Real-ou-IA.html) as imagens já vêm embutidas: buscar o
    // rounds.json externo só traria caminhos quebrados.
    if (window.REALOUIA_ARQUIVO_UNICO) {
      return { rodadas: validar(window.RODADAS_EMBUTIDAS), origem: 'arquivo único (tudo embutido)' };
    }

    // Funciona quando o app é servido por http(s). Em file:// isso falha — e tudo bem.
    try {
      const resposta = await fetch('data/rounds.json', { cache: 'no-store' });
      if (resposta.ok) {
        const bruto = await resposta.json();
        return { rodadas: validar(bruto), origem: 'data/rounds.json' };
      }
    } catch (e) {
      console.info('[Real ou IA?] Não foi possível ler data/rounds.json (normal ao abrir o arquivo direto). Usando data/rounds.js.');
    }

    if (window.RODADAS_EMBUTIDAS) {
      return { rodadas: validar(window.RODADAS_EMBUTIDAS), origem: 'data/rounds.js (cópia offline)' };
    }

    throw new Error('Não encontrei as rodadas. Confira se a pasta "data" está junto do index.html.');
  }

  return { carregar, salvarImportado, limparImportado, temImportado, validar };
})();
