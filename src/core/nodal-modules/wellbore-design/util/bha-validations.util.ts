import type { BhaRowData } from '../types/bha-builder.type';

/**
 * Validates rows for OD/ID and overlap conditions.
 * @param rows - The array of rows to validate.
 * @returns Array of error messages.
 */
export const validate = (rows: BhaRowData[]): string[] => {
  const messages: string[] = [];
  rows.forEach((row, idx) => {
    if (row.od < row.idVal) {
      messages.push(`Row ${idx + 1}: OD (${row.od}) > ID (${row.idVal})`);
    }

    rows.forEach((other, j) => {
      if (idx !== j && !(idx < j)) {
        const overlap = row.top < other.bottom;
        if (overlap) {
          if (!(other.idVal >= row.od)) {
            messages.push(
              `Row ${idx + 1} overlaps with Row ${j + 1} but ID ${
                other.idVal
              } < OD ${row.od}`
            );
          }
        }
      }
    });
  });
  return messages;
};
