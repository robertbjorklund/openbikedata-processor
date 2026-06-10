import { routesDownloadConfig, trailsDownloadConfig } from "./DownloadURLs";

describe("Overpass queries", () => {
  it("includes bicycle infrastructure tags in trails query", () => {
    const query = trailsDownloadConfig.query(null);
    expect(query).toContain('way[highway=cycleway]');
    expect(query).toContain('way[highway=path]["mtb:scale"]');
  });

  it("includes bicycle route relations", () => {
    const query = routesDownloadConfig.query(null);
    expect(query).toContain("relation[route=bicycle]");
  });

  it("applies bbox when provided", () => {
    const query = trailsDownloadConfig.query([11, 55, 12, 56]);
    expect(query).toContain("[bbox:55,11,56,12]");
  });
});
