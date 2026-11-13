const MAX_REDIRECT_DECODING_PASSES = 8;

function decodeForRedirectValidation(value: string): string | null {
  let candidate = value;

  for (let pass = 0; pass < MAX_REDIRECT_DECODING_PASSES; pass += 1) {
    try {
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) return candidate;
      candidate = decoded;
    } catch {
      return null;
    }
  }

  // Excessively nested encodings are ambiguous. Fail closed instead of
  // allowing a downstream URL parser or proxy to normalize them differently.
  return null;
}

export function safeInternalPath(value: string | null, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  const decoded = decodeForRedirectValidation(value);
  if (
    !decoded ||
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("\\")
  ) {
    return fallback;
  }

  return value;
}
