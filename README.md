# 🤖 REAL OU IA?

Mini-game de adivinhação para apresentação sobre fake news e conteúdo gerado por IA.
Roda **offline**, direto no navegador do tablet, sem instalar nada e sem servidor.

---

## 📲 Para levar o jogo ao tablet de outra pessoa

👉 **Passo a passo completo em [COMO-ENVIAR.md](COMO-ENVIAR.md).**

Existem duas versões, geradas pelo `atualizar-jogo.bat`:

| Destino | O que usar | Como funciona |
|---|---|---|
| **iPad** | pasta **`publicar-ipad/`** | Publique na Vercel importando este repositório (**Root Directory: `publicar-ipad`**), abra o link no Safari e use **Adicionar à Tela de Início**. Vira ícone e passa a funcionar **offline**. |
| **Android** | arquivo **`Real-ou-IA.html`** | Mande por WhatsApp/Drive e abra no Chrome. Roda offline direto, sem instalar nada. |

O `Real-ou-IA.html` tem 6 MB e contém o jogo inteiro — imagens, logo e código — num
arquivo só, sem precisar da pasta junto.

---

## ▶️ Como abrir no seu computador (para editar e testar)

1. Abra o arquivo **`index.html`** no navegador (Chrome ou Edge).
2. Ao tocar em **COMEÇAR**, o app entra em tela cheia sozinho.
3. Deixe a janela na **horizontal (landscape)**.

O ranking fica salvo no próprio navegador (`localStorage`) e **acumula entre os participantes**
enquanto o tablet não for reiniciado nem tiver os dados do navegador limpos.

> 💡 Dica para o dia da apresentação: abra o app, faça um teste, e depois use
> **⚙️ → ZERAR RANKING** antes do primeiro participante de verdade.

### Durante a rodada

Depois de responder, a explicação cobre a imagem. Para conferir a pista com os próprios olhos,
o jogador toca em **🔍 VER IMAGEM**: a explicação some, a imagem volta inteira e aparece o botão
**↩ VOLTAR À EXPLICAÇÃO**. Dá para ir e voltar quantas vezes quiser antes de tocar em PRÓXIMA.
As opções continuam na tela, com a que foi escolhida destacada — assim o jogador lembra o que
respondeu enquanto procura o detalhe.

Com teclado acoplado: `1` / `2` respondem, `Enter` avança, e `V` alterna entre a explicação e a
imagem.

---

## ➕ Como adicionar ou trocar rodadas

São **dois passos**:

### 1. Coloque o arquivo de mídia na pasta `assets/rounds/`

Imagens (`.jpg`, `.png`, `.webp`, `.svg`) ou vídeos (`.mp4`).
Use nomes simples, sem espaços nem acentos: `05-praca.jpg` ✅ / `foto da praça.jpg` ❌

### 2. Edite o arquivo `data/rounds.json`

Cada rodada é um bloco entre `{ }`, separado por vírgula:

```json
{
  "id": 5,
  "nivel": "medio",
  "tipo": "imagem",
  "arquivo": "assets/rounds/05-praca.jpg",
  "credito": "Foto: Fulano de Tal — 2018 — CC BY 4.0",
  "resposta_correta": "ia",
  "explicacao": "Repare no texto da placa ao fundo: as letras não formam palavras."
}
```

| Campo | O que aceita |
|---|---|
| `id` | Número de identificação da rodada (só para você se organizar). |
| `nivel` | `facil`, `medio` ou `dificil` — muda só a etiqueta colorida na tela. |
| `tipo` | `imagem`, `video` ou `fake_news`. |
| `arquivo` | Caminho a partir da pasta do jogo. Ex.: `assets/rounds/05-praca.jpg`. |
| `credito` | *(opcional)* Autor e licença da mídia. Aparece **só depois da resposta**, dentro do bloco de explicação — embaixo da imagem ele entregaria o gabarito. **Obrigatório** para imagens CC BY e CC BY-SA. |
| `resposta_correta` | `real` ou `ia` (para imagem/vídeo). |
| `explicacao` | Texto mostrado depois da resposta. É a parte mais importante do jogo — explique **como** dava para perceber. |

A ordem das rodadas no arquivo é a ordem em que elas aparecem no jogo.
O pacote já vem com as **10 rodadas** do roteiro: 1–3 fáceis, 4–7 médias, 8–10 difíceis.
Você pode trocar só o `arquivo` e a `explicacao` de cada uma, mantendo a estrutura.

### ⚠️ Passo 3 — obrigatório se você abre o `index.html` direto do arquivo

Por segurança, o navegador **não deixa** uma página aberta como arquivo (`file://`) ler um `.json`.
Por isso o jogo mantém uma cópia em `data/rounds.js`. Depois de editar o `rounds.json`, faça **uma** destas opções:

- **No PC:** dê dois cliques em **`atualizar-jogo.bat`**. Ele copia o `rounds.json` para o `rounds.js`, regenera os pacotes e ainda avisa se você esqueceu uma vírgula.
- **No tablet:** abra o jogo → **⚙️** → **📂 Importar rounds.json** → escolha o arquivo. Fica salvo no tablet.

