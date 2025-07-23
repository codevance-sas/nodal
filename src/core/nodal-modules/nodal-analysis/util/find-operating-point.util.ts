/**
 * Sistema optimizado para cálculo de intersección de líneas/curvas
 * Especializado para análisis de pozos (VLP/IPR)
 */

/**
 * Tipos estrictos para puntos de análisis
 */
export interface AnalysisPoint {
  readonly rate: number;
  readonly pressure: number;
}

/**
 * Tipos para segmentos de línea
 */
interface LineSegment {
  readonly p1: AnalysisPoint;
  readonly p2: AnalysisPoint;
}

/**
 * Resultado de intersección con información detallada
 */
interface IntersectionResult {
  point: AnalysisPoint;
  segmentIndex1: number;
  segmentIndex2: number;
  t1: number; // Parámetro de interpolación en segmento 1
  t2: number; // Parámetro de interpolación en segmento 2
}

/**
 * Constantes para estabilidad numérica
 */
const EPSILON = 1e-10;
const RATE_TOLERANCE = 1e-6;
const PRESSURE_TOLERANCE = 1e-6;

/**
 * Calcula la intersección entre dos segmentos de línea usando determinantes
 * Método más eficiente y numéricamente estable que el enfoque iterativo
 *
 * @param seg1 - Primer segmento de línea
 * @param seg2 - Segundo segmento de línea
 * @returns Punto de intersección o null si no existe
 */
function computeSegmentIntersection(
  seg1: LineSegment,
  seg2: LineSegment
): { point: AnalysisPoint; t1: number; t2: number } | null {
  // Vectores direccionales
  const dx1 = seg1.p2.rate - seg1.p1.rate;
  const dy1 = seg1.p2.pressure - seg1.p1.pressure;
  const dx2 = seg2.p2.rate - seg2.p1.rate;
  const dy2 = seg2.p2.pressure - seg2.p1.pressure;

  // Calcular determinante (producto cruzado 2D)
  const det = dx1 * dy2 - dy1 * dx2;

  // Verificar si las líneas son paralelas o coincidentes
  if (Math.abs(det) < EPSILON) {
    return null; // Líneas paralelas o coincidentes
  }

  // Diferencias entre puntos iniciales
  const dx = seg2.p1.rate - seg1.p1.rate;
  const dy = seg2.p1.pressure - seg1.p1.pressure;

  // Parámetros de intersección usando la regla de Cramer
  const t1 = (dx * dy2 - dy * dx2) / det;
  const t2 = (dx * dy1 - dy * dx1) / det;

  // Verificar si la intersección está dentro de ambos segmentos
  if (t1 < -EPSILON || t1 > 1 + EPSILON || t2 < -EPSILON || t2 > 1 + EPSILON) {
    return null; // Intersección fuera de los segmentos
  }

  // Calcular punto de intersección
  // Usar t1 para mayor precisión (podríamos usar t2 también)
  const intersectionRate = seg1.p1.rate + t1 * dx1;
  const intersectionPressure = seg1.p1.pressure + t1 * dy1;

  // Validación cruzada usando t2 para verificar precisión
  const altRate = seg2.p1.rate + t2 * dx2;
  const altPressure = seg2.p1.pressure + t2 * dy2;

  // Verificar consistencia numérica
  if (
    Math.abs(intersectionRate - altRate) > RATE_TOLERANCE ||
    Math.abs(intersectionPressure - altPressure) > PRESSURE_TOLERANCE
  ) {
    // Usar promedio para mayor estabilidad numérica
    return {
      point: {
        rate: (intersectionRate + altRate) / 2,
        pressure: (intersectionPressure + altPressure) / 2,
      },
      t1: Math.max(0, Math.min(1, t1)),
      t2: Math.max(0, Math.min(1, t2)),
    };
  }

  return {
    point: {
      rate: intersectionRate,
      pressure: intersectionPressure,
    },
    t1: Math.max(0, Math.min(1, t1)),
    t2: Math.max(0, Math.min(1, t2)),
  };
}

/**
 * Valida que una curva tenga puntos válidos y esté ordenada
 *
 * @param curve - Curva a validar
 * @param name - Nombre de la curva para mensajes de error
 * @throws Error si la curva no es válida
 */
function validateCurve(curve: AnalysisPoint[], name: string): void {
  if (!curve || !Array.isArray(curve)) {
    throw new Error(`${name} debe ser un array`);
  }

  if (curve.length < 2) {
    throw new Error(`${name} debe tener al menos 2 puntos`);
  }

  // Verificar que todos los puntos sean válidos
  for (let i = 0; i < curve.length; i++) {
    const point = curve[i];
    if (
      !point ||
      typeof point.rate !== 'number' ||
      typeof point.pressure !== 'number'
    ) {
      throw new Error(`Punto inválido en ${name} en índice ${i}`);
    }

    if (!Number.isFinite(point.rate) || !Number.isFinite(point.pressure)) {
      throw new Error(`Valores no finitos en ${name} en índice ${i}`);
    }
  }

  // Verificar monotonicidad en rate (debe ser creciente o decreciente)
  let increasing = true;
  let decreasing = true;

  for (let i = 1; i < curve.length; i++) {
    if (curve[i].rate > curve[i - 1].rate + RATE_TOLERANCE) {
      decreasing = false;
    }
    if (curve[i].rate < curve[i - 1].rate - RATE_TOLERANCE) {
      increasing = false;
    }
  }

  if (!increasing && !decreasing) {
    throw new Error(`${name} debe estar ordenada por rate`);
  }
}

