# 📲 Como colocar o jogo no iPad dela

O iPad é mais fechado que o Android: **ele não abre direito um arquivo HTML guardado
no app Arquivos**. Por isso o caminho aqui não é mandar um arquivo — é publicar o jogo
num link e instalar esse link como aplicativo.

Parece mais trabalhoso, mas tem uma vantagem grande: no fim ela fica com um **ícone da REC
na tela de início**, o jogo abre em tela cheia sem barra de navegador, e **funciona sem
internet** depois da primeira abertura.

⏱️ Leva uns 5 minutos, uma vez só.

---

## Parte 1 — publicar (você, no computador, com internet)

O projeto está no GitHub em **[EmidioLP/real-ou-ia](https://github.com/EmidioLP/real-ou-ia)**.
Conectando esse repositório à Vercel, o endereço fica **fixo para sempre** e cada `git push`
republica sozinho — sem link novo, sem reinstalar no iPad.

1. Envie o projeto para o GitHub:

   ```bash
   git push -u origin main
   ```

2. Acesse **[vercel.com/new](https://vercel.com/new)** → **Import Git Repository** →
   escolha `real-ou-ia`.
3. ⚠️ **O passo que não pode errar:** em **Root Directory**, clique em *Edit* e selecione
   a pasta **`publicar-ipad`**.
   - É essa pasta que contém a versão empacotada do jogo (um arquivo só, com as imagens
     dentro). Publicando a raiz do repositório o jogo até abre, mas o modo offline fica
     menos garantido.
4. Clique em **Deploy**. Em alguns segundos sai o endereço, tipo
   `https://real-ou-ia.vercel.app`.
5. **Copie esse link.** É ele que vai para o iPad.

Não precisa configurar mais nada: a pasta já tem `index.html` na raiz e um `vercel.json`
que ajusta os cabeçalhos de cache — sem ele, o iPad poderia ficar preso numa versão antiga
depois de uma atualização.

### Alternativa rápida, sem GitHub

Arraste a pasta `publicar-ipad` em
**[vercel.com/drop](https://vercel.com/drop)**.

> ⚠️ Nesse caminho, **cada arrastada cria um projeto NOVO**, com endereço diferente — e o
> ícone já instalado no iPad continuaria apontando para a versão velha. Serve para um teste
> rápido; para a versão que vai ser usada, prefira o GitHub.

> Qualquer hospedagem com **https://** funciona (Netlify, GitHub Pages…). O `vercel.json`
> é ignorado pelas outras e não atrapalha.

---

## Parte 2 — instalar no iPad (com internet, uma vez só)

Faça isso **em casa ou no escritório**, com wi-fi bom — não no local da apresentação.

1. Abra o link no **Safari** (precisa ser o Safari; no Chrome do iPad não funciona).
2. Espere a página carregar por completo e a tela inicial do jogo aparecer.
3. Toque no botão **Compartilhar** (o quadradinho com a seta para cima, no topo).
4. Role e toque em **Adicionar à Tela de Início**.
5. Confirme o nome (**Real ou IA?**) e toque em **Adicionar**.

Pronto: aparece o ícone da REC na tela do iPad.

6. **Importante:** abra o jogo pelo ícone **uma vez ainda com internet** e espere a tela
   inicial aparecer. É nesse momento que o iPad guarda o jogo inteiro para uso offline
   (as 10 imagens já vêm dentro do próprio arquivo, então uma abertura basta).

---

## Parte 3 — testar sem internet (faça antes do dia!)

1. Ative o **Modo Avião** no iPad.
2. Abra o jogo pelo ícone.
3. Jogue uma partida inteira e confira se **as 10 imagens aparecem**.

Se tudo funcionar no modo avião, vai funcionar na apresentação mesmo sem wi-fi. ✅

Se alguma imagem não aparecer: desligue o modo avião, abra o jogo, jogue uma partida
completa de novo (para o iPad terminar de guardar tudo) e repita o teste.

---

## Antes do primeiro participante

Abra o jogo → toque **5 vezes seguidas no logo da REC** (ou use o ⚙️ na tela de ranking)
→ **ZERAR RANKING**. Isso apaga os resultados dos testes.

---

## ⚠️ Dois avisos sobre o iPad

**1. Não deixe o iPad bloquear a tela.** Ajustes → Tela e Brilho → Bloqueio automático →
**Nunca**. Senão ele apaga entre um participante e outro.

**2. Se aparecer o aviso amarelo** *"este navegador não está guardando dados"* na tela
inicial, o ranking não vai acumular entre os participantes (o jogo funciona normalmente,
mas cada pessoa só vê o próprio resultado). Isso acontece se o jogo for aberto em aba
anônima do Safari. Abrindo pelo **ícone da tela de início**, não deve acontecer.

---

## 🤖 E se aparecer um tablet Android

Aí é bem mais simples, e nem precisa de internet:

1. Mande o arquivo **`Real-ou-IA.html`** por WhatsApp (como **documento**), e-mail ou Drive.
2. No tablet: **Arquivos → Downloads → toque nele → abrir com Chrome**.
3. Para virar ícone: no Chrome, ⋮ → **Adicionar à tela inicial**.

---

## 🔧 Se você mudar alguma rodada depois

1. Edite `data/rounds.json`.
2. Dê 2 cliques em **`atualizar-jogo.bat`** (faz tudo: valida o JSON, atualiza a cópia
   offline e regenera os dois pacotes).
3. Envie para o GitHub:

   ```bash
   git add -A
   ```

   ```bash
   git commit -m "Atualiza rodadas"
   ```

   ```bash
   git push
   ```

A Vercel detecta o push e republica sozinha, **no mesmo endereço**. No iPad, basta abrir
o jogo pelo ícone uma vez com internet: ele troca para a versão nova automaticamente.

> Se nada mudar no iPad, feche o app de vez (deslize para cima na multitarefa) e abra de
> novo — assim o service worker antigo é substituído.

---

## 📋 Resumo

| | iPad | Android |
|---|---|---|
| O que usar | pasta `publicar-ipad` → [vercel.com/drop](https://vercel.com/drop) → link | arquivo `Real-ou-IA.html` |
| Precisa de internet | só para instalar, uma vez | nunca |
| Vira ícone de app | sim (Safari → Adicionar à Tela de Início) | sim (Chrome → Adicionar à tela inicial) |
| Funciona offline depois | sim | sim |
