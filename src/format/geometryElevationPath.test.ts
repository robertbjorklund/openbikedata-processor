import {
  concatenateLineStrings,
  getLineStringsFromGeometry,
  profileSourceLine,
} from "./geometryElevationPath";

describe("geometryElevationPath", () => {
  it("concatenates adjacent line strings", () => {
    const merged = concatenateLineStrings([
      {
        type: "LineString",
        coordinates: [
          [0, 0],
          [0, 1],
        ],
      },
      {
        type: "MultiLineString",
        coordinates: [
          [
            [0, 1],
            [0, 2],
          ],
        ],
      },
    ]);

    expect(merged?.coordinates).toHaveLength(3);
  });

  it("extracts line strings from multi geometry", () => {
    const lines = getLineStringsFromGeometry({
      type: "MultiLineString",
      coordinates: [
        [
          [0, 0],
          [0, 1],
        ],
        [
          [1, 0],
          [1, 1],
        ],
      ],
    });

    expect(lines).toHaveLength(2);
  });

  it("builds profile source line from multi geometry", () => {
    const line = profileSourceLine({
      type: "MultiLineString",
      coordinates: [
        [
          [18, 59],
          [18.01, 59],
        ],
        [
          [18.01, 59],
          [18.02, 59],
        ],
      ],
    });

    expect(line?.coordinates).toHaveLength(3);
  });
});
