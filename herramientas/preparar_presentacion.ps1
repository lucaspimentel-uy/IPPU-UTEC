<#
.SYNOPSIS
  Deja la demo lista para la presentacion con UN comando: base nueva, API y demo arriba (D0, handoff.md §5.139).

.DESCRIPTION
  Recrea la base de la presentacion (por omision `ippu_presentacion`), aplica el esquema y los catalogos, crea el
  admin, levanta la API, carga la demo por la API y sirve la demo HTML. Volver a correrlo da el mismo resultado:
  detiene lo que arranco la corrida anterior (y SOLO eso) y rehace todo. Recargar despues del 2026-11-13, para que
  las fechas de firma (las estampa el servidor) no queden antes de las de evaluacion.

  Las contrasenas salen del ENTORNO y no se imprimen nunca:
    IPPU_PASSWORD       contrasena del admin (obligatoria, 8 caracteres como minimo)
    IPPU_DEMO_PASSWORD  contrasena de los dos tecnicos de la demo (obligatoria)
    IPPU_EMAIL          email del admin (opcional; por omision admin@demo.ippu.test)

  Conexion a Postgres: sale del DATABASE_URL del .env del backend, cambiando solo el nombre de la base. Nunca toca
  la base del .env: se niega a escribir en `ippu_test` (siempre) y en `ippu` (salvo -ConfirmarBaseDeTrabajo).

.PARAMETER Base
  Nombre de la base a recrear. Por omision `ippu_presentacion`.
.PARAMETER PuertoApi
  Puerto de la API. Por omision 8000.
.PARAMETER PuertoDemo
  Puerto de la demo HTML. Por omision 5500 (el que permite el CORS de la API; con otro, el script lo ajusta).
.PARAMETER ConfirmarBaseDeTrabajo
  Necesario para operar sobre la base `ippu` (la de trabajo del .env). Borra todo lo que tenga.
.PARAMETER Detener
  Detiene la API y la demo que arranco este script (no toca la base) y termina.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File herramientas\preparar_presentacion.ps1
  powershell -ExecutionPolicy Bypass -File herramientas\preparar_presentacion.ps1 -Detener
#>
[CmdletBinding(DefaultParameterSetName = 'Preparar')]
param(
  [string]$Base = 'ippu_presentacion',
  [int]$PuertoApi = 8000,
  [int]$PuertoDemo = 5500,
  [Parameter(ParameterSetName = 'Preparar')][switch]$ConfirmarBaseDeTrabajo,
  [Parameter(ParameterSetName = 'Detener', Mandatory = $true)][switch]$Detener
)

$ErrorActionPreference = 'Stop'
$Contenedor = 'ippu-postgres'
$Repo = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Repo 'implementacion\L1-hce-idea\backend'
$Demo = Join-Path $Repo 'implementacion\L1-hce-idea\demo'
$Python = Join-Path $Backend '.venv\Scripts\python.exe'
$Estado = Join-Path $env:TEMP 'ippu-presentacion.json'      # PID e inicio de lo que arranco este script
$LogApi = Join-Path $env:TEMP 'ippu-presentacion-api.log'
$LogDemo = Join-Path $env:TEMP 'ippu-presentacion-demo.log'

function Parar([string]$Mensaje) { Write-Host "ERROR: $Mensaje" -ForegroundColor Red; exit 1 }
function Paso([string]$Texto) { Write-Host "`n== $Texto" -ForegroundColor Cyan }

# Los ejecutables nativos escriben avisos por stderr: con 'Stop' eso aborta; se mira el codigo de salida.
function Nativo([scriptblock]$Bloque) {
  $previo = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { & $Bloque } finally { $ErrorActionPreference = $previo }
}

function Dueno-Del-Puerto([int]$Puerto) {
  $c = Get-NetTCPConnection -LocalPort $Puerto -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $c) { return $null }
  $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
  return "PID $($c.OwningProcess) ($(if ($p) { $p.ProcessName } else { 'proceso desconocido' }))"
}

function Leer-Estado {
  if (-not (Test-Path $Estado)) { return $null }
  try { return Get-Content $Estado -Raw | ConvertFrom-Json } catch { return $null }
}

