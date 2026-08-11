# =====================================================================
#  REAL OU IA?  -  Gerador do arquivo unico
#  Junta index.html + css + js + TODAS as imagens num unico
#  "Real-ou-IA.html", que roda sozinho em qualquer tablet, sem internet
#  e sem precisar da pasta junto.
#  Use pelo atalho: 2 cliques em "gerar-arquivo-unico.bat".
# =====================================================================

$ErrorActionPreference = 'Stop'
$base    = Split-Path -Parent $MyInvocation.MyCommand.Path
$destino = Join-Path $base 'Real-ou-IA.html'

Write-Host ''
Write-Host '  REAL OU IA?  - gerando arquivo unico...' -ForegroundColor Cyan
Write-Host ''

function Ler($rel) {
    $p = Join-Path $base $rel
    if (-not (Test-Path $p)) { throw "nao encontrei $rel" }
    [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
}

function ParaDataUri($rel) {
    $p = Join-Path $base $rel
    if (-not (Test-Path $p)) { throw "nao encontrei a midia $rel" }
    $ext = [System.IO.Path]::GetExtension($p).ToLower()
    $tipo = switch ($ext) {
        '.jpg'  { 'image/jpeg' }
        '.jpeg' { 'image/jpeg' }
        '.png'  { 'image/png' }
        '.webp' { 'image/webp' }
        '.gif'  { 'image/gif' }
        '.svg'  { 'image/svg+xml' }
        '.mp4'  { 'video/mp4' }
        '.webm' { 'video/webm' }
        default { throw "extensao nao suportada no arquivo unico: $ext ($rel)" }
    }
    $bytes = [System.IO.File]::ReadAllBytes($p)
    "data:$tipo;base64," + [Convert]::ToBase64String($bytes)
}

# ---------- 1. valida e embute as rodadas ----------
$jsonRodadas = Ler 'data\rounds.json'
try { $dados = $jsonRodadas | ConvertFrom-Json }
catch { throw "o rounds.json tem erro de digitacao (JSON invalido): $($_.Exception.Message)" }

$midias = @()
foreach ($r in $dados.rodadas) {
    if ($r.arquivo)     { $midias += $r.arquivo }
    if ($r.imagem_post) { $midias += $r.imagem_post }
}
$midias = $midias | Sort-Object -Unique

$pesoMidias = 0
foreach ($m in $midias) {
    $rel = $m.Replace('/', '\')
    $uri = ParaDataUri $rel
    $pesoMidias += (Get-Item (Join-Path $base $rel)).Length
    # troca o caminho pelo conteudo embutido, dentro do JSON
    $jsonRodadas = $jsonRodadas.Replace('"' + $m + '"', '"' + $uri + '"')
    Write-Host ("    embutida: {0}" -f $m) -ForegroundColor DarkGray
}

# ---------- 2. monta o HTML ----------
$html = Ler 'index.html'
$css  = Ler 'css\estilos.css'
$logo = ParaDataUri 'assets\logo-rec.png'

$js = @(
    "window.REALOUIA_ARQUIVO_UNICO = true;",
    "window.RODADAS_EMBUTIDAS = $jsonRodadas;",
    (Ler 'js\dados.js'),
    (Ler 'js\ranking.js'),
    (Ler 'js\app.js')
) -join "`r`n`r`n"

$html = $html.Replace('<link rel="stylesheet" href="css/estilos.css">', "<style>`r`n$css`r`n</style>")
$html = $html.Replace('<link rel="icon" href="assets/logo-rec.png">', "<link rel=`"icon`" href=`"$logo`">")
$html = $html.Replace('src="assets/logo-rec.png"', "src=`"$logo`"")

$blocoScripts = @'
<script src="data/rounds.js"></script>
<script src="js/dados.js"></script>
<script src="js/ranking.js"></script>
<script src="js/app.js"></script>
'@
$blocoScripts = $blocoScripts.Replace("`n", "`r`n").Replace("`r`r`n", "`r`n")
if ($html -notmatch [regex]::Escape('<script src="js/app.js"></script>')) {
    throw 'nao encontrei o bloco de <script> no index.html'
}
# remove os quatro <script src=...> e poe tudo inline no lugar do ultimo
foreach ($s in @('data/rounds.js','js/dados.js','js/ranking.js')) {
    $html = $html.Replace("<script src=`"$s`"></script>", '')
}
$html = $html.Replace('<script src="js/app.js"></script>', "<script>`r`n$js`r`n</script>")

# ---------- 3. confere que nao sobrou nenhuma referencia externa ----------
$sobrou = @()
foreach ($p in @('href="css/', 'src="js/', 'src="data/', 'src="assets/', 'href="assets/')) {
    if ($html.Contains($p)) { $sobrou += $p }
}
if ($sobrou.Count) { throw "ainda ha referencia externa no arquivo gerado: $($sobrou -join ', ')" }

$utf8SemBom = New-Object System.Text.UTF8Encoding($false)

# ---------- 4. versao AVULSA: sem manifest/icone, que nao existiriam ao lado ----------
$htmlAvulso = [regex]::Replace($html, '<!--PWA-->.*?<!--/PWA-->', '', 'Singleline')
[System.IO.File]::WriteAllText($destino, $htmlAvulso, $utf8SemBom)

# ---------- 5. versao PUBLICAVEL (iPad): pasta pronta para arrastar ----------
$pasta = Join-Path $base 'publicar-ipad'
New-Item -ItemType Directory -Force -Path $pasta | Out-Null
[System.IO.File]::WriteAllText((Join-Path $pasta 'index.html'), $html, $utf8SemBom)
foreach ($f in @('manifest.webmanifest', 'sw.js', 'vercel.json', 'icone-180.png', 'icone-192.png', 'icone-512.png')) {
    $orig = Join-Path $base $f
    if (-not (Test-Path $orig)) { throw "faltando $f para montar a pasta publicar-ipad" }
    Copy-Item $orig (Join-Path $pasta $f) -Force
}

# Zip da mesma pasta: o Netlify Drop aceita zip, e arrastar pasta as vezes falha.
$zip = Join-Path $base 'publicar-ipad.zip'
if (Test-Path $zip) { Remove-Item $zip }
Compress-Archive -Path (Join-Path $pasta '*') -DestinationPath $zip

$mb = (Get-Item $destino).Length / 1MB
Write-Host ''
Write-Host ("  OK! Gerado com {0} rodadas ({1:N1} MB)" -f @($dados.rodadas).Count, $mb) -ForegroundColor Green
Write-Host ''
Write-Host '  1) Real-ou-IA.html   -> ANDROID / computador' -ForegroundColor Green
Write-Host '     arquivo unico, roda offline sem instalar nada.' -ForegroundColor DarkGray
Write-Host '  2) pasta publicar-ipad\ (ou publicar-ipad.zip) -> IPAD' -ForegroundColor Green
Write-Host '     arraste em vercel.com/drop, abra o link no Safari do iPad' -ForegroundColor DarkGray
Write-Host '     e use Compartilhar > Adicionar a Tela de Inicio.' -ForegroundColor DarkGray
Write-Host '     Depois disso ele funciona sem internet.' -ForegroundColor DarkGray
if ($mb -gt 18) {
    Write-Host ''
    Write-Host '  ATENCAO: passou de 18 MB. Alguns apps limitam anexos -' -ForegroundColor Yellow
    Write-Host '  prefira enviar por Google Drive ou reduza as imagens.' -ForegroundColor Yellow
}
Write-Host ''
