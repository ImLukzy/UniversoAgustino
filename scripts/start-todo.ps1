# EnfermeríaHub — arranque TODO funcional (sin Docker).
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/start-todo.ps1
# Hace: Postgres local :5433 (init+start si falta) -> prisma migrate deploy/seed si DB vacía -> arranca API :4000 + Web :5173
$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $MyInvocation.MyCommand.Path -Parent) -Parent
Set-Location $root

Write-Output "== 1/4 Postgres local :5433 =="
& "$root/scripts/pg-local.ps1" status 2>&1 | Select-Object -First 3
$pgStatus = & "$root/scripts/pg-local.ps1" status 2>&1 | Out-String
if ($pgStatus -notmatch "server is running") {
  Write-Output "Postgres detenido, iniciando…"
  & "$root/scripts/pg-local.ps1" start 2>&1 | Select-Object -Last 5
} else {
  Write-Output "Postgres OK :5433"
}

Write-Output "== 2/4 Prisma (migrate + seed si hace falta) =="
$env:DATABASE_URL = "postgresql://hub:hub123@localhost:5433/enfermeria_hub?schema=public"
$env:PGPASSWORD = "hub123"
$dbExists = & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5433 -U hub -d enfermeria_hub -tAc 'SELECT COUNT(*) FROM "User";' 2>&1 | Out-String
if ($dbExists -match "does not exist|no existe|connection") {
  Write-Output "Creando DB enfermeria_hub…"
  & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -h localhost -p 5433 -U hub enfermeria_hub 2>&1 | Out-String | Write-Output
}
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma 2>&1 | Select-Object -Last 5
$users = & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5433 -U hub -d enfermeria_hub -tAc 'SELECT COUNT(*) FROM "User";' 2>&1 | Out-String
Write-Output "Users en DB: $($users.Trim())"
if ($users.Trim() -eq "0") {
  Write-Output "Seeding demo (admin + creadora + 6 apuntes + 4 bazar)…"
  npm run prisma:seed -w apps/api 2>&1 | Select-Object -Last 5
}

Write-Output "== 3/4 Arrancando API :4000 y Web :5173 (procesos detached) =="
node -e "const {spawn}=require('child_process');const fs=require('fs');const root=process.cwd();function start(name,cmd,args,log){const out=fs.openSync(log,'a');const p=spawn(cmd,args,{cwd:root,detached:true,stdio:['ignore',out,out]});p.unref();console.log(name+' PID:'+p.pid+' -> '+log)};start('API','cmd.exe',['/c','npm','run','dev:api'],'api.log');start('WEB','cmd.exe',['/c','npm','run','dev:web'],'web.log');"
Start-Sleep 8

Write-Output "== 4/4 Verificación =="
try {
  $h = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/health" -TimeoutSec 10
  Write-Output ("API /health OK: " + ($h | ConvertTo-Json -Compress))
  $r = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/ready" -TimeoutSec 10
  Write-Output ("API /ready OK: db=" + $r.db)
  $d = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/documents?pageSize=1" -TimeoutSec 10
  Write-Output ("Documents total=" + $d.total)
} catch {
  Write-Output ("FALLO API: " + $_.Exception.Message)
  Write-Output "Revisa api.log.err"
}
try {
  $w = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 10
  Write-Output ("Web OK: HTTP " + $w.StatusCode)
} catch {
  Write-Output ("FALLO Web: " + $_.Exception.Message)
}

Write-Output ""
Write-Output "TODO FUNCIONAL en:"
Write-Output "  Web:  http://localhost:5173/  (/ /explorar /bazar /monetiza /legal /panel /pedidos /admin)"
Write-Output "  API:  http://localhost:4000/api/v1  docs http://localhost:4000/docs"
Write-Output "  Seeds: admin@hub.local / Admin1234!  ·  creadora@unsa.local / Creadora123!"
