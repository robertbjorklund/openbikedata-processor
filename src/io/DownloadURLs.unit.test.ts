import { routesDownloadConfig, trailsDownloadConfig } from "./DownloadURLs";

describe("Overpass queries", () => {
  it("queries designated cycling trails only", () => {
    const query = trailsDownloadConfig.query(null);
    expect(query).not.toContain('way[highway=cycleway]');
    expect(query).toContain('way[highway=path]["bicycle"="designated"]');
    expect(query).toContain('way[highway=path]["mtb:scale"]');
    expect(query).not.toContain('bicycle"!="no"');
    expect(query).not.toContain("cycleway:lane");
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
