# OpenBikeData Processor

Data pipeline that consumes OpenStreetMap data and produces GeoJSON and Mapbox Vector Tiles for [OpenBikeMap.org](https://github.com/robertbjorklund/openbikemap.org).

Inspired by [openskidata-processor](https://github.com/robertbjorklund/openskidata-processor).

## Architecture

```
Overpass API (OSM)
       ↓
  OSM JSON download
       ↓
  osmtogeojson conversion
       ↓
  TrailFormatter / RouteFormatter
       ↓
  trails.geojson, routes.geojson
  mapboxgl_trails.geojson, mapboxgl_routes.geojson
       ↓
  tippecanoe → openbikemap.mbtiles
```

## Trail and route types

OpenBikeMap separates **MTB trails** and **signed bicycle routes**. Urban cycleways, footways, and other generic designated paths are **not** included.

| Layer | OSM sources | Output |
|-------|-------------|--------|
| **MTB trails** | `path`/`track` with `mtb:scale`, `mtb:scale:imba`, or `mtb=yes` | `trails` MVT layer |
| **Bicycle routes** | `relation[route=bicycle]` (LCN, RCN, NCN, ICN, etc.) | `routes` MVT layer |

The Overpass download and `TrailFormatter` both exclude `highway=cycleway`, footways, bridleways, and paths tagged only with `bicycle=designated`. Unnamed MTB fragments shorter than 200 m are dropped unless they have a name or ref.

When `TRAILS_BBOX_GRID` is set, **trails** are downloaded cell-by-cell (Overpass-friendly) while **bicycle routes** use a single query for the region `BBOX` (complete route relations without cell duplicates).

Signed route geometry may pass through urban streets when the official route does — that is intentional and distinct from importing every local cycle path.

## Installation

```bash
npm install
npm run build
```

### Docker (recommended on Windows)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/). Includes tippecanoe and tile-join. Generates GeoJSON and `openbikemap.mbtiles` in `./data`:

```bash
docker compose run --rm processor
```

Stockholm test region (default bbox):

```bash
BBOX="[17.9,59.32,18.05,59.36]" GENERATE_TILES=1 docker compose run --rm processor
```

Re-run formatting without re-downloading OSM data:

```bash
docker compose run --rm processor ./run.sh --skip-download
```

## Usage

Process a bounding box (example: Stockholm region):

```bash
BBOX="[17.8,59.2,18.2,59.5]" npm run download
BBOX="[17.8,59.2,18.2,59.5]" npm run prepare-geojson
```

Or use the full pipeline:

```bash
BBOX="[17.8,59.2,18.2,59.5]" ./run.sh
```

Re-run formatting without re-downloading:

```bash
./run.sh --skip-download
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BBOX` | (world) | GeoJSON bbox `[west, south, east, north]` |
| `WORKING_DIR` | `data` | Download and intermediate files |
| `OUTPUT_DIR` | `WORKING_DIR` | Final GeoJSON output |
| `GENERATE_TILES` | off | Set to `1` to build `openbikemap.mbtiles` via tippecanoe |
| `ENABLE_ELEVATION` | off | Set to `1` to enrich trails/routes with DEM elevation profiles |
| `ELEVATION_SERVER_URL` | Mapzen Terrarium tiles | Tile URL template with `{z}/{x}/{y}` when elevation is enabled |
| `ELEVATION_SERVER_TILE_ENCODING` | `terrarium` | `terrarium` or `mapbox` terrain RGB encoding |
| `ELEVATION_SERVER_ZOOM` | `12,13,14` | Comma-separated zoom levels to try |
| `OVERPASS_ENDPOINT` | (auto) | Force a single Overpass mirror URL if auto-rotation fails |
| `OVERPASS_ENDPOINTS` | kumi → fr → z → lz4 | Comma-separated mirror order (optional) |
| `OVERPASS_TIMEOUT` | `1800` | Overpass query timeout in seconds (use `7200` for Sweden) |
| `TRAILS_BBOX_GRID` | — | Path to JSON grid for **MTB trail** Overpass downloads (routes still use `BBOX`) |
| `BBOX_GRID` | — | Deprecated alias for `TRAILS_BBOX_GRID` |
| `OVERPASS_GRID_PAUSE_MS` | `90000` | Pause between trail grid cells (ms) |
| `MAX_OLD_SPACE_SIZE` | `4096` | Node.js heap size in MB |

## Output files

| File | Description |
|------|-------------|
| `trails.geojson` | Individual trail segments with category, surface, MTB scale |
| `routes.geojson` | Bicycle route relations |
| `mapboxgl_*.geojson` | Slim properties for MapLibre rendering |
| `openbikemap.mbtiles` | MVT tiles (`GENERATE_TILES=1`) |

### Vector tiles

Requires [tippecanoe](https://github.com/felt/tippecanoe) and `tile-join` on your PATH, or use Docker (see above).

```bash
BBOX="[17.9,59.32,18.05,59.36]" GENERATE_TILES=1 npm run prepare-geojson
npm run extract-tiles data/openbikemap.mbtiles data/openbikemap
```

## Related projects

| Repo | Role |
|------|------|
| [openbikemap.org](https://github.com/robertbjorklund/openbikemap.org) | Frontend |
| [api.openbikemap.org](https://github.com/robertbjorklund/api.openbikemap.org) | REST API |
| [tiles.openbikemap.org](https://github.com/robertbjorklund/tiles.openbikemap.org) | Tile server and MapLibre styles |

## Elevation profiles

Set `ENABLE_ELEVATION=1` during `prepare-geojson` to sample heights from DEM terrain tiles and attach an `elevationProfile` to each `LineString` trail or route. Full GeoJSON (for the API) includes 3D coordinates; MapboxGL export stays slim.

```bash
ENABLE_ELEVATION=1 BBOX="[17.9,59.32,18.05,59.36]" npm run prepare-geojson
```

## Roadmap

- [x] Elevation profiles (port from openskidata-processor)
- [ ] PostgreSQL geocoding cache
- [ ] Trail network clustering
- [x] MVT generation via tippecanoe (`GENERATE_TILES=1`)
- [ ] Extract `openbikedata-format` npm package

## License

Apache License 2.0
