<#
.SYNOPSIS
  Start the web app on the project's agent port (CLAUDE.md: 3110) in dev mode, run a command against it, always stop it.
  Dev mode only: a static export (output: 'export') can't be served by next start, and the app has no date override,
  so the team template's -Mode prod and -DevToday are left out.
.EXAMPLE
  .claude/skills/run-web/serve.ps1 -Cmd "node .claude/skills/run-web/shoot.mjs --out $env:TEMP\shell-390.png"
#>
param(
  [Parameter(Mandatory = $true)][string]$Cmd
)
$ErrorActionPreference = 'Stop'
$Port = 3110
$web = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\web')).Path
$pnpm = (Get-Command pnpm.cmd -ErrorAction SilentlyContinue).Source
if (-not $pnpm) { $pnpm = Join-Path $env:APPDATA 'npm\pnpm.cmd' }

if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
  throw "port $Port is already in use; never stop a server you didn't start - ask the user (3000 belongs to the user)"
}

$server = Start-Process -FilePath $pnpm -ArgumentList @('dev', '--port', "$Port") -WorkingDirectory $web -PassThru -WindowStyle Hidden
try {
  $ok = $false
  for ($i = 0; $i -lt 120 -and -not $ok; $i++) {
    try { $ok = (Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:$Port/" -TimeoutSec 60).StatusCode -eq 200 }
    catch { Start-Sleep -Milliseconds 500 }
  }
  if (-not $ok) { throw "server on $Port did not answer 200 within about a minute" }
  Write-Output "web (dev) up on http://localhost:$Port"
  Invoke-Expression $Cmd
} finally {
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 800
  $left = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue).Count
  Write-Output "port $Port listeners left: $left"
}