# Detiene (con sus hijos) un proceso que arranco este script: solo si el PID sigue siendo el mismo proceso.
function Detener-Propio($Registro, [string]$Nombre) {
  if (-not $Registro) { return }
  $p = Get-Process -Id $Registro.pid -ErrorAction SilentlyContinue
  if ($p -and $p.StartTime.ToString('o') -eq $Registro.inicio) {
    Nativo { taskkill /PID $Registro.pid /T /F | Out-Null }
    Write-Host "  detenido: $Nombre (PID $($Registro.pid))"
  }
}

function Detener-Todo {
  $e = Leer-Estado
  if ($e) { Detener-Propio $e.api 'API'; Detener-Propio $e.demo 'demo' }
  if (Test-Path $Estado) { Remove-Item $Estado -Force }
  Start-Sleep -Milliseconds 500
}

function Informar-Puertos {
  $ocupado = $false
  foreach ($par in @(@('API', $PuertoApi), @('demo', $PuertoDemo))) {
    $dueno = Dueno-Del-Puerto $par[1]
    if ($dueno) { Write-Host "  ATENCION: el puerto $($par[1]) ($($par[0])) lo usa $dueno, que NO arranco este script: no lo toque." -ForegroundColor Yellow; $ocupado = $true }
    else { Write-Host "  puerto $($par[1]) ($($par[0])): libre" }
  }
  return $ocupado
}

# ---------------------------------------------------------------------------------------------------------------
# -Detener
# ---------------------------------------------------------------------------------------------------------------
if ($Detener) {
  Paso 'Detener lo que arranco este script'
  if (-not (Leer-Estado)) { Write-Host '  nada registrado: no hay nada que detener' }
  Detener-Todo
  Informar-Puertos | Out-Null
  exit 0
}

# ---------------------------------------------------------------------------------------------------------------
# 0 · Validar TODO antes de tocar nada
# ---------------------------------------------------------------------------------------------------------------
if ($Base -notmatch '^[a-z_][a-z0-9_]*$') { Parar "-Base '$Base' no es un nombre de base valido (minusculas, digitos y guion bajo)." }
if ($Base -eq 'ippu_test') { Parar "-Base ippu_test: es la base de pytest (la suite hace drop_all sobre ella). Me niego, siempre." }
if (@('postgres', 'template0', 'template1') -contains $Base) { Parar "-Base $Base es una base del sistema. Me niego." }
if ($Base -eq 'ippu' -and -not $ConfirmarBaseDeTrabajo) {
  Parar "-Base ippu es la base de TRABAJO del .env: se borraria todo lo que tiene. Si es lo que queres, agrega -ConfirmarBaseDeTrabajo."
}
if ($PuertoApi -eq $PuertoDemo) { Parar 'La API y la demo no pueden usar el mismo puerto.' }

$EmailAdmin = if ($env:IPPU_EMAIL) { $env:IPPU_EMAIL } else { 'admin@demo.ippu.test' }
foreach ($nombre in 'IPPU_PASSWORD', 'IPPU_DEMO_PASSWORD') {
  $valor = [Environment]::GetEnvironmentVariable($nombre)
  if (-not $valor) { Parar "Falta la variable de entorno $nombre (la contrasena no va en el script). Definila en esta terminal: `$env:${nombre} = '...'" }
  if ($valor.Length -lt 8) { Parar "$nombre tiene que tener 8 caracteres como minimo." }
}
if (-not (Test-Path $Python)) { Parar "No existe $Python. Crear el entorno: CLAUDE.md, 'Como correr', paso 1." }
$EnvBackend = Join-Path $Backend '.env'
if (-not (Test-Path $EnvBackend)) { Parar "No existe $EnvBackend (copiar .env.example y completar SECRET_KEY)." }

# Conexion: la del .env del backend, cambiando solo el nombre de la base.
$urlEnv = (Get-Content $EnvBackend -Encoding UTF8 | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1)
if (-not $urlEnv) { $urlEnv = 'DATABASE_URL=postgresql+psycopg://ippu:ippu@localhost:5440/ippu' }
if ($urlEnv -notmatch '=\s*(postgresql\S*://([^:/@]+)(?::[^@]*)?@[^/\s]+/)([^\s?]+)') { Parar "No entiendo el DATABASE_URL del .env: $urlEnv" }
$UrlBase = $Matches[1]; $UsuarioDb = $Matches[2]
$DatabaseUrl = "$UrlBase$Base"

