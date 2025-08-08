import { BhaRowData } from '../../wellbore-design/types/bha-builder.type';

/**
 * Represents a depth interval with associated internal diameter.
 * Used to define discrete sections of the wellbore where specific BHA or casing components are active.
 */
export interface Segments {
  /** Bottom depth of the interval in feet */
  end_depth: number;
  /** Top depth of the interval in feet */
  start_depth: number;
  /** Internal diameter of the component active in this interval (in inches) */
  diameter: number;
}

/**
 * Validates a numeric value and returns a default if invalid
 * @param value - The value to validate
 * @param defaultValue - Default value to return if validation fails
 * @param fieldName - Name of the field for error tracking (optional)
 * @returns Valid number or default
 */
function validateNumber(
  value: number | undefined | null,
  defaultValue: number,
  fieldName?: string
): number {
  if (
    value === undefined ||
    value === null ||
    isNaN(value) ||
    !isFinite(value)
  ) {
    console.warn(
      `Invalid numeric value for ${
        fieldName || 'field'
      }: ${value}, using default: ${defaultValue}`
    );
    return defaultValue;
  }
  return value;
}

/**
 * Validates a BhaRowData object to ensure all required properties exist and are valid
 * @param row - The row to validate
 * @param index - Index of the row for error tracking
 * @returns True if row is valid, false otherwise
 */
function isValidRow(
  row: BhaRowData | undefined | null,
  index?: number
): boolean {
  if (!row) {
    console.warn(`Invalid row at index ${index}: row is null or undefined`);
    return false;
  }

  if (typeof row !== 'object') {
    console.warn(`Invalid row at index ${index}: row is not an object`);
    return false;
  }

  // Check required numeric properties
  const hasValidBottom =
    typeof row.bottom === 'number' &&
    !isNaN(row.bottom) &&
    isFinite(row.bottom);
  const hasValidTop =
    typeof row.top === 'number' && !isNaN(row.top) && isFinite(row.top);
  const hasValidIdVal =
    typeof row.idVal === 'number' &&
    !isNaN(row.idVal) &&
    isFinite(row.idVal) &&
    row.idVal > 0;

  if (!hasValidBottom || !hasValidTop || !hasValidIdVal) {
    console.warn(
      `Invalid row at index ${index}: bottom=${row.bottom}, top=${row.top}, idVal=${row.idVal}`
    );
    return false;
  }

  // Logical validation: bottom should be greater than or equal to top
  if (row.bottom < row.top) {
    console.warn(
      `Invalid row at index ${index}: bottom (${row.bottom}) is less than top (${row.top})`
    );
    return false;
  }

  return true;
}

/**
 * Validates a Segments object to ensure all properties are valid numbers
 * @param segment - The segment to validate
 * @returns True if segment is valid, false otherwise
 */
function isValidSegment(segment: Segments | undefined | null): boolean {
  if (!segment) return false;

  return (
    typeof segment.end_depth === 'number' &&
    !isNaN(segment.end_depth) &&
    isFinite(segment.end_depth) &&
    typeof segment.start_depth === 'number' &&
    !isNaN(segment.start_depth) &&
    isFinite(segment.start_depth) &&
    typeof segment.diameter === 'number' &&
    !isNaN(segment.diameter) &&
    isFinite(segment.diameter) &&
    segment.diameter > 0 &&
    segment.end_depth >= segment.start_depth
  );
}

/**
 * Merges BHA (Bottom Hole Assembly) and casing rows to create a unified depth-based interval mapping.
 *
 * This utility function analyzes overlapping depth ranges from BHA and casing components,
 * creating discrete intervals where each interval is associated with the component that
 * has the smallest internal diameter when multiple components overlap at the same depth.
 *
 * The algorithm works by:
 * 1. Collecting all unique depth points (top and bottom) from both BHA and casing components
 * 2. Sorting these points in descending order (deepest to shallowest)
 * 3. Creating intervals between consecutive depth points
 * 4. For each interval, determining which component(s) cover that depth range
 * 5. Selecting the component with the smallest internal diameter when multiple components overlap
 * 6. Adding a final interval from the shallowest point to surface (0 feet) if needed
 * 7. Adapting intervals based on the nodalPoint parameter
 *
 * @param bhaRows - Array of BHA component data rows, each containing depth and internal diameter information
 * @param casingRows - Array of casing component data rows, each containing depth and internal diameter information
 * @param nodalPoint - Depth point to adapt intervals around (in feet)
 * @returns Array of Interval objects representing the merged depth intervals with associated internal diameters
 *
 * @example
 * ```typescript
 * const bhaRows = [
 *   { id: "1", idVal: 2.5, bottom: 1000, top: 800, ... },
 *   { id: "2", idVal: 3.0, bottom: 800, top: 600, ... }
 * ];
 * const casingRows = [
 *   { id: "3", idVal: 4.0, bottom: 1200, top: 900, ... },
 *   { id: "4", idVal: 3.5, bottom: 900, top: 700, ... }
 * ];
 *
 * const intervals = mergeBhaAndCasingRows(bhaRows, casingRows, 850);
 * // Returns intervals adapted around nodalPoint 850
 * ```
 */
