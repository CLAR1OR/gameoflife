/** ISO-3166-1 alpha-2 → flag emoji. */
export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  const base = 127397; // 0x1F1E6 - 'A'.charCodeAt(0)
  return (
    String.fromCodePoint(base + code.toUpperCase().charCodeAt(0)) +
    String.fromCodePoint(base + code.toUpperCase().charCodeAt(1))
  );
}
