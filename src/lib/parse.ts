/** Parse a user-typed price like "12", "12.50", "1,200", "€ 30". Empty -> undefined. */
export function parsePrice(raw: string): number | undefined | 'invalid' {
  const cleaned = raw.replace(/[^\d.,-]/g, '').trim();
  if (!cleaned) return raw.trim() ? 'invalid' : undefined;
  // Treat a trailing ",dd" as a decimal comma (e.g. "12,50"), otherwise commas are thousands separators.
  const normalized = /,\d{1,2}$/.test(cleaned) && !cleaned.includes('.')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/,/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : 'invalid';
}
