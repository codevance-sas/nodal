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
  bhaRows: BhaRowData[],
  casingRows: BhaRowData[],
  nodalPoint: number
): Segments[] {
  // Early return for empty inputs
  if (bhaRows.length === 0 && casingRows.length === 0) {
    return [];
  }

  // Combine and sort all rows by bottom depth in descending order
  const allRows = [...bhaRows, ...casingRows].sort(
    (a, b) => b.bottom - a.bottom
  );

  // Collect all unique depth points (top and bottom of each component)
  const depthPoints = new Set<number>();
  for (const row of allRows) {
    depthPoints.add(row.bottom);
    depthPoints.add(row.top);
  }

  // Add nodalPoint to depth points
  depthPoints.add(nodalPoint);

  // Sort depth points in descending order for processing
  const sortedDepthPoints = Array.from(depthPoints).sort((a, b) => b - a);

  const intervals: Segments[] = [];

  // Create intervals between consecutive depth points
  for (let i = 0; i < sortedDepthPoints.length - 1; i++) {
    const bottom = sortedDepthPoints[i];
    const top = sortedDepthPoints[i + 1];

    // Find all components that cover this depth interval
    // A component covers an interval if: component.top < interval.bottom AND component.bottom >= interval.top
    const coveringComponents = allRows.filter(
      row => row.top < bottom && row.bottom >= top
    );

    // Skip intervals with no covering components
    if (coveringComponents.length === 0) continue;

    // Select the component with the smallest internal diameter when multiple components overlap
    const selectedComponent = coveringComponents.reduce(
      (minComponent, currentComponent) =>
        currentComponent.idVal < minComponent.idVal
          ? currentComponent
          : minComponent
    );

    intervals.push({
      end_depth: bottom,
      start_depth: top,
      diameter: selectedComponent.idVal,
    });
  }

  // Adapt the intervals for the nodal point
  return adaptIntervalsForNodalPoint(intervals, nodalPoint, allRows);
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
  intervals: Segments[],
  nodalPoint: number,
  allRows: BhaRowData[]
): Segments[] {
  const adaptedIntervals: Segments[] = [];

  // Find the first interval that covers the nodalPoint
  let nodalIntervalIndex = -1;
  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    if (interval.start_depth < nodalPoint && interval.end_depth >= nodalPoint) {
      nodalIntervalIndex = i;
      break;
    }
  }

  // If no interval covers nodalPoint, find the closest one below
  if (nodalIntervalIndex === -1) {
    for (let i = 0; i < intervals.length; i++) {
      if (intervals[i].end_depth <= nodalPoint) {
        nodalIntervalIndex = i;
        break;
      }
    }
  }

  // If still no interval found, start from the deepest interval
  if (nodalIntervalIndex === -1) {
    nodalIntervalIndex = 0;
  }

  // Create the first interval starting from nodalPoint
  const firstInterval = intervals[nodalIntervalIndex];
  if (firstInterval.end_depth > nodalPoint) {
    // Create a new interval from nodalPoint to the top of the first interval
    const coveringComponents = allRows.filter(
      row => row.top < nodalPoint && row.bottom >= firstInterval.start_depth
    );

    if (coveringComponents.length > 0) {
      const selectedComponent = coveringComponents.reduce(
        (minComponent, currentComponent) =>
          currentComponent.idVal < minComponent.idVal
            ? currentComponent
            : minComponent
      );

      adaptedIntervals.push({
        end_depth: nodalPoint,
        start_depth: firstInterval.start_depth,
        diameter: selectedComponent.idVal,
      });
    }
  }

  // Add all intervals from the nodal interval onwards (shallower depths)
  for (let i = nodalIntervalIndex; i < intervals.length; i++) {
    adaptedIntervals.push(intervals[i]);
  }

  return adaptedIntervals;
}