Se você abre o jogo por um servidor local (`http://...`), nada disso é necessário: o `rounds.json` é lido direto.

---

## 🎬 Rodada com vídeo

```json
{
  "id": 6,
  "nivel": "dificil",
  "tipo": "video",
  "arquivo": "assets/rounds/06-entrevista.mp4",
  "resposta_correta": "ia",
  "explicacao": "Deepfake: repare que a boca não acompanha alguns sons e o rosto 'treme' nas bordas."
}
```

O vídeo toca sozinho, em loop e **sem som** (navegadores bloqueiam autoplay com áudio).
Prefira arquivos curtos (5–15 s) e em `.mp4`, que é o formato que todo tablet lê.

---

## 📰 Rodada de fake news *(recurso disponível, não usado nas 10 rodadas atuais)*

O jogo hoje é só de imagens. Mas o formato de post continua funcionando, caso você queira
voltar a incluí-lo depois — é só adicionar um bloco `tipo: "fake_news"` no `rounds.json`.

Mostra um post fictício de rede social e pergunta se a publicação é **REAL** ou **FAKE NEWS**:

```json
{
  "id": 7,
  "nivel": "medio",
  "tipo": "fake_news",
  "autor": "Jornal do Momento",
  "usuario": "@jornaldomomento",
  "tempo": "há 15 minutos",
  "texto_post": "URGENTE! Vacina será obrigatória a partir de amanhã, diz suposto documento vazado.",
  "curtidas": "34 mil",
  "compartilhamentos": "12 mil",
  "resposta_correta": "fake",
  "explicacao": "É fake news. Nenhum veículo confiável publicou isso e o 'documento' não tem origem. Antes de repassar, procure a notícia em pelo menos duas fontes conhecidas."
}
```

- `resposta_correta` aceita **`real`** ou **`fake`**.
- Os campos `autor`, `usuario`, `tempo`, `curtidas` e `compartilhamentos` são opcionais (só enfeitam o post).
- Opcional: `"imagem_post": "assets/rounds/07-print.jpg"` para incluir uma imagem dentro do post.
- Compatibilidade: o formato antigo continua funcionando — `compartilharia` é lido como `real`
  e `nao_compartilharia` como `fake`. Não precisa reescrever arquivos antigos.

---

## 🎨 Identidade visual

O app usa a identidade da **REC — Rede de Estudos Constitucionais**. As cores foram
amostradas diretamente do logo:

| Cor | Código | Onde aparece |
|---|---|---|
| Marrom | `#562008` | Títulos e botão **IA** (e **FAKE NEWS**, se voltar a usar posts) |
| Laranja | `#D05808` | Botão **REAL**, botões principais, destaques |
| Dourado | `#FAB026` | Barra de progresso, bordas, avisos |
| Areia | `#FBF5EC` | Fundo das telas |

O logo está em `assets/logo-rec.png`, **com fundo transparente** (foi convertido do JPEG
original), e aparece na tela inicial, na de resultado e no canto do ranking.

**Para trocar o logo:** substitua o arquivo mantendo o mesmo nome e, de preferência,
o fundo transparente. Se o seu arquivo tiver fundo branco, ele vai aparecer como um
retângulo branco sobre o fundo areia.

**Para mexer nas cores:** todas estão no topo do `css/estilos.css`, no bloco `:root`.
Mudar ali muda o app inteiro.

## ⚙️ Modo administrador

Três formas de abrir:

- Toque no **⚙️** na tela de ranking;
- **5 toques rápidos** no **logo da REC** da tela inicial;
- **Ctrl + Shift + A** (se houver teclado).

Lá dentro você pode:

- **🗑️ ZERAR RANKING** — apaga todos os resultados (use antes de começar de verdade);
- **⬇️ Baixar ranking (.csv)** — salva a lista de participantes para abrir no Excel;
- **📂 Importar rounds.json** — carrega rodadas novas sem mexer nos arquivos;
- **⛶ Tela cheia** — caso o navegador tenha saído do modo tela cheia.

---

## 📁 Estrutura de pastas

```
real-ou-ia/
├── publicar-ipad/             ← 👈 É ESTA PASTA QUE A VERCEL PUBLICA
│   ├── index.html                (gerado: o jogo inteiro num arquivo)
│   ├── manifest.webmanifest      (faz virar app com ícone)
│   ├── sw.js                     (faz funcionar sem internet)
│   ├── vercel.json               (cabeçalhos de cache)
│   └── icone-180/192/512.png
├── index.html                 ← fonte, para editar e testar no computador
├── atualizar-jogo.bat         ← 2 cliques depois de mexer no rounds.json
├── atualizar-jogo.ps1
├── COMO-ENVIAR.md             ← passo a passo do envio
├── README.md
├── CREDITOS.md
├── css/
│   └── estilos.css
├── js/
│   ├── dados.js               ← carrega e valida as rodadas
│   ├── ranking.js             ← placar no localStorage
│   └── app.js                 ← fluxo do jogo
├── data/
│   ├── rounds.json            ← 👈 é aqui que você edita as rodadas
│   └── rounds.js              ← cópia automática (não edite à mão)
└── assets/
    ├── logo-rec.png           ← logo da REC (fundo transparente)
    └── rounds/                ← 👈 é aqui que vão as imagens e vídeos
        ├── 01-lincoln-ia.jpg
        ├── 02-cao-enchente-real.jpg
        ├── 03-documento-ia.jpg
        ├── 04-feira-real.jpg
        ├── 05-prato-ia.jpg
        ├── 06-hotel-ia.jpg
        ├── 07-mammatus-real.jpg
        ├── 08-rosto-ia.jpg
        ├── 09-rosto-real.jpg
        └── 10-terremoto-real.jpg
```

