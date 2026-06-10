import * as Fs from "fs";
import * as JSONStream from "JSONStream";
import osmtogeojson from "osmtogeojson";

const polygonFeatures = {
  building: true,
  highway: {
    included_values: {
      services: true,
      rest_area: true,
      escape: true,
    },
  },
  natural: {
    excluded_values: {
      coastline: true,
      ridge: true,
      arete: true,
      tree_row: true,
    },
  },
  landuse: true,
  leisure: true,
  area: true,
  boundary: true,
};

export default async function convertOSMFileToGeoJSON(
  inputFile: string,
  outputFile: string,
) {
  const osmJSON = await readOSMJSON(inputFile);
  await writeFeatureCollection(convertOSMToGeoJSON(osmJSON), outputFile);
}

export function convertOSMToGeoJSON(osmJSON: any) {
  return osmtogeojson(osmJSON, {
    verbose: false,
    polygonFeatures,
    flatProperties: false,
    uninterestingTags: () => false,
    deduplicator: undefined,
  });
}

async function readOSMJSON(path: string): Promise<any> {
  return await new Promise((resolve, reject) => {
    Fs.createReadStream(path)
      .pipe(JSONStream.parse(null))
      .on("root", function (data) {
        if (data.version) {
          data.version = Math.round(data.version * 1000) / 1000;
        }
        data.elements.forEach(function (element: any) {
          if (element.lat) element.lat = Math.round(element.lat * 1e12) / 1e12;
          if (element.lon) element.lon = Math.round(element.lon * 1e12) / 1e12;
        });
        resolve(data);
      })
      .on("error", reject);
  });
}

function writeFeatureCollection(
  geojson: any,
  path: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const outputStream = Fs.createWriteStream(path);
    const separator = "\n";

    outputStream.on("error", reject);
    outputStream.on("finish", resolve);

    outputStream.write(
      `{"type": "FeatureCollection",${separator}"features": [${separator}`,
    );
    geojson.features.forEach(function (f: any, i: number) {
      outputStream.write(JSON.stringify(f));
      if (i !== geojson.features.length - 1) {
        outputStream.write("," + separator);
      }
    });
    outputStream.write(`${separator}]}${separator}`);
    outputStream.end();
  });
}
