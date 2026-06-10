import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { configFromEnvironment } from "../Config";
import { GeoJSONOutputPaths } from "../io/GeoJSONFiles";

async function countByProperty(
  path: string,
  property: string,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const stream = createReadStream(path, { encoding: "utf-8" });
  const reader = createInterface({ input: stream });

  const propertyPattern = new RegExp(`"${property}"\\s*:\\s*"([^"]+)"`);

  for await (const line of reader) {
    const match = line.match(propertyPattern);
    if (!match) {
      continue;
    }
    const value = match[1];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
}

function printCounts(title: string, counts: Map<string, number>) {
  console.log(title);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [key, count] of sorted) {
    console.log(`  ${key}: ${count}`);
  }
  console.log(`  total: ${sorted.reduce((sum, [, count]) => sum + count, 0)}`);
}

async function main(): Promise<void> {
  const config = configFromEnvironment();
  const paths = new GeoJSONOutputPaths(config.outputDir);

  console.log("OpenBikeMap data summary");
  console.log(`Output: ${config.outputDir}`);
  console.log("");

  const trailCategories = await countByProperty(paths.trails, "category");
  printCounts("Trail categories:", trailCategories);
  console.log("");

  const routeNetworks = await countByProperty(paths.routes, "network");
  printCounts("Route networks:", routeNetworks);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
