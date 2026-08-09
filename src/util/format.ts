/** Small display-formatting helpers. */

/** Round to one decimal and drop trailing zeros — tames float artifacts like 1.4000000000000001. */
export function fmt1(n: number): string {
  return String(parseFloat(n.toFixed(1)));
}
