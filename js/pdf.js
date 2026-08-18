/* =========================================================
   pdf.js — gerador de PDF do ranking, sem biblioteca externa.

   Monta um PDF 1.4 mínimo à mão (fontes Helvetica embutidas no
   próprio leitor, codificação WinAnsi). Escrito assim para o jogo
   continuar sendo um arquivo só, sem dependência e sem internet.
   ========================================================= */

const PdfRanking = (() => {
  const LARGURA = 595;   // A4 em pontos
  const ALTURA  = 842;
  const MARGEM  = 48;
  const POR_PAGINA = 26;

  /* --- Texto: PDF usa WinAnsi, então acentos viram códigos octais --- */
  const WINANSI_ESPECIAIS = { '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133, '†': 134,
    '‡': 135, 'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140, 'Ž': 142, '‘': 145,
    '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '˜': 152, '™': 153,
    'š': 154, '›': 155, 'œ': 156, 'ž': 158, 'Ÿ': 159 };

  function paraWinAnsi(texto) {
    let saida = '';
    for (const ch of String(texto)) {
      const cod = WINANSI_ESPECIAIS[ch] !== undefined ? WINANSI_ESPECIAIS[ch] : ch.codePointAt(0);
      if (cod > 255) { saida += '?'; continue; }              // emoji e afins
      if (ch === '\\' || ch === '(' || ch === ')') { saida += '\\' + ch; continue; }
      if (cod < 32 || cod > 126) { saida += '\\' + cod.toString(8).padStart(3, '0'); continue; }
      saida += ch;
    }
    return saida;
  }

  /** Largura aproximada do texto, para cortar nomes compridos. */
  function larguraAprox(texto, tamanho) {
    return String(texto).length * tamanho * 0.5;
  }

  function cortar(texto, tamanho, limite) {
    let t = String(texto);
    while (t.length > 1 && larguraAprox(t + '...', tamanho) > limite) t = t.slice(0, -1);
    return t.length < String(texto).length ? t + '...' : t;
  }

  /* --- Blocos do conteúdo de uma página --- */
  function texto(x, y, str, tamanho, negrito, cinza) {
    const fonte = negrito ? '/F2' : '/F1';
    const cor = cinza !== undefined ? `${cinza} ${cinza} ${cinza} rg\n` : '0 0 0 rg\n';
    return `BT\n${cor}${fonte} ${tamanho} Tf\n${x} ${y} Td\n(${paraWinAnsi(str)}) Tj\nET\n`;
  }

  function textoDireita(xFim, y, str, tamanho, negrito, cinza) {
    return texto(xFim - larguraAprox(str, tamanho), y, str, tamanho, negrito, cinza);
  }

  function retangulo(x, y, l, a, tom) {
    return `${tom} ${tom} ${tom} rg\n${x} ${y} ${l} ${a} re\nf\n`;
  }

  /**
   * @param {Array} lista  ranking já ordenado
   * @param {Object} opcoes { titulo, subtitulo, quando }
   * @returns {Uint8Array} bytes do PDF
   */
  function gerar(lista, opcoes = {}) {
    const titulo = opcoes.titulo || 'REAL OU IA?';
    const subtitulo = opcoes.subtitulo || 'REC - Rede de Estudos Constitucionais';
    const quando = opcoes.quando || new Date().toLocaleString('pt-BR');

    const paginas = [];
    const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));

    for (let p = 0; p < totalPaginas; p++) {
      const fatia = lista.slice(p * POR_PAGINA, (p + 1) * POR_PAGINA);
      let c = '';
      let y = ALTURA - MARGEM;

      // Cabeçalho (só na primeira página)
      if (p === 0) {
        c += texto(MARGEM, y, titulo, 24, true);
        y -= 20;
        c += texto(MARGEM, y, subtitulo, 11, false, 0.35);
        y -= 26;
        c += texto(MARGEM, y, 'Resultados da dinamica', 14, true);
        y -= 16;
        c += texto(MARGEM, y, `${lista.length} participante${lista.length === 1 ? '' : 's'}  -  ${quando}`, 10, false, 0.35);
        y -= 22;
      } else {
        c += texto(MARGEM, y, `${titulo} - resultados (continuacao)`, 12, true);
        y -= 22;
      }

      // Cabeçalho da tabela
      c += retangulo(MARGEM, y - 5, LARGURA - 2 * MARGEM, 18, 0.90);
      c += texto(MARGEM + 6, y, 'Pos.', 9, true, 0.2);
      c += texto(MARGEM + 46, y, 'Nome', 9, true, 0.2);
      c += textoDireita(LARGURA - MARGEM - 70, y, 'Acertos', 9, true, 0.2);
      c += textoDireita(LARGURA - MARGEM - 8, y, '%', 9, true, 0.2);
      y -= 20;

      fatia.forEach((r, i) => {
        const pos = p * POR_PAGINA + i + 1;
        if (pos % 2 === 0) c += retangulo(MARGEM, y - 5, LARGURA - 2 * MARGEM, 17, 0.96);
        c += texto(MARGEM + 6, y, `${pos}`, 10, pos <= 3);
        c += texto(MARGEM + 46, y, cortar(r.nome, 10, 300), 10, pos <= 3);
        c += textoDireita(LARGURA - MARGEM - 70, y, `${r.acertos}/${r.total}`, 10, false);
        c += textoDireita(LARGURA - MARGEM - 8, y, `${r.percentual}%`, 10, false, 0.35);
        y -= 17;
      });

      // Rodapé
      c += texto(MARGEM, MARGEM - 12, 'Antes de compartilhar: pare, pense e verifique.', 8, false, 0.5);
      c += textoDireita(LARGURA - MARGEM, MARGEM - 12, `Pagina ${p + 1} de ${totalPaginas}`, 8, false, 0.5);

      paginas.push(c);
    }

    return montarArquivo(paginas);
  }

  /* --- Estrutura do arquivo PDF (objetos + xref) --- */
  function montarArquivo(paginas) {
    const objetos = [];
    const idCatalogo = 1, idPaginas = 2, idFonte1 = 3, idFonte2 = 4;
    const primeiraPagina = 5;

    objetos[idCatalogo] = `<< /Type /Catalog /Pages ${idPaginas} 0 R >>`;

    const idsPaginas = paginas.map((_, i) => primeiraPagina + i * 2);
    objetos[idPaginas] = `<< /Type /Pages /Kids [${idsPaginas.map(id => `${id} 0 R`).join(' ')}] /Count ${paginas.length} >>`;
    objetos[idFonte1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objetos[idFonte2] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

    paginas.forEach((conteudo, i) => {
      const idPag = primeiraPagina + i * 2;
      const idConteudo = idPag + 1;
      objetos[idPag] = `<< /Type /Page /Parent ${idPaginas} 0 R /MediaBox [0 0 ${LARGURA} ${ALTURA}] ` +
        `/Resources << /Font << /F1 ${idFonte1} 0 R /F2 ${idFonte2} 0 R >> >> /Contents ${idConteudo} 0 R >>`;
      objetos[idConteudo] = `<< /Length ${tamanhoEmBytes(conteudo)} >>\nstream\n${conteudo}endstream`;
    });

    let arquivo = '%PDF-1.4\n';
    const deslocamentos = [];
    for (let i = 1; i < objetos.length; i++) {
      deslocamentos[i] = tamanhoEmBytes(arquivo);
      arquivo += `${i} 0 obj\n${objetos[i]}\nendobj\n`;
    }

    const inicioXref = tamanhoEmBytes(arquivo);
    const total = objetos.length;
    arquivo += `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let i = 1; i < total; i++) {
      arquivo += `${String(deslocamentos[i]).padStart(10, '0')} 00000 n \n`;
    }
    arquivo += `trailer\n<< /Size ${total} /Root ${idCatalogo} 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;

    // Cada caractere já cabe em um byte (WinAnsi), então a conversão é direta.
    const bytes = new Uint8Array(arquivo.length);
    for (let i = 0; i < arquivo.length; i++) bytes[i] = arquivo.charCodeAt(i) & 0xff;
    return bytes;
  }

  function tamanhoEmBytes(str) { return str.length; }

  return { gerar };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = PdfRanking;