> O `Real-ou-IA.html` (arquivo único para Android/PC) também é gerado pelo
> `atualizar-jogo.bat`, mas fica fora do repositório por ser derivado e pesado.

As imagens são **fotos e imagens de IA reais**, com licença livre e origem verificada.
Autores e licenças estão em [CREDITOS.md](CREDITOS.md) — leia antes de trocar qualquer arquivo.

## 🎯 As 10 rodadas

São **5 fotos reais e 5 imagens de IA**, alternadas para que ninguém acerte por padrão.

| # | Nível | Resposta | O que ensina |
|---|---|---|---|
| 1 | Fácil | IA | Lincoln com smartphone: antes de caçar defeito, veja se a cena **poderia** existir. |
| 2 | Fácil | REAL | Cão resgatado no RS (2024): desfoque óptico, pelo e calçamento irregulares. |
| 3 | Fácil | IA | Documento histórico com texto embaralhado + mão deformada. **Sempre leia o texto da imagem.** |
| 4 | Médio | REAL | Feira (2015): centenas de detalhes pequenos e independentes, sem repetição. |
| 5 | Médio | IA | Foto de comida: o erro está nos **objetos** (talher retorcido), não no prato. |
| 6 | Médio | IA | Hotel na costa italiana: a mais convincente do jogo. A arquitetura não fecha e os carros estão derretidos. |
| 7 | Médio | REAL | Nuvens mammatus: a **data** (1973) prova o que os olhos não provam. |
| 8 | Difícil | IA | Rosto StyleGAN perfeito, mas o fundo vira mancha e o cordão some de um lado. |
| 9 | Difícil | REAL | Comparação direta com a 8 — imperfeição de pele é sinal de câmera. |
| 10 | Difícil | REAL | Estrada rompida no terremoto de Ridgecrest (2019). Fecha a dinâmica: foto real também engana quando vem com legenda falsa. |

## 🔎 Como escolher novas imagens sem errar o gabarito

Esta é a parte mais fácil de errar. **Bancos de imagem como Unsplash, Pexels e Freepik hoje
hospedam imagens de IA misturadas com fotos**, muitas sem rótulo — "peguei de um banco de fotos"
não prova nada. Use procedência, não aparência:

- **Para o lado REAL:** prefira foto com data de captura anterior a 2021, ou de arquivo
  institucional (Wikimedia Commons, NOAA, NASA, prefeituras, museus). Antes de 2021 não existia
  geração fotorrealista acessível — a data é a prova.
- **Para o lado IA:** use só imagem cuja geração esteja documentada na origem
  (categorias "AI-generated" do Wikimedia Commons, datasets conhecidos, ou desmentido de agência
  de checagem como Lupa, Aos Fatos e AFP Checamos).

O raciocínio completo está em [CREDITOS.md](CREDITOS.md).

A rodada 10 é a mais convincente de todas, de propósito: ela existe para o fechamento da
conversa — se uma imagem assim pode ser fabricada em segundos, a pergunta deixa de ser
"parece real?" e passa a ser "de onde isso veio?".

---

## ❓ Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Editei o `rounds.json` e nada mudou | Faltou rodar o `atualizar-jogo.bat` (veja o passo 3 acima). |
| "Não encontrei o arquivo desta rodada" | O nome no `arquivo` está diferente do nome real, ou o arquivo não está em `assets/rounds/`. |
| Uma rodada sumiu do jogo | Algum campo obrigatório está faltando ou escrito errado; o jogo pula a rodada em vez de travar. Abra o `atualizar-jogo.bat` para ver o aviso. |
| O ranking sumiu | O navegador do tablet limpou os dados do site (aba anônima ou limpeza automática). Não use aba anônima. |
| A tela pede para girar o tablet | O jogo é feito para a horizontal. |

---

## 🗣️ Fechamento sugerido (do roteiro)

> "E aí, foi fácil identificar o que era real e o que era IA?"
> "Em algumas imagens você teve certeza e acabou errando?"
> "É justamente esse o ponto: hoje, conteúdos produzidos por IA podem parecer extremamente reais.
> Antes de acreditar ou compartilhar, verifique a fonte e busque outras informações."
>
> **"Antes de compartilhar, pare, pense e verifique."**
