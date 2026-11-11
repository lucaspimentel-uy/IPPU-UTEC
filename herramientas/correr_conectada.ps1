<#
.SYNOPSIS
  Corre demo\verificacion\conectada.js N veces sobre una base descartable y deja, por corrida, todo lo que hace falta para
  entender una falla: la salida, los logs, y el estado de la maquina muestreado cada 5 s (§5.167 d).

.DESCRIPTION
  Por cada corrida:
    1. recrea la base descartable y su carpeta de archivos, y levanta la API (:8001) y la demo (:5500) con
       preparar_presentacion.ps1 -Base <base> -PuertoApi 8001 (corrido directo, con la salida a archivo: nunca por un pipe);
    2. (opcional, -ConContraste) mide el contraste sobre esa base recien cargada, ANTES de que conectada.js escriba;
    3. corre conectada.js (ESCRIBE en la base) con un tope de tiempo (CONECTADA_LIMITE_MS: al vencer vuelca el diagnostico);
    4. mientras tanto, cada -MuestreoSegundos muestrea: memoria disponible, pool no paginado y % de memoria comprometida,
       las conexiones TCP por estado (ESTABLISHED, TIME_WAIT) en los puertos de la demo y de la API, y la memoria de los
       procesos node, python y chrome (todos los de la maquina);
    5. guarda en <Salida>\corrida-NN\: conectada.txt (stdout y stderr juntos, incluye el diagnostico si hubo), api.log, demo.log,
       preparar.log, muestras.csv (y contraste.txt);
    6. detiene lo que arranco (preparar_presentacion.ps1 -Detener).
  Al final imprime una tabla (corrida, resultado, chequeos que fallan, duracion, memoria libre minima, TIME_WAIT maximo) y la guarda
  en <Salida>\resumen.txt. Resultado: OK | FALLA (algun chequeo) | ABORTADA (el script se cayo o venció el tope) | PREPARACION.

  Nunca toca :8000, ni la base de la presentacion, ni la de trabajo: se niega con -Base ippu, ippu_test o ippu_presentacion, y si hay
  una presentacion preparada (el registro de preparar_presentacion.ps1 apunta a otra base con procesos vivos) NO corre, porque
  recrearia y pararia lo de la presentacion.

  Las contrasenas salen del ENTORNO (como en preparar_presentacion.ps1): IPPU_PASSWORD (admin), IPPU_DEMO_PASSWORD (tecnicos),
  IPPU_EMAIL (opcional). No se imprimen.

.PARAMETER Corridas
  Cuantas veces. Por omision 1.
.PARAMETER Base
  Base descartable. Por omision ippu_ver.
.PARAMETER Salida
  Carpeta de salida, FUERA del repo. Por omision %TEMP%\ippu-correr-conectada\<fecha-hora>.
.PARAMETER ServidorDemo
  http.server (por omision) | http11 | cola128: ver preparar_presentacion.ps1 (medicion, §5.167 f).
.PARAMETER LimiteMinutos
  Tope de cada corrida de conectada.js. Por omision 30.
.PARAMETER MuestreoSegundos
  Cada cuanto se muestrea. Por omision 5.
.PARAMETER ConContraste
  Antes de conectada.js, corre herramientas\verificar_contraste_ui.js sobre la base recien cargada (sólo lee).

.EXAMPLE
  $env:IPPU_PASSWORD = '...'; $env:IPPU_DEMO_PASSWORD = '...'
  powershell -ExecutionPolicy Bypass -File herramientas\correr_conectada.ps1 -Corridas 4 -ConContraste *> $env:TEMP\correr.txt
#>
[CmdletBinding()]
param(
  [ValidateRange(1, 100)][int]$Corridas = 1,
  [string]$Base = 'ippu_ver',
  [string]$Salida = '',
  [ValidateSet('http.server', 'http11', 'cola128')][string]$ServidorDemo = 'http.server',
  [ValidateRange(1, 240)][int]$LimiteMinutos = 30,
  [ValidateRange(1, 120)][int]$MuestreoSegundos = 5,
  [switch]$ConContraste
)

