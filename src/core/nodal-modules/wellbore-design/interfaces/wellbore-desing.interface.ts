export interface AppleColorsType {
  systemBlue: string;
  systemRed: string;
  systemGreen: string;
  systemOrange: string;
  background: string;
  secondaryBackground: string;
  casing: string;
  bha: string;
  tubing: string;
  nodalPoint: string;
  nodalPointGlow: string;
  gasLift: string;
  gasLiftGlow: string;
  gridLine: string;
  borderLine: string;
  accentLine: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  tooltipBackground: string;
  tooltipText: string;
  tooltipBorder: string;
}

export interface ComponentStyle {
  fillColor: string;
  strokeColor: string;
  pattern?: 'dotted' | 'mesh' | 'gradient';
  opacity?: number;
  strokeWidth?: number;
}
