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

## Trail types

We include **designated cycling trails** only — not every street or path that allows bikes.

| Category | OSM sources |
|----------|-------------|
| **Cycleway** | `highway=cycleway` |
| **MTB trail** | `mtb:scale` on path/track |
| **Gravel track** | `highway=track` + `bicycle=designated` |
| **Shared path** | `highway=path/footway/bridleway` + `bicycle=designated` |
| **Bicycle route** | `relation[route=bicycle]` (lcn/ncn/rcn/icn) |

Unnamed shared paths shorter than 50 m and gravel tracks shorter than 100 m are dropped during formatting.

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
| `OVERPASS_ENDPOINT` | (auto) | Force a single Overpass mirror URL if auto-rotation fails |
| `OVERPASS_ENDPOINTS` | kumi → fr → z → lz4 | Comma-separated mirror order (optional) |
| `OVERPASS_TIMEOUT` | `1800` | Overpass query timeout in seconds (use `7200` for Sweden) |
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

## Roadmap

- [ ] Elevation profiles (port from openskidata-processor)
- [ ] PostgreSQL geocoding cache
- [ ] Trail network clustering
- [x] MVT generation via tippecanoe (`GENERATE_TILES=1`)
- [ ] Extract `openbikedata-format` npm package

## License

Apache License 2.0
