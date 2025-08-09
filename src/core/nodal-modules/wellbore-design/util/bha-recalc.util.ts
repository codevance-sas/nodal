import type { BhaRowData } from '../types/bha-builder.type';

export interface recalcProps {
  rows: BhaRowData[];
  initialTop: number;
  drafts: Map<string, Partial<BhaRowData>>;
  averageTubingJoints: number;
}

/**
 * Checks if a row type is tubing-related
 * @param type - The type string to check
 * @returns True if the type is 'tubing' (case-sensitive)
 */
const isTubingType = (type: string): boolean => {
  if (!type || typeof type !== 'string') return false;
  return type.toLowerCase() === 'tubing';
};

/**
 * Validates numeric values for calculations
 * @param value - The value to validate
 * @param defaultValue - Default value if validation fails
 * @returns Valid number or default
 */
const validateNumericValue = (
  value: number | undefined | null,
  defaultValue: number = 0
): number => {
  if (value === undefined || value === null || isNaN(value) || value < 0) {
    return defaultValue;
  }
  return value;
};

/**
 * Recalculates top and bottom values for BHA rows.
 * @param rows - The array of rows to recalculate.
 * @param initialTop - The initial top value.
 * @param drafts - Draft values to consider during recalculation.
 * @returns New array with recalculated top and bottom.
 */
export const recalcTopBtmBha = ({
  rows,
  initialTop,
  drafts,
  averageTubingJoints,
}: recalcProps): BhaRowData[] => {
  if (rows.length === 0) return [];

  let lastBottom = rows[0]?.top >= initialTop ? rows[0].top : initialTop;

  return rows.map((row, index) => {
    const draft = drafts.get(row.id) ?? {};

    // For the first row, respect its top value or use initialTop
    const top =
      index === 0
        ? draft.top !== undefined
          ? draft.top
          : row.top
        : lastBottom;

    // Merge all draft values with row
    const mergedRow = {
      ...row,
      top,
      count: draft.count !== undefined ? draft.count : row.count,
      length: draft.length !== undefined ? draft.length : row.length,
      od: draft.od !== undefined ? draft.od : row.od,
      idVal: draft.idVal !== undefined ? draft.idVal : row.idVal,
      type: draft.type !== undefined ? draft.type : row.type,
      desc: draft.desc !== undefined ? draft.desc : row.desc,
    };

    // Check if this is a tubing type row
    const isTubing = isTubingType(mergedRow.type);

    // Get the validated length
    let length = validateNumericValue(mergedRow.length, 0);

    // Handle draft.bottom if explicitly set
    if (draft.bottom !== undefined) {
      const bottom = validateNumericValue(draft.bottom, top);
      // Recalculate length based on the explicit bottom value
      length = bottom - top;
    }

    // Calculate bottom as top + length (new logic)
    const bottom = top + length;

    // Calculate count based on type
    let count: number = 1;

    if (isTubing) {
      // For tubing types, calculate count from length and average joints
      const validatedAverageJoints = validateNumericValue(
        averageTubingJoints,
        30
      ); // Default 30ft if invalid

      if (validatedAverageJoints > 0) {
        count = Math.ceil(length / validatedAverageJoints);
      } else {
        count = 1; // Fallback to 1 if average joints is 0
      }
    } else {
      // For non-tubing types, use the existing count
      count = validateNumericValue(mergedRow.count, 1);
    }

    // Ensure all calculated values are valid
    const finalTop = validateNumericValue(top, initialTop);
    const finalBottom = validateNumericValue(bottom, finalTop);
    const finalLength = validateNumericValue(length, 0);

    // Additional validation: bottom should always be >= top
    const validatedBottom = finalBottom < finalTop ? finalTop : finalBottom;

    // Update lastBottom for the next iteration
    lastBottom = validatedBottom;

    return {
      ...mergedRow,
      top: finalTop,
      bottom: validatedBottom,
      length: finalLength,
      count,
    };
  });
};

/**
 * Recalculates top and bottom values for all rows.
 * @param rows - The array of rows to recalculate.
 * @returns New array with recalculated top and bottom.
 */
export const recalcTopBtmCasing = ({
  rows,
  initialTop,
  drafts,
}: recalcProps): BhaRowData[] => {
  if (rows.length === 0) return [];

  let lastBottom = initialTop;

  return rows.map((row, idx) => {
    const draft = drafts.get(row.id) ?? {};

    // Merge draft values
    const mergedRow = {
      ...row,
      count: draft.count !== undefined ? draft.count : row.count,
      length: draft.length !== undefined ? draft.length : row.length,
      od: draft.od !== undefined ? draft.od : row.od,
      idVal: draft.idVal !== undefined ? draft.idVal : row.idVal,
      type: draft.type !== undefined ? draft.type : row.type,
      desc: draft.desc !== undefined ? draft.desc : row.desc,
    };

    // Calculate top based on casing rules
    const top =
      idx === 0
        ? initialTop
        : rows[idx - 1].idVal > mergedRow.od
        ? draft.top !== undefined
          ? draft.top
          : row.top
        : lastBottom;

    let length = mergedRow.length;

    // Handle draft.bottom if explicitly set
    if (draft.bottom !== undefined) {
      const bottom = validateNumericValue(draft.bottom, top);
      // Recalculate length based on the explicit bottom value
      length = bottom - top;
    }

    // Calculate bottom as top + length (new logic)
    const bottom = top + length;

    // Count is just metadata for casing (no tubing types here)
    const count = validateNumericValue(mergedRow.count, 1);

    lastBottom = bottom;

    // Ensure all calculated values are valid
    const finalTop = validateNumericValue(top, initialTop);
    const finalBottom = validateNumericValue(bottom, finalTop);
    const finalLength = validateNumericValue(length, 0);

    // Additional validation: bottom should always be >= top
    const validatedBottom = finalBottom < finalTop ? finalTop : finalBottom;

    return {
      ...mergedRow,
      top: finalTop,
      bottom: validatedBottom,
      length: finalLength,
      count,
    };
  });
};
