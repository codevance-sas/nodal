export function selectBubblePoint(
  curveData: Record<string, number> | undefined,
  recommended: string | undefined,
  result: any,
  gor: number
): number {
  // First, try to get bubble point from curve data if available
  if (curveData) {
    const method = recommended ?? 'standing';
    if (method in curveData) return curveData[method];
    const fallback = curveData['standing'] ?? Object.values(curveData)[0];
    if (fallback != null) return fallback;
  }

  // Then try to get from result data with comprehensive error handling
  if (result && result.success && result.data) {
    // Handle successful result structure
    const results = result.data.results;
    if (Array.isArray(results) && results[0]?.pb != null) {
      return results[0].pb;
    }
  }

  // Fallback to estimate if no valid bubble point found
  const estimate = Math.min(gor * 0.5, 5000);
  console.warn('No valid bubble point found, using estimate:', estimate, {
    hasCurveData: !!curveData,
    hasResult: !!result,
    resultSuccess: result?.success,
    resultHasData: !!result?.data,
    gor
  });
  return estimate;
}


