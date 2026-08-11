# =====================================================================
#  REAL OU IA?  -  Sincronizador de rodadas
#  Copia o conteudo de data/rounds.json para data/rounds.js.
#  Necessario porque, ao abrir o index.html direto do arquivo (file://),
#  o navegador bloqueia a leitura de arquivos .json por seguranca.
#  Use pelo atalho: 2 cliques em "sincronizar-rounds.bat".
# =====================================================================

$ErrorActionPreference = 'Stop'
$base    = Split-Path -Parent $MyInvocation.MyCommand.Path
$origem  = Join-Path $base 'data\rounds.json'
$destino = Join-Path $base 'data\rounds.js'

Write-Host ''
Write-Host '  REAL OU IA?  - sincronizando rodadas...' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path $origem)) {
    Write-Host "  ERRO: nao encontrei $origem" -ForegroundColor Red
    exit 1
}

$json = [System.IO.File]::ReadAllText($origem, [System.Text.Encoding]::UTF8)

# Valida o JSON antes de gravar, para nao quebrar o jogo com um arquivo torto.
try {
    $dados = $json | ConvertFrom-Json
} catch {
    Write-Host '  ERRO: o rounds.json tem um erro de digitacao (JSON invalido).' -ForegroundColor Red
    Write-Host "        $($_.Exception.Message)" -ForegroundColor Red
    Write-Host '  Dica: virgula sobrando antes de "]" ou "}" e o erro mais comum.' -ForegroundColor Yellow
    exit 1
}

$qtd = @($dados.rodadas).Count
if ($qtd -lt 1) {
    Write-Host '  ERRO: nenhuma rodada encontrada dentro de "rodadas".' -ForegroundColor Red
    exit 1
}

$cabecalho = @"
/* ---------------------------------------------------------------
   ARQUIVO GERADO AUTOMATICAMENTE - NAO EDITE ESTE ARQUIVO.
   Edite data/rounds.json e rode "sincronizar-rounds.bat".
   Esta copia existe porque o navegador bloqueia a leitura de .json
   quando o index.html e aberto direto do arquivo (file://).
   --------------------------------------------------------------- */
window.RODADAS_EMBUTIDAS =
"@

$conteudo = $cabecalho + "`r`n" + $json.TrimEnd() + ";`r`n"
$utf8SemBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($destino, $conteudo, $utf8SemBom)

Write-Host "  OK! $qtd rodada(s) copiadas para data\rounds.js" -ForegroundColor Green
Write-Host '  Agora e so recarregar o jogo no tablet.' -ForegroundColor Green
Write-Host ''
