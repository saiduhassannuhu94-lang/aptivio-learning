/**
 * Formats an integer amount stored in the currency's minor unit.
 *
 * Example: 125000 kobo becomes ₦1,250.00.
 * Amounts are kept as integers in storage to avoid floating-point money errors.
 */
export function formatMoney(
  amountMinor: number,
  currency = "NGN",
  locale = "en-NG",
): string {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new TypeError("amountMinor must be a safe integer");
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new TypeError("currency must be a three-letter ISO 4217 code");
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits;

  return formatter.format(amountMinor / 10 ** fractionDigits);
}