$ErrorActionPreference = 'Stop'
$PuertoApi = 8001
$PuertoDemo = 5500
$Repo = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Repo 'implementacion\L1-hce-idea\backend'
$Verificacion = Join-Path $Repo 'implementacion\L1-hce-idea\demo\verificacion'
$Preparar = Join-Path $PSScriptRoot 'preparar_presentacion.ps1'
$Estado = Join-Path $env:TEMP 'ippu-presentacion.json'
$LogApiOrigen = Join-Path $env:TEMP 'ippu-presentacion-api.log'
$LogDemoOrigen = Join-Path $env:TEMP 'ippu-presentacion-demo.log'

function Parar([string]$Mensaje) { Write-Host "ERROR: $Mensaje" -ForegroundColor Red; exit 1 }
function Paso([string]$Texto) { Write-Host "`n== $Texto" -ForegroundColor Cyan }

# ---------------------------------------------------------------------------------------------------------------
# Validar TODO antes de tocar nada
# ---------------------------------------------------------------------------------------------------------------
if ($Base -notmatch '^[a-z_][a-z0-9_]*$') { Parar "-Base '$Base' no es un nombre de base valido." }
if (@('ippu', 'ippu_test', 'ippu_presentacion', 'postgres', 'template0', 'template1') -contains $Base) {
  Parar "-Base $Base no es una base descartable: este script ESCRIBE (conectada.js crea, firma y agrega addendas). Usar ippu_ver."
}
foreach ($nombre in 'IPPU_PASSWORD', 'IPPU_DEMO_PASSWORD') {
  $v = [Environment]::GetEnvironmentVariable($nombre)
  if (-not $v) { Parar "Falta la variable de entorno $nombre (la contrasena no va en el script)." }
}
$EmailAdmin = if ($env:IPPU_EMAIL) { $env:IPPU_EMAIL } else { 'admin@demo.ippu.test' }
$Node = Get-Command node -ErrorAction SilentlyContinue
if (-not $Node) { Parar 'No encuentro node en el PATH.' }
if (-not (Test-Path (Join-Path $Verificacion 'node_modules\playwright'))) { Parar "Falta Playwright: cd $Verificacion; npm ci; npx playwright install chromium" }
if (-not (Test-Path (Join-Path $Backend '.venv\Scripts\python.exe'))) { Parar 'No existe el .venv del backend (CLAUDE.md, Como correr, paso 1).' }

if (-not $Salida) { $Salida = Join-Path (Join-Path $env:TEMP 'ippu-correr-conectada') (Get-Date -Format 'yyyyMMdd-HHmmss') }
$Salida = [IO.Path]::GetFullPath($Salida)
if ($Salida.StartsWith($Repo, [StringComparison]::OrdinalIgnoreCase)) { Parar "-Salida ($Salida) esta dentro del repo: las corridas dejan logs y muestras que no se versionan. Usar una carpeta fuera." }
New-Item -ItemType Directory -Force $Salida | Out-Null

# La presentacion preparada: preparar_presentacion.ps1 detendria "la corrida anterior" y la base se recrearia sobre ella.
if (Test-Path $Estado) {
  try {
    $e = Get-Content $Estado -Raw | ConvertFrom-Json
    $vivo = $false
    foreach ($r in @($e.api, $e.demo)) { if ($r -and (Get-Process -Id $r.pid -ErrorAction SilentlyContinue)) { $vivo = $true } }
    if ($vivo -and $e.base -ne $Base) { Parar "Hay una corrida de preparar_presentacion.ps1 viva sobre la base '$($e.base)': no la piso. Detenerla antes (-Detener) o esperar." }
  } catch { }
}
foreach ($par in @(@('API', $PuertoApi), @('demo', $PuertoDemo))) {
  $c = Get-NetTCPConnection -LocalPort $par[1] -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($c -and -not (Test-Path $Estado)) {
    $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    Parar "El puerto $($par[1]) ($($par[0])) lo usa PID $($c.OwningProcess) ($(if ($p) { $p.ProcessName } else { '?' })) y no lo arranque yo: no lo toco."
  }
}

