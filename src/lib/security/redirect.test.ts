import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./redirect";

describe("safeInternalPath", () => {
  it("accepts a local absolute path", () => {
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
  });

  it("preserves local paths with query strings", () => {
    expect(safeInternalPath("/dashboard?tab=courses")).toBe("/dashboard?tab=courses");
  });

  it("rejects protocol-relative external URLs", () => {
    expect(safeInternalPath("//attacker.example")).toBe("/dashboard");
  });

  it("rejects absolute external URLs", () => {
    expect(safeInternalPath("https://attacker.example")).toBe("/dashboard");
  });

  it("rejects backslash-based redirect tricks", () => {
    expect(safeInternalPath("/\\attacker.example")).toBe("/dashboard");
  });

  it("uses a caller-provided fallback", () => {
    expect(safeInternalPath(null, "/sign-in")).toBe("/sign-in");
  });
});
