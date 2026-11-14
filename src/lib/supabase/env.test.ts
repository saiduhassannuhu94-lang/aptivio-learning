import { afterEach, describe, expect, it } from "vitest";
import { getSiteUrl } from "./env";

const keys = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_ENV",
  "NODE_ENV",
] as const;

const original = Object.fromEntries(
  keys.map((key) => [key, process.env[key]]),
) as Record<(typeof keys)[number], string | undefined>;

afterEach(() => {
  for (const key of keys) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("getSiteUrl", () => {
  it("uses the current Vercel deployment host for preview callbacks", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "aptivio-preview.example";
    delete process.env.NEXT_PUBLIC_SITE_URL;

    expect(getSiteUrl()).toBe("https://aptivio-preview.example");
  });

  it("uses the canonical APTIVIO domain for production when no URL is configured", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;

    expect(getSiteUrl()).toBe("https://aptivio-learning.vercel.app");
  });

  it("prefers an explicit site URL and removes trailing slashes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://learn.example.com///";
    expect(getSiteUrl()).toBe("https://learn.example.com");
  });

  it("rejects non-HTTP callback URLs", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "ftp://learn.example.com";
    expect(() => getSiteUrl()).toThrow("valid HTTP or HTTPS URL");
  });
});
