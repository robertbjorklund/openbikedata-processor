# OpenBikeData Processor Development Guide

## Build Commands
- `npm run build` - Compile TypeScript to `dist/`
- `npm run check-types` - Type check including tests
- `npm test` - Run unit tests
- `./run.sh` - Full pipeline (download + prepare)
- `./run.sh --skip-download` - Re-run formatting on cached OSM data

## Pipeline Phases
1. **Download** (`src/scripts/download.ts`) - Overpass → OSM JSON → input GeoJSON
2. **Prepare** (`src/scripts/prepare_geojson.ts`) - Format features → output GeoJSON

## Key Files
- `src/io/DownloadURLs.ts` - Overpass queries for bike infrastructure
- `src/transforms/TrailFormatter.ts` - OSM ways → trail features
- `src/transforms/RouteFormatter.ts` - OSM relations → route features
- `src/format/index.ts` - Feature types (future `openbikedata-format` package)
- `src/PrepareGeoJSON.ts` - Pipeline orchestration

## Environment
- Node.js 22 (see `.nvmrc`)
- Set `BBOX` for regional processing during development
