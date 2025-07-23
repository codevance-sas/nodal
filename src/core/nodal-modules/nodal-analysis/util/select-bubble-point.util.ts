export function selectBubblePoint(
  curveData: Record<string, number> | undefined,
  recommended: string | undefined,
  result: any,
  computedGOR: number
): number {
  if (curveData) {
    const method = recommended ?? 'standing';
    if (method in curveData) return curveData[method];
    const fallback = curveData['standing'] ?? Object.values(curveData)[0];
    if (fallback != null) return fallback;
  }

  if (result.metadata?.bubble_point != null)
    return result.metadata.bubble_point;

  if (Array.isArray(result.results) && result.results[0]?.pb != null) {
    return result.results[0].pb;
  }

  const estimate = Math.min(computedGOR * 0.5, 5000);
  console.warn('No valid bubble point found, using estimate:', estimate);
  return estimate;
}
