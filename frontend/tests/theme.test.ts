import { describe, expect, it } from "vitest";
import { resolvePreferredTheme } from "../src/shared/theme/theme";

describe("color theme preference", () => {
  it("uses a stored explicit theme before the system preference", () => {
    expect(resolvePreferredTheme("light", true)).toBe("light");
    expect(resolvePreferredTheme("dark", false)).toBe("dark");
  });

  it("falls back to the system preference when no theme is stored", () => {
    expect(resolvePreferredTheme(null, true)).toBe("dark");
    expect(resolvePreferredTheme(null, false)).toBe("light");
  });
});