# ---------------------------------------------------------------------------------------------------------------
# 1 · Docker y Postgres
# ---------------------------------------------------------------------------------------------------------------
Paso 'Docker y Postgres'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Parar 'No encuentro el comando docker.' }
Nativo { docker info *> $null }
if ($LASTEXITCODE -ne 0) { Parar 'Docker Desktop no responde: abrilo y esperá a que arranque.' }
$estadoPg = Nativo { docker inspect -f '{{.State.Running}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' $Contenedor }
if ($LASTEXITCODE -ne 0 -or $estadoPg -notmatch '^true\b' -or $estadoPg -match 'unhealthy|starting') {
  Parar "El contenedor $Contenedor no esta arriba y sano ('$estadoPg'). Desde el backend: docker compose up -d"
}
Write-Host "  ${Contenedor}: arriba ($estadoPg)"

# ---------------------------------------------------------------------------------------------------------------
# 2 · Puertos libres (lo que arranco la corrida anterior de este script se detiene; lo demas, no se toca)
# ---------------------------------------------------------------------------------------------------------------
Paso 'Puertos'
$previo = Leer-Estado
if ($previo) { Write-Host '  hay una corrida anterior de este script: la detengo'; Detener-Todo }
foreach ($par in @(@('API', $PuertoApi), @('demo', $PuertoDemo))) {
  $dueno = Dueno-Del-Puerto $par[1]
  if ($dueno) { Parar "El puerto $($par[1]) ($($par[0])) esta ocupado por $dueno y no lo arranque yo. Frenalo vos o usa otro puerto; no mato procesos ajenos." }
  Write-Host "  puerto $($par[1]) ($($par[0])): libre"
}

# El entorno de este proceso se restaura al terminar, haya salido bien o mal: no deja DATABASE_URL puesto en tu terminal.
$guardado = @{}
foreach ($v in 'DATABASE_URL', 'IPPU_SEED_DESTINO', 'IPPU_EMAIL', 'PYTHONUTF8', 'CORS_ORIGINS') { $guardado[$v] = [Environment]::GetEnvironmentVariable($v) }
$salidaPrevia = $null
try { $salidaPrevia = [Console]::OutputEncoding; [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false) } catch { }