# ---------------------------------------------------------------------------------------------------------------
# Muestreo
# ---------------------------------------------------------------------------------------------------------------
$cMem = New-Object System.Diagnostics.PerformanceCounter('Memory', 'Available MBytes')
$cPool = New-Object System.Diagnostics.PerformanceCounter('Memory', 'Pool Nonpaged Bytes')
$cCommit = New-Object System.Diagnostics.PerformanceCounter('Memory', '% Committed Bytes In Use')
$null = $cMem.NextValue(); $null = $cPool.NextValue(); $null = $cCommit.NextValue()

function Contar-Tcp($Conexiones, [int]$Puerto, [string]$EstadoTcp) {
  # ESTABLISHED: solo el extremo del servidor (LocalPort) para no contar cada conexion dos veces. TIME_WAIT vive en UN extremo (el que cerro
  # primero), asi que se cuenta donde este: local o remoto.
  if ($EstadoTcp -eq 'Established') { return @($Conexiones | Where-Object { $_.State -eq 'Established' -and $_.LocalPort -eq $Puerto }).Count }
  return @($Conexiones | Where-Object { $_.State -eq $EstadoTcp -and ($_.LocalPort -eq $Puerto -or $_.RemotePort -eq $Puerto) }).Count
}
function Memoria-De([string[]]$Nombres) {
  $m = (Get-Process -Name $Nombres -ErrorAction SilentlyContinue | Measure-Object -Property WorkingSet64 -Sum).Sum
  if ($m) { return [math]::Round($m / 1MB) } else { return 0 }
}
function Tomar-Muestra([int]$Corrida, [datetime]$Inicio) {
  $tcp = @(Get-NetTCPConnection -ErrorAction SilentlyContinue)
  return [pscustomobject][ordered]@{
    corrida = $Corrida
    hora = (Get-Date).ToString('HH:mm:ss')
    seg = [int]((Get-Date) - $Inicio).TotalSeconds
    libre_mb = [int][math]::Round($cMem.NextValue())
    pool_nopaginado_mb = [int][math]::Round($cPool.NextValue() / 1MB)
    comprometida_pct = [math]::Round($cCommit.NextValue(), 1)
    demo_established = Contar-Tcp $tcp $PuertoDemo 'Established'
    demo_time_wait = Contar-Tcp $tcp $PuertoDemo 'TimeWait'
    api_established = Contar-Tcp $tcp $PuertoApi 'Established'
    api_time_wait = Contar-Tcp $tcp $PuertoApi 'TimeWait'
    node_mb = Memoria-De @('node')
    python_mb = Memoria-De @('python')
    chrome_mb = Memoria-De @('chrome', 'chrome-headless-shell', 'headless_shell')
  }
}

# Corre una linea de cmd con la salida (stdout+stderr) a un archivo, SIN heredar los handles de quien llama, y la espera muestreando.
# Devuelve @{ codigo; vencio }. A los $LimiteMinutos + 1 minuto la baja con taskkill /T.
function Correr-Muestreando([string]$Linea, [string]$Carpeta, [string]$Archivo, [int]$Corrida, $Muestras, [int]$TopeMin) {
  $cmd = Start-Process -FilePath "$env:SystemRoot\System32\cmd.exe" -ArgumentList '/d', '/c', "`"$Linea > `"$Archivo`" 2>&1`"" `
    -WorkingDirectory $Carpeta -WindowStyle Hidden -PassThru
  $null = $cmd.Handle
  $inicio = Get-Date
  $vencio = $false
  while (-not $cmd.WaitForExit($MuestreoSegundos * 1000)) {
    $Muestras.Add((Tomar-Muestra $Corrida $script:InicioCorrida)) | Out-Null
    if (((Get-Date) - $inicio).TotalMinutes -gt ($TopeMin + 1)) {
      $vencio = $true
      & taskkill /PID $cmd.Id /T /F 2>&1 | Out-Null
      $null = $cmd.WaitForExit(10000)
      break
    }
  }
  $Muestras.Add((Tomar-Muestra $Corrida $script:InicioCorrida)) | Out-Null
  return @{ codigo = $(if ($vencio) { -1 } else { $cmd.ExitCode }); vencio = $vencio }
}

