import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./redirect";

describe("safeInternalPath", () => {
  it("accepts a local absolute path", () => {
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
  });

  it("preserves local paths with query strings", () => {
    expect(safeInternalPath("/dashboard?tab=courses")).toBe("/dashboard?tab=courses");
  });

  it("preserves ordinary percent-encoded query values", () => {
    expect(safeInternalPath("/dashboard?next=%2Fcourses")).toBe("/dashboard?next=%2Fcourses");
  });

  it("rejects protocol-relative external URLs", () => {
    expect(safeInternalPath("//attacker.example")).toBe("/dashboard");
  });

  it("rejects absolute external URLs", () => {
    expect(safeInternalPath("https://attacker.example")).toBe("/dashboard");
  });

  it.each([
    "/\\\\attacker.example",
    "/%5Cattacker.example",
    "/%5cattacker.example",
    "/%255Cattacker.example",
    "/%25255cattacker.example",
  ])("rejects literal or encoded backslash redirect tricks: %s", (path) => {
    expect(safeInternalPath(path)).toBe("/dashboard");
  });

  it("rejects protocol-relative paths after percent decoding", () => {
    expect(safeInternalPath("/%2F%2Fattacker.example")).toBe("/dashboard");
  });

  it("rejects malformed percent encoding", () => {
    expect(safeInternalPath("/dashboard?next=%")).toBe("/dashboard");
  });

  it("uses a caller-provided fallback", () => {
    expect(safeInternalPath(null, "/sign-in")).toBe("/sign-in");
  });
});
