export function generateVlpCurve(
  result: any,
  oilRate: number
): Array<{ rate: number; pressure: number }> {
  if (!result.pressure_profile) {
    return [];
  }
  const multipliers = [
    0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0,
    3.2, 3.4, 3.6, 3.8, 4.0,
  ];
  return multipliers.map(m => ({
    rate: oilRate * m,
    pressure: result.bottomhole_pressure * Math.sqrt(m),
  }));
}