# preparar_presentacion.ps1 corrido DIRECTO (powershell hijo, salida a archivo; nunca por un pipe, §5.167 c). Devuelve su codigo de salida.
function Correr-Preparar([string[]]$Argumentos, [string]$Archivo) {
  $p = Start-Process -FilePath 'powershell.exe' -ArgumentList (@('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$Preparar`"") + $Argumentos) `
    -RedirectStandardOutput $Archivo -RedirectStandardError "$Archivo.err" -WindowStyle Hidden -PassThru
  $null = $p.Handle
  $p.WaitForExit()
  return $p.ExitCode
}

function Detener-Lo-Arrancado([string]$Archivo) {
  $null = Correr-Preparar @('-Detener') $Archivo
}

# ---------------------------------------------------------------------------------------------------------------
# Corridas
# ---------------------------------------------------------------------------------------------------------------
$ramaTxt = (& git -C $Repo rev-parse --abbrev-ref HEAD 2>$null); $commitTxt = (& git -C $Repo rev-parse --short HEAD 2>$null)
Write-Host "correr_conectada: $Corridas corrida(s) · base $Base · API :$PuertoApi · demo :$PuertoDemo ($ServidorDemo) · rama $ramaTxt · commit $commitTxt"
Write-Host "salida: $Salida"

$envGuardado = @{}
foreach ($v in 'API', 'DEMO', 'IPPU_ADMIN_EMAIL', 'IPPU_ADMIN_PASSWORD', 'CONFIRMA_BASE_DESCARTABLE', 'CONECTADA_LIMITE_MS', 'PYTHONUTF8', 'PATH') { $envGuardado[$v] = [Environment]::GetEnvironmentVariable($v) }
$filas = New-Object System.Collections.Generic.List[object]

try {
  for ($n = 1; $n -le $Corridas; $n++) {
    $dir = Join-Path $Salida ('corrida-{0:D2}' -f $n)
    New-Item -ItemType Directory -Force $dir | Out-Null
    $script:InicioCorrida = Get-Date
    $muestras = New-Object System.Collections.Generic.List[object]
    $resultado = 'OK'; $fallan = ''; $contraste = '-'
    Paso "Corrida $n de $Corridas"

    $codPrep = Correr-Preparar @('-Base', $Base, '-PuertoApi', "$PuertoApi", '-ServidorDemo', $ServidorDemo) (Join-Path $dir 'preparar.log')
    if ($codPrep -ne 0) {
      $resultado = 'PREPARACION'; $fallan = "preparar_presentacion.ps1 salio con $codPrep (ver preparar.log)"
      Write-Host "  $fallan" -ForegroundColor Red
    } else {
      $env:API = "http://127.0.0.1:$PuertoApi"; $env:DEMO = "http://127.0.0.1:$PuertoDemo"
      $env:IPPU_ADMIN_EMAIL = $EmailAdmin; $env:IPPU_ADMIN_PASSWORD = $env:IPPU_PASSWORD
      $env:CONFIRMA_BASE_DESCARTABLE = '1'; $env:PYTHONUTF8 = '1'
      $env:CONECTADA_LIMITE_MS = [string]($LimiteMinutos * 60 * 1000)
      $env:PATH = (Join-Path $Backend '.venv\Scripts') + ';' + $envGuardado['PATH']      # conectada.js lee el PDF del IC con el `python` del PATH (pypdf)

      if ($ConContraste) {
        $r = Correr-Muestreando "`"$($Node.Source)`" `"$(Join-Path $PSScriptRoot 'verificar_contraste_ui.js')`"" $Repo (Join-Path $dir 'contraste.txt') $n $muestras 10
        $contraste = if ($r.codigo -eq 0) { 'OK' } else { "FALLA($($r.codigo))" }
        Write-Host "  contraste: $contraste"
      }

      $r = Correr-Muestreando "`"$($Node.Source)`" conectada.js" $Verificacion (Join-Path $dir 'conectada.txt') $n $muestras $LimiteMinutos
      $txt = if (Test-Path (Join-Path $dir 'conectada.txt')) { Get-Content (Join-Path $dir 'conectada.txt') -Raw -Encoding UTF8 } else { '' }
      $ids = @([regex]::Matches($txt, '(?m)^FAIL\s+\(([^)]+)\)') | ForEach-Object { $_.Groups[1].Value })
      $fallan = $ids -join ','
      if ($r.codigo -eq 0) { $resultado = 'OK' }
      elseif ($r.vencio -or $txt -match 'DIAGN.STICO' -or -not $ids.Count) { $resultado = 'ABORTADA' }
      else { $resultado = 'FALLA' }
      Write-Host "  conectada.js: $resultado (codigo $($r.codigo))$(if ($fallan) { ' · fallan: ' + $fallan })"
    }

    # Los logs de los servidores (los pisa la corrida siguiente) y las muestras, ANTES de detener.
    foreach ($par in @(@($LogApiOrigen, 'api.log'), @($LogDemoOrigen, 'demo.log'))) { if (Test-Path $par[0]) { Copy-Item $par[0] (Join-Path $dir $par[1]) -Force } }
    Detener-Lo-Arrancado (Join-Path $dir 'detener.log')
    if ($muestras.Count) { $muestras | Export-Csv -Path (Join-Path $dir 'muestras.csv') -NoTypeInformation -Encoding UTF8 }

    $dur = [int]((Get-Date) - $script:InicioCorrida).TotalSeconds
    $libreMin = if ($muestras.Count) { ($muestras | Measure-Object -Property libre_mb -Minimum).Minimum } else { '-' }
    $twDemo = if ($muestras.Count) { ($muestras | Measure-Object -Property demo_time_wait -Maximum).Maximum } else { '-' }
    $twApi = if ($muestras.Count) { ($muestras | Measure-Object -Property api_time_wait -Maximum).Maximum } else { '-' }
    $filas.Add([pscustomobject][ordered]@{ Corrida = $n; Resultado = $resultado; Fallan = $(if ($fallan) { $fallan } else { '-' }); Contraste = $contraste
        Duracion_s = $dur; Libre_min_MB = $libreMin; TW_max_demo = $twDemo; TW_max_api = $twApi; Muestras = $muestras.Count })
  }
}
finally {
  foreach ($v in $envGuardado.Keys) { [Environment]::SetEnvironmentVariable($v, $envGuardado[$v], 'Process') }
  # Lo que arranco este script, abajo, pase lo que pase (Ctrl-C incluido). Los puertos tienen que quedar libres.
  Detener-Lo-Arrancado (Join-Path $Salida 'detener-final.log')
}

Paso 'Resumen'
$tabla = ($filas | Format-Table -AutoSize | Out-String -Width 200).TrimEnd()
Write-Host $tabla
$cabecera = "correr_conectada · rama $ramaTxt · commit $commitTxt · base $Base · servidor de la demo: $ServidorDemo · $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Set-Content -Path (Join-Path $Salida 'resumen.txt') -Value ($cabecera + "`r`n`r`n" + $tabla) -Encoding UTF8
$filas | Export-Csv -Path (Join-Path $Salida 'resumen.csv') -NoTypeInformation -Encoding UTF8
foreach ($par in @(@('API', $PuertoApi), @('demo', $PuertoDemo))) {
  $c = Get-NetTCPConnection -LocalPort $par[1] -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($c) { Write-Host "ATENCION: el puerto $($par[1]) ($($par[0])) sigue ocupado (PID $($c.OwningProcess))." -ForegroundColor Yellow }
  else { Write-Host "puerto $($par[1]) ($($par[0])): libre" }
}
Write-Host "salida guardada en $Salida"
$malas = @($filas | Where-Object { $_.Resultado -ne 'OK' }).Count
exit $(if ($malas) { 1 } else { 0 })
