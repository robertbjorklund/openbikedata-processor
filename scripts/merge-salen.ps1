param(
  [string]$BaseDir = "data",
  [string]$PatchDir = "data-salen",
  [string]$OutputDir = "data",
  [switch]$Fetch,
  [switch]$SkipTiles
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $RepoRoot

$SalenBbox = "[12.7,61.05,13.05,61.25]"

function Require-BaseDataset {
  param([string]$Dir)
  $trails = Join-Path $Dir "trails.geojson"
  if (-not (Test-Path $trails)) {
    throw "Base dataset not found at '$Dir'. Run a full Sweden build first (e.g. tiles.openbikemap.org\scripts\dev-tiles-sweden.ps1) or set -BaseDir."
  }
}

if ($Fetch) {
  Write-Host "==> Fetching fresh OSM data for Salen bbox $SalenBbox"
  $env:BBOX = $SalenBbox
  $env:WORKING_DIR = $PatchDir
  $env:OUTPUT_DIR = $PatchDir
  $env:GENERATE_TILES = "0"
  Remove-Item Env:TRAILS_BBOX_GRID -ErrorAction SilentlyContinue
  Remove-Item Env:BBOX_GRID -ErrorAction SilentlyContinue

  docker compose run --rm --build processor
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

if (-not (Test-Path $PatchDir)) {
  throw "Patch directory '$PatchDir' not found. Re-run with -Fetch or set -PatchDir."
}

Require-BaseDataset -Dir $BaseDir

Write-Host "==> Merging Salen patch into $OutputDir"
Write-Host "    base:  $BaseDir"
Write-Host "    patch: $PatchDir"
Write-Host "    bbox:  $SalenBbox"

npm run build
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$mergeArgs = @(
  "run",
  "merge-outputs",
  "--",
  $OutputDir,
  $BaseDir,
  $PatchDir,
  "--replace-bbox",
  $SalenBbox
)

if (-not $SkipTiles) {
  $mergeArgs += "--skip-tiles"
}

npm @mergeArgs
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

if (-not $SkipTiles) {
  Write-Host "==> Regenerating openbikemap.mbtiles in Docker"
  $env:WORKING_DIR = $OutputDir
  $env:OUTPUT_DIR = $OutputDir
  $env:GENERATE_TILES = "0"
  docker compose run --rm processor npm run regenerate-tiles
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

Write-Host ""
Write-Host "Done. Merged dataset:"
Write-Host "  $OutputDir\trails.geojson"
Write-Host "  $OutputDir\routes.geojson"
if (-not $SkipTiles) {
  Write-Host "  $OutputDir\openbikemap.mbtiles"
}
Write-Host ""
Write-Host "Deploy to VPS:"
Write-Host "  scp $OutputDir\openbikemap.mbtiles root@SERVER:/opt/openbikemap/data/"
Write-Host "  scp $OutputDir\trails.geojson $OutputDir\routes.geojson root@SERVER:/opt/openbikemap/data/"
