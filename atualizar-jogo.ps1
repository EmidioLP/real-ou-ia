# =====================================================================
#  REAL OU IA?  -  Atualizar o jogo (script unico)
#
#  Faz tudo o que precisa ser feito depois de editar data/rounds.json:
#    1. valida o rounds.json
#    2. atualiza data/rounds.js  (copia que faz o index.html abrir por file://)
#    3. gera Real-ou-IA.html     (arquivo unico: Android / PC, sem internet)
#    4. gera publicar-ipad/index.html  (o que a Vercel publica)
#
#  Use pelo atalho: 2 cliques em "atualizar-jogo.bat".
#  Depois: git add -A / git commit / git push  -> a Vercel republica sozinha.
# =====================================================================

$ErrorActionPreference = 'Stop'
$base  = Split-Path -Parent $MyInvocation.MyCommand.Path
$pasta = Join-Path $base 'publicar-ipad'

Write-Host ''
Write-Host '  REAL OU IA?  - atualizando...' -ForegroundColor Cyan
Write-Host ''

function Ler($rel) {
    $p = Join-Path $base $rel
    if (-not (Test-Path $p)) { throw "nao encontrei $rel" }
    [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
}

function ParaDataUri($rel) {
    $p = Join-Path $base $rel
    if (-not (Test-Path $p)) { throw "nao encontrei a midia $rel" }
    $tipo = switch ([System.IO.Path]::GetExtension($p).ToLower()) {
        '.jpg'  { 'image/jpeg' }
        '.jpeg' { 'image/jpeg' }
        '.png'  { 'image/png' }
        '.webp' { 'image/webp' }
        '.gif'  { 'image/gif' }
        '.svg'  { 'image/svg+xml' }
        '.mp4'  { 'video/mp4' }
        '.webm' { 'video/webm' }
        default { throw "extensao nao suportada: $rel" }
    }
    "data:$tipo;base64," + [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($p))
}

$utf8SemBom = New-Object System.Text.UTF8Encoding($false)

# ---------- 1. valida o rounds.json ----------
$jsonOriginal = Ler 'data\rounds.json'
try { $dados = $jsonOriginal | ConvertFrom-Json }
catch {
    Write-Host '  ERRO: o rounds.json tem um erro de digitacao (JSON invalido).' -ForegroundColor Red
    Write-Host "        $($_.Exception.Message)" -ForegroundColor Red
    Write-Host '  Dica: virgula sobrando antes de "]" ou "}" e o erro mais comum.' -ForegroundColor Yellow
    exit 1
}
$qtd = @($dados.rodadas).Count
if ($qtd -lt 1) { Write-Host '  ERRO: nenhuma rodada em "rodadas".' -ForegroundColor Red; exit 1 }

# ---------- 2. data/rounds.js (para abrir por file://) ----------
$cabecalho = @"
/* ---------------------------------------------------------------
   ARQUIVO GERADO AUTOMATICAMENTE - NAO EDITE ESTE ARQUIVO.
   Edite data/rounds.json e rode "atualizar-jogo.bat".
   Esta copia existe porque o navegador bloqueia a leitura de .json
   quando o index.html e aberto direto do arquivo (file://).
   --------------------------------------------------------------- */
window.RODADAS_EMBUTIDAS =
"@
[System.IO.File]::WriteAllText(
    (Join-Path $base 'data\rounds.js'),
    $cabecalho + "`r`n" + $jsonOriginal.TrimEnd() + ";`r`n",
    $utf8SemBom)
Write-Host "    data/rounds.js atualizado ($qtd rodadas)" -ForegroundColor DarkGray

# ---------- 3. embute as midias dentro do JSON ----------
$midias = @()
foreach ($r in $dados.rodadas) {
    if ($r.arquivo)     { $midias += $r.arquivo }
    if ($r.imagem_post) { $midias += $r.imagem_post }
}
$jsonEmbutido = $jsonOriginal
foreach ($m in ($midias | Sort-Object -Unique)) {
    $jsonEmbutido = $jsonEmbutido.Replace('"' + $m + '"', '"' + (ParaDataUri $m.Replace('/', '\')) + '"')
    Write-Host ("    embutida: {0}" -f $m) -ForegroundColor DarkGray
}

# ---------- 4. monta o HTML completo ----------
$html = Ler 'index.html'
$css  = Ler 'css\estilos.css'
$logo = ParaDataUri 'assets\logo-rec.png'

$js = @(
    'window.REALOUIA_ARQUIVO_UNICO = true;',
    "window.RODADAS_EMBUTIDAS = $jsonEmbutido;",
    (Ler 'js\dados.js'),
    (Ler 'js\ranking.js'),
    (Ler 'js\app.js')
) -join "`r`n`r`n"

$html = $html.Replace('<link rel="stylesheet" href="css/estilos.css">', "<style>`r`n$css`r`n</style>")
$html = $html.Replace('<link rel="icon" href="assets/logo-rec.png">', "<link rel=`"icon`" href=`"$logo`">")
$html = $html.Replace('src="assets/logo-rec.png"', "src=`"$logo`"")

if ($html -notmatch [regex]::Escape('<script src="js/app.js"></script>')) { throw 'nao achei o bloco de <script> no index.html' }
foreach ($s in @('data/rounds.js', 'js/dados.js', 'js/ranking.js')) {
    $html = $html.Replace("<script src=`"$s`"></script>", '')
}
$html = $html.Replace('<script src="js/app.js"></script>', "<script>`r`n$js`r`n</script>")

# nao pode ter sobrado nada apontando para fora do arquivo
$sobrou = @()
foreach ($p in @('href="css/', 'src="js/', 'src="data/', 'src="assets/', 'href="assets/')) {
    if ($html.Contains($p)) { $sobrou += $p }
}
if ($sobrou.Count) { throw "sobrou referencia externa: $($sobrou -join ', ')" }

$marcadorPwa = '<!--PWA-->'
if (-not $html.Contains($marcadorPwa)) { throw "nao achei o marcador $marcadorPwa no index.html" }

# ---------- 5. Real-ou-IA.html (Android / PC, sem manifest ao lado) ----------
$avulso = $html.Replace($marcadorPwa, '')
[System.IO.File]::WriteAllText((Join-Path $base 'Real-ou-IA.html'), $avulso, $utf8SemBom)

# ---------- 6. publicar-ipad/index.html (o que a Vercel publica) ----------
if (-not (Test-Path $pasta)) { throw 'faltando a pasta publicar-ipad' }
foreach ($f in @('manifest.webmanifest', 'sw.js', 'vercel.json', 'icone-180.png', 'icone-192.png', 'icone-512.png')) {
    if (-not (Test-Path (Join-Path $pasta $f))) { throw "faltando publicar-ipad\$f" }
}
$tagsPwa = '<link rel="manifest" href="manifest.webmanifest">' + "`r`n" +
           '<link rel="apple-touch-icon" href="icone-180.png">'
$publicado = $html.Replace($marcadorPwa, $tagsPwa)
[System.IO.File]::WriteAllText((Join-Path $pasta 'index.html'), $publicado, $utf8SemBom)

$mb = (Get-Item (Join-Path $pasta 'index.html')).Length / 1MB
Write-Host ''
Write-Host ("  OK! {0} rodadas, {1:N1} MB por pacote" -f $qtd, $mb) -ForegroundColor Green
Write-Host ''
Write-Host '  publicar-ipad\index.html  -> e o que vai para a Vercel' -ForegroundColor Green
Write-Host '  Real-ou-IA.html           -> arquivo unico avulso (Android / PC)' -ForegroundColor Green
Write-Host ''
Write-Host '  Agora envie para o GitHub que a Vercel republica sozinha:' -ForegroundColor Cyan
Write-Host '     git add -A' -ForegroundColor White
Write-Host '     git commit -m "Atualiza rodadas"' -ForegroundColor White
Write-Host '     git push' -ForegroundColor White
Write-Host ''