try {
  # -------------------------------------------------------------------------------------------------------------
  # 3 · Base nueva
  # -------------------------------------------------------------------------------------------------------------
  Paso "Base '$Base': borrar y crear"
  Nativo { docker exec $Contenedor psql -U $UsuarioDb -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $Base WITH (FORCE)" -c "CREATE DATABASE $Base" }
  if ($LASTEXITCODE -ne 0) { throw "No pude recrear la base $Base." }

  $env:DATABASE_URL = $DatabaseUrl
  $env:IPPU_SEED_DESTINO = $Base                       # la guardia de seed_demo / crear_usuario (§5.139)
  $env:IPPU_EMAIL = $EmailAdmin
  $env:PYTHONUTF8 = '1'
  $env:CORS_ORIGINS = "[`"http://localhost:$PuertoDemo`",`"http://127.0.0.1:$PuertoDemo`"]"

  Push-Location $Backend
  try {
    Paso 'Esquema y catalogos'
    Nativo { & $Python -m alembic upgrade head }
    if ($LASTEXITCODE -ne 0) { throw 'alembic upgrade head fallo.' }
    Nativo { & $Python -m app.seed_catalogos }
    if ($LASTEXITCODE -ne 0) { throw 'seed_catalogos fallo.' }

    Paso 'Admin'
    Nativo { & $Python -m app.crear_usuario --email $EmailAdmin --nombre 'Coordinación (demo)' --rol admin }
    if ($LASTEXITCODE -ne 0) { throw 'crear_usuario fallo.' }

    # -----------------------------------------------------------------------------------------------------------
    # 4 · API
    # -----------------------------------------------------------------------------------------------------------
    Paso "API en :$PuertoApi"
    $api = Start-Process -FilePath $Python -ArgumentList '-m', 'uvicorn', 'app.main:app', '--port', $PuertoApi `
      -WorkingDirectory $Backend -WindowStyle Hidden -PassThru -RedirectStandardOutput $LogApi -RedirectStandardError "$LogApi.err"
    @{ api = @{ pid = $api.Id; inicio = $api.StartTime.ToString('o') }; demo = $null; base = $Base } | ConvertTo-Json | Set-Content $Estado -Encoding UTF8
    $listo = $false
    for ($i = 0; $i -lt 80 -and -not $api.HasExited; $i++) {
      try { if ((Invoke-WebRequest -Uri "http://127.0.0.1:$PuertoApi/health" -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200) { $listo = $true; break } } catch { }
      Start-Sleep -Milliseconds 500
    }
    if (-not $listo) { throw "La API no respondio /health en el puerto $PuertoApi. Mirar $LogApi.err" }
    Write-Host "  /health: ok (PID $($api.Id))"

    # -----------------------------------------------------------------------------------------------------------
    # 5 · Demo cargada por la API (la guardia lee IPPU_SEED_DESTINO, ya puesto)
    # -----------------------------------------------------------------------------------------------------------
    Paso 'Cargar la demo por la API'
    Nativo { & $Python -m app.seed_demo --url "http://127.0.0.1:$PuertoApi" }
    if ($LASTEXITCODE -ne 0) { throw 'seed_demo fallo.' }
  } finally { Pop-Location }

  # -------------------------------------------------------------------------------------------------------------
  # 6 · La demo HTML
  # -------------------------------------------------------------------------------------------------------------
  Paso "Demo HTML en :$PuertoDemo"
  $web = Start-Process -FilePath $Python -ArgumentList '-m', 'http.server', $PuertoDemo, '--bind', '127.0.0.1' `
    -WorkingDirectory $Demo -WindowStyle Hidden -PassThru -RedirectStandardOutput $LogDemo -RedirectStandardError "$LogDemo.err"
  @{ api = @{ pid = $api.Id; inicio = $api.StartTime.ToString('o') }; demo = @{ pid = $web.Id; inicio = $web.StartTime.ToString('o') }; base = $Base } |
    ConvertTo-Json | Set-Content $Estado -Encoding UTF8
  $listo = $false
  for ($i = 0; $i -lt 20 -and -not $web.HasExited; $i++) {
    try { if ((Invoke-WebRequest -Uri "http://127.0.0.1:$PuertoDemo/index.html" -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200) { $listo = $true; break } } catch { }
    Start-Sleep -Milliseconds 500
  }
  if (-not $listo) { throw "La demo no respondio en el puerto $PuertoDemo. Mirar $LogDemo.err" }
  Write-Host "  index.html: ok (PID $($web.Id))"
}
catch {
  Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host 'Detengo lo que arranque y dejo la base como quedo.' -ForegroundColor Red
  Detener-Todo
  $fallo = $true
}
finally {
  foreach ($v in $guardado.Keys) { [Environment]::SetEnvironmentVariable($v, $guardado[$v], 'Process') }
  try { if ($salidaPrevia) { [Console]::OutputEncoding = $salidaPrevia } } catch { }
}
if ($fallo) { exit 1 }

# ---------------------------------------------------------------------------------------------------------------
# 7 · Listo
# ---------------------------------------------------------------------------------------------------------------
Write-Host "`n== Presentacion lista (base '$Base')" -ForegroundColor Green
Write-Host "  Demo:        http://localhost:$PuertoDemo/index.html?api=http://localhost:$PuertoApi"
Write-Host "  API (docs):  http://localhost:$PuertoApi/docs"
Write-Host '  Entrar con:  gonzalez@demo.ippu.test (tecnico) · torres@demo.ippu.test (tecnico)'
Write-Host "               $EmailAdmin (admin)"
Write-Host '  Contrasenas: las de IPPU_DEMO_PASSWORD (tecnicos) e IPPU_PASSWORD (admin); este script no las imprime.'
Write-Host "  Chequeo:     `$env:API='http://localhost:$PuertoApi'; `$env:DEMO='http://localhost:$PuertoDemo'; node herramientas\verificar_presentacion.js"
Write-Host '  Detener:     powershell -ExecutionPolicy Bypass -File herramientas\preparar_presentacion.ps1 -Detener'
exit 0
