# OpenBikeData Processor

Data pipeline that consumes OpenStreetMap data and produces GeoJSON (and eventually Mapbox Vector Tiles) for [OpenBikeMap.org](https://github.com/robertbjorklund/openbikemap.org).

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
  (planned) tippecanoe → openbikemap.mbtiles
```

## Trail types

| Category | OSM sources |
|----------|-------------|
| **Cycleway** | `highway=cycleway`, dedicated `cycleway=*` |
| **MTB trail** | `mtb:scale`, designated MTB paths |
| **Gravel track** | `highway=track` open to cycling |
| **Shared path** | `highway=path/footway` with bicycle access |
| **Bicycle route** | `relation[route=bicycle]` (lcn/ncn/rcn/icn) |

## Installation

```bash
npm install
npm run build
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
| `GENERATE_TILES` | off | Set to `1` when MVT generation is implemented |
| `MAX_OLD_SPACE_SIZE` | `4096` | Node.js heap size in MB |

## Output files

| File | Description |
|------|-------------|
| `trails.geojson` | Individual trail segments with category, surface, MTB scale |
| `routes.geojson` | Bicycle route relations |
| `mapboxgl_*.geojson` | Slim properties for MapLibre rendering |

## Related projects

| Repo | Role |
|------|------|
| [openbikemap.org](https://github.com/robertbjorklund/openbikemap.org) | Frontend |
| `api.openbikemap.org` | Planned REST API |
| `tiles.openbikemap.org` | Planned tile server |

## Roadmap

- [ ] Elevation profiles (port from openskidata-processor)
- [ ] PostgreSQL geocoding cache
- [ ] Trail network clustering
- [ ] MVT generation via tippecanoe
- [ ] Extract `openbikedata-format` npm package

## License

Apache License 2.0