export function mergeBhaAndCasingRows(
  bhaRows: BhaRowData[] | undefined | null,
  casingRows: BhaRowData[] | undefined | null,
  nodalPoint: number | undefined | null
): Segments[] {
  // Validate and sanitize inputs
  const safeBhaRows = Array.isArray(bhaRows) ? bhaRows : [];
  const safeCasingRows = Array.isArray(casingRows) ? casingRows : [];
  const safeNodalPoint = validateNumber(nodalPoint, 0, 'nodalPoint');

  // Early return for empty inputs
  if (safeBhaRows.length === 0 && safeCasingRows.length === 0) {
    return [];
  }

  // Filter out invalid rows and validate remaining ones
  const validBhaRows = safeBhaRows.filter((row, index) =>
    isValidRow(row, index)
  );
  const validCasingRows = safeCasingRows.filter((row, index) =>
    isValidRow(row, safeBhaRows.length + index)
  );

  // If no valid rows remain after filtering, return empty array
  if (validBhaRows.length === 0 && validCasingRows.length === 0) {
    console.warn('No valid rows found after validation');
    return [];
  }

  // Combine and sort all valid rows by bottom depth in descending order
  const allRows = [...validBhaRows, ...validCasingRows].sort((a, b) => {
    const aBottom = validateNumber(a?.bottom, 0, 'a.bottom');
    const bBottom = validateNumber(b?.bottom, 0, 'b.bottom');
    return bBottom - aBottom;
  });

  // Collect all unique depth points (top and bottom of each component)
  const depthPoints = new Set<number>();
  for (const row of allRows) {
    if (row) {
      const bottom = validateNumber(row.bottom, 0, 'row.bottom');
      const top = validateNumber(row.top, 0, 'row.top');

      if (bottom >= 0 && top >= 0 && bottom >= top) {
        depthPoints.add(bottom);
        depthPoints.add(top);
      }
    }
  }

  // Add nodalPoint to depth points if valid
  if (safeNodalPoint >= 0) {
    depthPoints.add(safeNodalPoint);
  }

  // Sort depth points in descending order for processing
  const sortedDepthPoints = Array.from(depthPoints)
    .filter(depth => !isNaN(depth) && isFinite(depth) && depth >= 0)
    .sort((a, b) => b - a);

  // If no valid depth points, return empty array
  if (sortedDepthPoints.length < 2) {
    console.warn('Insufficient depth points to create intervals');
    return [];
  }

  const intervals: Segments[] = [];

  // Create intervals between consecutive depth points
  for (let i = 0; i < sortedDepthPoints.length - 1; i++) {
    const bottom = sortedDepthPoints[i];
    const top = sortedDepthPoints[i + 1];

    // Skip invalid intervals
    if (bottom <= top) {
      continue;
    }

    // Find all components that cover this depth interval
    // A component covers an interval if: component.top < interval.bottom AND component.bottom >= interval.top
    const coveringComponents = allRows.filter(row => {
      if (!row) return false;

      const rowTop = validateNumber(row.top, Infinity, 'row.top');
      const rowBottom = validateNumber(row.bottom, -Infinity, 'row.bottom');
      const rowIdVal = validateNumber(row.idVal, 0, 'row.idVal');

      return rowTop < bottom && rowBottom >= top && rowIdVal > 0;
    });

    // Skip intervals with no covering components
    if (coveringComponents.length === 0) continue;

    // Select the component with the smallest internal diameter when multiple components overlap
    const selectedComponent = coveringComponents.reduce(
      (minComponent, currentComponent) => {
        if (!minComponent) return currentComponent;
        if (!currentComponent) return minComponent;

        const minIdVal = validateNumber(
          minComponent.idVal,
          Infinity,
          'minComponent.idVal'
        );
        const currentIdVal = validateNumber(
          currentComponent.idVal,
          Infinity,
          'currentComponent.idVal'
        );

        return currentIdVal < minIdVal ? currentComponent : minComponent;
      }
    );

    // Validate selected component before creating interval
    if (selectedComponent && selectedComponent.idVal > 0) {
      const segment: Segments = {
        end_depth: bottom,
        start_depth: top,
        diameter: validateNumber(
          selectedComponent.idVal,
          1,
          'selectedComponent.idVal'
        ),
      };

      // Only add valid segments
      if (isValidSegment(segment)) {
        intervals.push(segment);
      }
    }
  }

  // Adapt the intervals for the nodal point
  return adaptIntervalsForNodalPoint(intervals, safeNodalPoint, allRows);
}

