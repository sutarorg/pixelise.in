import { describe, expect, it } from "vitest";

import { safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("keeps a same-origin path", () => {
    expect(safeNextPath("/studio")).toBe("/studio");
    expect(safeNextPath("/credits?pack=creator")).toBe("/credits?pack=creator");
  });

  it("falls back to the dashboard when nothing was asked for", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
    expect(safeNextPath("   ")).toBe("/dashboard");
  });

  it("refuses absolute and protocol-relative URLs", () => {
    expect(safeNextPath("https://evil.example/login")).toBe("/dashboard");
    expect(safeNextPath("//evil.example/login")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.example/login")).toBe("/dashboard");
    expect(safeNextPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("refuses control characters smuggled into the path", () => {
    expect(safeNextPath("/studio\nSet-Cookie: x=1")).toBe("/dashboard");
  });
});
