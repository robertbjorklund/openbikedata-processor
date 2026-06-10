export default function overpassTimeoutSeconds(): number {
  const configured = process.env.OVERPASS_TIMEOUT;
  if (configured !== undefined) {
    const parsed = Number.parseInt(configured, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 1800;
}
