/**
 * Escape a value for safe CSV and neutralize spreadsheet formula injection.
 * Cells starting with =, +, -, @, tab, or CR are prefixed with a single quote.
 */
export function sanitizeCsvCell(value: unknown): string {
  const stringValue = value == null ? '' : String(value);
  const formulaPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  const needsFormulaGuard = formulaPrefixes.some((prefix) =>
    stringValue.startsWith(prefix)
  );
  const guarded = needsFormulaGuard ? `'${stringValue}` : stringValue;
  const escaped = guarded.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function csvRow(cells: unknown[]): string {
  return cells.map(sanitizeCsvCell).join(',');
}
