export const SUPPORTED_CURRENCIES = [
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "GBP", label: "Pound Sterling", symbol: "£" },
  { code: "CHF", label: "Swiss Franc", symbol: "Fr." },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "SEK", label: "Swedish Krona", symbol: "kr" },
  { code: "NOK", label: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", label: "Danish Krone", symbol: "kr" },
  { code: "PLN", label: "Polish Złoty", symbol: "zł" },
  { code: "CZK", label: "Czech Koruna", symbol: "Kč" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "EUR";

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return SUPPORTED_CURRENCIES.some((c) => c.code === code);
}

function symbolFor(code: string): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

// =====================
// CENTS ⇄ UNITS
// =====================
// All money in the app is stored as signed integer CENTS (hundredths of the
// display unit), regardless of currency. For zero-decimal currencies like JPY,
// the factor is still 100 — `formatMoney` relies on Intl to render the right
// number of decimals, and the scale factor just means "one yen" is stored as
// 100. This keeps the storage scheme uniform and the display layer currency-
// aware.

export function unitsToCents(units: number): number {
  return Math.round(units * 100);
}

export function centsToUnits(cents: number): number {
  return cents / 100;
}

/**
 * Render an integer-cents amount to a user-editable input string.
 * - 13400 → "134"      (no trailing ".00" when the fraction is zero)
 * - 13464 → "134.64"
 * -     0 → ""         (empty, so placeholders show)
 */
export function centsToInputString(cents: number): string {
  if (cents === 0) return "";
  const units = cents / 100;
  return Number.isInteger(units) ? String(units) : units.toFixed(2);
}

/**
 * Parse user-typed money string → integer cents.
 * Accepts European (1.234,56) and US (1,234.56) formats, bare integers,
 * optional sign, optional currency symbols. Returns null if unparseable.
 *
 *   parseMoneyInput("134,64")  → 13464
 *   parseMoneyInput("1.234,56")→ 123456
 *   parseMoneyInput("1,234.56")→ 123456
 *   parseMoneyInput("134")     → 13400
 *   parseMoneyInput("-50")     → -5000
 *   parseMoneyInput("€ 12")    → 1200
 */
export function parseMoneyInput(input: string): number | null {
  if (!input) return null;
  let s = input.trim();
  if (!s) return null;
  s = s.replace(/[€$£¥]/g, "").replace(/\s+/g, "");
  let sign = 1;
  if (s.startsWith("-")) {
    sign = -1;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized: string;
  if (lastComma === -1 && lastDot === -1) {
    normalized = s;
  } else if (lastComma > lastDot) {
    // European: comma is decimal separator
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else {
    // US: dot is decimal separator
    normalized = s.replace(/,/g, "");
  }
  const n = parseFloat(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) * sign;
}

/**
 * Format an integer-cents amount as currency.
 * Uses Intl.NumberFormat which automatically picks the right number of
 * decimals per currency (2 for EUR/USD, 0 for JPY, etc.).
 * Falls back to "amount symbol" if the runtime rejects the currency code.
 */
export function formatMoney(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
  opts: { sign?: "auto" | "always" | "never"; compact?: boolean } = {}
): string {
  const signDisplay: Intl.NumberFormatOptions["signDisplay"] =
    opts.sign === "always"
      ? "always"
      : opts.sign === "never"
        ? "never"
        : "auto";
  const units = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      signDisplay,
      notation: opts.compact ? "compact" : "standard",
    }).format(units);
  } catch {
    return `${units.toLocaleString()} ${symbolFor(currency)}`;
  }
}
