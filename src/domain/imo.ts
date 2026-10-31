/**
 * IMO numbers are seven digits. The last digit is a check digit: multiply the
 * first six digits by 7, 6, 5, 4, 3, 2, sum them, and the last digit of that
 * sum must equal the seventh digit.
 */
const WEIGHTS = [7, 6, 5, 4, 3, 2] as const;

function checkDigitFor(firstSix: string): number {
  const sum = WEIGHTS.reduce(
    (total, weight, index) => total + weight * Number(firstSix[index]),
    0
  );
  return sum % 10;
}

export function isValidImo(imo: string): boolean {
  if (!/^\d{7}$/.test(imo)) return false;
  return checkDigitFor(imo.slice(0, 6)) === Number(imo[6]);
}

/** Appends the check digit to a six-digit stem. Used for synthetic demo data. */
export function withImoCheckDigit(firstSix: string): string {
  if (!/^\d{6}$/.test(firstSix)) {
    throw new Error('IMO stem must be exactly six digits.');
  }
  return `${firstSix}${checkDigitFor(firstSix)}`;
}
