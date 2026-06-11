import { routesDownloadConfig, trailsDownloadConfig } from "./DownloadURLs";

describe("Overpass queries", () => {
  it("queries MTB trails only", () => {
    const query = trailsDownloadConfig.query(null);
    expect(query).not.toContain('way[highway=cycleway]');
    expect(query).not.toContain('way[highway=footway]');
    expect(query).not.toContain('bicycle"="designated"');
    expect(query).toContain('way[highway=path]["mtb:scale"]');
    expect(query).toContain('way[highway=path]["mtb"="yes"]');
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
