# Postgres local SIN Docker (Windows): usa los binarios ya instalados
# (C:\Program Files\PostgreSQL\18) y crea un cluster propio en el puerto 5433.
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/pg-local.ps1 init   # una vez
#   powershell -ExecutionPolicy Bypass -File scripts/pg-local.ps1 start  # cada día
#   powershell -ExecutionPolicy Bypass -File scripts/pg-local.ps1 stop
param([ValidateSet("init", "start", "stop", "status")][string]$action = "status")

$ErrorActionPreference = "Stop"
$bin = "C:\Program Files\PostgreSQL\18\bin"
$pgRoot = Join-Path $env:LOCALAPPDATA "enfermeria-hub-pg"  # fuera de OneDrive a propósito
$data = Join-Path $pgRoot "data"
$log = Join-Path $pgRoot "log.txt"
$port = 5433
$user = "hub"
$pass = "hub123"

if ($action -eq "init") {
  New-Item -ItemType Directory -Path $pgRoot -Force | Out-Null
  if (-not (Test-Path (Join-Path $data "PG_VERSION"))) {
    $pw = Join-Path $pgRoot "pw.txt"
    Set-Content -LiteralPath $pw -Value $pass -NoNewline
    & "$bin\initdb.exe" -D $data -U $user --auth=scram-sha-256 --pwfile=$pw -E UTF8 | Select-Object -Last 3
    Remove-Item -LiteralPath $pw -Force
    Add-Content -LiteralPath (Join-Path $data "postgresql.conf") "`nport = $port`nlisten_addresses = 'localhost'`n"
    Write-Output "INIT OK en $data (puerto $port, usuario $user)"
  } else {
    Write-Output "Cluster ya existe en $data"
  }
}

if ($action -eq "start") {
  $running = & "$bin\pg_ctl.exe" -D $data status 2>&1 | Out-String
  if ($running -match "_bv_running|server is running") { Write-Output "Postgres ya corre (puerto $port)"; exit 0 }
  & "$bin\pg_ctl.exe" -D $data -l $log -o "-p $port" start
}

if ($action -eq "stop") {
  & "$bin\pg_ctl.exe" -D $data stop
}

if ($action -eq "status") {
  & "$bin\pg_ctl.exe" -D $data status
}
