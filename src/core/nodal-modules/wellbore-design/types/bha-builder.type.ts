export enum BhaCasingBuilderTab {
  BHA = 'bha',
  CASING = 'casing',
}

/**
 * Represents a single row of BHA data.
 */
export interface BhaRowData {
  bottom: number; // Bottom depth in feet (calculated)
  count: number; // Number of components
  desc: string; // Description text
  id: string; // Unique identifier for the row
  idVal: number; // Internal diameter in inches
  length: number; // Length per component in feet
  od: number; // Outer diameter in inches
  top: number; // Top depth in feet
  type: string; // Type of BHA component
  size?: string; // Size of the component
}
