import type { BhaRowData } from '../types/bha-builder.type';

export interface recalcProps {
  rows: BhaRowData[];
  initialTop: number;
  drafts: Map<string, Partial<BhaRowData>>;
}

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

    // Calculate bottom based on whether it's explicitly set in draft
    let bottom: number;
    let length = mergedRow.length;

    if (draft.bottom !== undefined) {
      // If bottom is explicitly set, use it and recalculate length if needed
      bottom = draft.bottom;
      if (mergedRow.count > 0) {
        length = (bottom - top) / mergedRow.count;
      }
    } else {
      // Calculate bottom from count and length
      bottom = top + mergedRow.count * length;
    }

    lastBottom = bottom;

    return {
      ...mergedRow,
      top,
      bottom,
      length,
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

    // Calculate bottom
    let bottom: number;
    let length = mergedRow.length;

    if (draft.bottom !== undefined) {
      bottom = draft.bottom;
      if (mergedRow.count > 0) {
        length = (bottom - top) / mergedRow.count;
      }
    } else {
      bottom = top + mergedRow.count * length;
    }

    lastBottom = bottom;

    return {
      ...mergedRow,
      top,
      bottom,
      length,
    };
  });
};