/**
 * Adapts intervals to be centered around a nodal point.
 *
 * @param intervals - Original intervals
 * @param nodalPoint - Depth point to adapt intervals around
 * @param allRows - All BHA and casing rows for component lookup
 * @returns Adapted intervals
 */
function adaptIntervalsForNodalPoint(
  intervals: Segments[] | undefined | null,
  nodalPoint: number | undefined | null,
  allRows: BhaRowData[] | undefined | null
): Segments[] {
  // Validate inputs
  const safeIntervals = Array.isArray(intervals) ? intervals : [];
  const safeNodalPoint = validateNumber(nodalPoint, 0, 'nodalPoint');
  const safeAllRows = Array.isArray(allRows) ? allRows : [];

  // Filter out invalid intervals
  const validIntervals = safeIntervals.filter(interval =>
    isValidSegment(interval)
  );

  // Early return if no valid intervals
  if (validIntervals.length === 0) {
    return [];
  }

  const adaptedIntervals: Segments[] = [];

  // Find the first interval that covers the nodalPoint
  let nodalIntervalIndex = -1;
  for (let i = 0; i < validIntervals.length; i++) {
    const interval = validIntervals[i];
    if (!interval) continue;

    const startDepth = validateNumber(
      interval.start_depth,
      Infinity,
      'interval.start_depth'
    );
    const endDepth = validateNumber(
      interval.end_depth,
      -Infinity,
      'interval.end_depth'
    );

    if (startDepth < safeNodalPoint && endDepth >= safeNodalPoint) {
      nodalIntervalIndex = i;
      break;
    }
  }

  // If no interval covers nodalPoint, find the closest one below
  if (nodalIntervalIndex === -1) {
    for (let i = 0; i < validIntervals.length; i++) {
      const interval = validIntervals[i];
      if (!interval) continue;

      const endDepth = validateNumber(
        interval.end_depth,
        -Infinity,
        'interval.end_depth'
      );

      if (endDepth <= safeNodalPoint) {
        nodalIntervalIndex = i;
        break;
      }
    }
  }

  // If still no interval found, start from the deepest interval
  if (nodalIntervalIndex === -1) {
    nodalIntervalIndex = 0;
  }

  // Ensure we have a valid interval index
  if (nodalIntervalIndex >= 0 && nodalIntervalIndex < validIntervals.length) {
    const firstInterval = validIntervals[nodalIntervalIndex];

    if (firstInterval && isValidSegment(firstInterval)) {
      const firstEndDepth = validateNumber(
        firstInterval.end_depth,
        0,
        'firstInterval.end_depth'
      );
      const firstStartDepth = validateNumber(
        firstInterval.start_depth,
        0,
        'firstInterval.start_depth'
      );

      if (firstEndDepth > safeNodalPoint) {
        // Create a new interval from nodalPoint to the top of the first interval
        const coveringComponents = safeAllRows.filter(row => {
          if (!isValidRow(row)) return false;

          const rowTop = validateNumber(row.top, Infinity, 'row.top');
          const rowBottom = validateNumber(row.bottom, -Infinity, 'row.bottom');
          const rowIdVal = validateNumber(row.idVal, 0, 'row.idVal');

          return (
            rowTop < safeNodalPoint &&
            rowBottom >= firstStartDepth &&
            rowIdVal > 0
          );
        });

        if (coveringComponents.length > 0) {
          const selectedComponent = coveringComponents.reduce(
            (minComponent, currentComponent) => {
              if (!minComponent) return currentComponent;
              if (!currentComponent) return minComponent;

              const minIdVal = validateNumber(
                minComponent.idVal,
                Infinity,
                'minComponent.idVal'
              );
              const currentIdVal = validateNumber(
                currentComponent.idVal,
                Infinity,
                'currentComponent.idVal'
              );

              return currentIdVal < minIdVal ? currentComponent : minComponent;
            }
          );

          if (selectedComponent && selectedComponent.idVal > 0) {
            const segment: Segments = {
              end_depth: safeNodalPoint,
              start_depth: firstStartDepth,
              diameter: validateNumber(
                selectedComponent.idVal,
                1,
                'selectedComponent.idVal'
              ),
            };

            // Only add valid segments
            if (isValidSegment(segment)) {
              adaptedIntervals.push(segment);
            }
          }
        }
      }

      // Add all intervals from the nodal interval onwards (shallower depths)
      for (let i = nodalIntervalIndex; i < validIntervals.length; i++) {
        const interval = validIntervals[i];
        if (interval && isValidSegment(interval)) {
          adaptedIntervals.push(interval);
        }
      }
    }
  }

  return adaptedIntervals;
}
