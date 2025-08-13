export function selectBubblePoint(
  curveData: Record<string, number> | undefined,
  recommended: string | undefined,
  result: any,
  gor: number
): number {
  const results = result.data.results;

  if (curveData) {
    const method = recommended ?? 'standing';
    if (method in curveData) return curveData[method];
    const fallback = curveData['standing'] ?? Object.values(curveData)[0];
    if (fallback != null) return fallback;
  }
  if (Array.isArray(results) && results[0]?.pb != null) {
    return results[0].pb;
  }

  const estimate = Math.min(gor * 0.5, 5000);
  console.warn('No valid bubble point found, using estimate:', estimate);
  return estimate;
}