/**
 * Encuentra todas las intersecciones entre dos curvas
 * Maneja múltiples intersecciones si existen
 *
 * @param curve1 - Primera curva
 * @param curve2 - Segunda curva
 * @returns Array de resultados de intersección
 */
function findAllIntersections(
  curve1: AnalysisPoint[],
  curve2: AnalysisPoint[]
): IntersectionResult[] {
  const intersections: IntersectionResult[] = [];

  // Iterar sobre todos los pares de segmentos
  for (let i = 0; i < curve1.length - 1; i++) {
    const seg1: LineSegment = {
      p1: curve1[i],
      p2: curve1[i + 1],
    };

    for (let j = 0; j < curve2.length - 1; j++) {
      const seg2: LineSegment = {
        p1: curve2[j],
        p2: curve2[j + 1],
      };

      const intersection = computeSegmentIntersection(seg1, seg2);

      if (intersection) {
        intersections.push({
          point: intersection.point,
          segmentIndex1: i,
          segmentIndex2: j,
          t1: intersection.t1,
          t2: intersection.t2,
        });
      }
    }
  }

  return intersections;
}

/**
 * Interpola linealmente un valor en una curva
 * Versión optimizada con búsqueda binaria para curvas grandes
 *
 * @param targetRate - Rate objetivo para interpolar
 * @param curve - Curva ordenada por rate
 * @returns Presión interpolada
 */
function interpolatePressure(
  targetRate: number,
  curve: AnalysisPoint[]
): number | null {
  if (curve.length === 0) return null;

  // Determinar si la curva está en orden ascendente o descendente
  const ascending = curve[curve.length - 1].rate > curve[0].rate;

  // Verificar límites
  if (ascending) {
    if (
      targetRate < curve[0].rate ||
      targetRate > curve[curve.length - 1].rate
    ) {
      return null;
    }
  } else {
    if (
      targetRate > curve[0].rate ||
      targetRate < curve[curve.length - 1].rate
    ) {
      return null;
    }
  }

  // Búsqueda binaria para encontrar el segmento correcto
  let left = 0;
  let right = curve.length - 1;

  while (left < right - 1) {
    const mid = Math.floor((left + right) / 2);

    if (ascending) {
      if (curve[mid].rate <= targetRate) {
        left = mid;
      } else {
        right = mid;
      }
    } else {
      if (curve[mid].rate >= targetRate) {
        left = mid;
      } else {
        right = mid;
      }
    }
  }

  // Interpolación lineal
  const p1 = curve[left];
  const p2 = curve[right];

  if (Math.abs(p2.rate - p1.rate) < RATE_TOLERANCE) {
    return (p1.pressure + p2.pressure) / 2;
  }

  const t = (targetRate - p1.rate) / (p2.rate - p1.rate);
  return p1.pressure + t * (p2.pressure - p1.pressure);
}

/**
 * Encuentra el punto de operación óptimo entre curvas IPR y VLP
 *
 * @param ipr - Curva IPR (Inflow Performance Relationship)
 * @param vlp - Curva VLP (Vertical Lift Performance)
 * @returns Punto de operación o null si no existe intersección
 */
export function findOperatingPoint(
  ipr: AnalysisPoint[],
  vlp: AnalysisPoint[]
): AnalysisPoint | null {
  try {
    // Validar entradas
    validateCurve(ipr, 'IPR');
    validateCurve(vlp, 'VLP');

    // Encontrar todas las intersecciones
    const intersections = findAllIntersections(vlp, ipr);

    if (intersections.length === 0) {
      return null;
    }

    // Si hay múltiples intersecciones, seleccionar la más estable
    // (típicamente la de mayor rate para pozos de producción)
    if (intersections.length > 1) {
      // Ordenar por rate descendente
      intersections.sort((a, b) => b.point.rate - a.point.rate);

      // Filtrar intersecciones con rate positivo
      const validIntersections = intersections.filter(i => i.point.rate > 0);

      if (validIntersections.length > 0) {
        return validIntersections[0].point;
      }
    }

    return intersections[0].point;
  } catch (error) {
    console.error('Error en findOperatingPoint:', error);
    return null;
  }
}

/**
 * Función auxiliar para depuración: visualiza las curvas y su intersección
 */
export function analyzeIntersection(
  ipr: AnalysisPoint[],
  vlp: AnalysisPoint[]
): {
  operatingPoint: AnalysisPoint | null;
  allIntersections: IntersectionResult[];
  iprRange: {
    minRate: number;
    maxRate: number;
    minPressure: number;
    maxPressure: number;
  };
  vlpRange: {
    minRate: number;
    maxRate: number;
    minPressure: number;
    maxPressure: number;
  };
} {
  try {
    validateCurve(ipr, 'IPR');
    validateCurve(vlp, 'VLP');

    const allIntersections = findAllIntersections(vlp, ipr);
    const operatingPoint = findOperatingPoint(ipr, vlp);

    // Calcular rangos para análisis
    const getRange = (curve: AnalysisPoint[]) => ({
      minRate: Math.min(...curve.map(p => p.rate)),
      maxRate: Math.max(...curve.map(p => p.rate)),
      minPressure: Math.min(...curve.map(p => p.pressure)),
      maxPressure: Math.max(...curve.map(p => p.pressure)),
    });

    return {
      operatingPoint,
      allIntersections,
      iprRange: getRange(ipr),
      vlpRange: getRange(vlp),
    };
  } catch (error) {
    console.error('Error en analyzeIntersection:', error);
    return {
      operatingPoint: null,
      allIntersections: [],
      iprRange: { minRate: 0, maxRate: 0, minPressure: 0, maxPressure: 0 },
      vlpRange: { minRate: 0, maxRate: 0, minPressure: 0, maxPressure: 0 },
    };
  }
}
