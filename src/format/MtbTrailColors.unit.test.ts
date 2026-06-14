import { TrailCategory } from "./index";
import {
  mtbTrailColor,
  trailColor,
  MTB_TRAIL_COLOR_BLACK,
  MTB_TRAIL_COLOR_ORANGE,
  MTB_TRAIL_COLOR_BLUE,
  MTB_TRAIL_COLOR_GREEN,
  MTB_TRAIL_COLOR_RED,
  TRAIL_COLOR_OTHER,
} from "./MtbTrailColors";

describe("mtbTrailColor", () => {
  it("maps S0 and S1 to green", () => {
    expect(mtbTrailColor(0)).toBe(MTB_TRAIL_COLOR_GREEN);
    expect(mtbTrailColor(1)).toBe(MTB_TRAIL_COLOR_GREEN);
  });

  it("maps S2 to blue", () => {
    expect(mtbTrailColor(2)).toBe(MTB_TRAIL_COLOR_BLUE);
  });

  it("maps S3 to red", () => {
    expect(mtbTrailColor(3)).toBe(MTB_TRAIL_COLOR_RED);
  });

  it("maps S4 to black and S5+ to orange", () => {
    expect(mtbTrailColor(4)).toBe(MTB_TRAIL_COLOR_BLACK);
    expect(mtbTrailColor(5)).toBe(MTB_TRAIL_COLOR_ORANGE);
    expect(mtbTrailColor(6)).toBe(MTB_TRAIL_COLOR_ORANGE);
  });

  it("maps missing scale to other purple", () => {
    expect(mtbTrailColor(null)).toBe(TRAIL_COLOR_OTHER);
  });
});

describe("trailColor", () => {
  it("uses purple for non-MTB trail categories", () => {
    expect(trailColor(TrailCategory.SharedPath, 2)).toBe(TRAIL_COLOR_OTHER);
    expect(trailColor(TrailCategory.GravelTrack, null)).toBe(TRAIL_COLOR_OTHER);
  });
});
