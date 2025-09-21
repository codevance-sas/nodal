'use client';
import { casingTypeOptions } from '@/core/nodal-modules/wellbore-design/constants/bha-type-options.constant';
import { useBhaStore } from '@/store/nodal-modules/wellbore-design/use-bha.store';
import { useAnalysisStore } from '@/store/nodal-modules/nodal-analysis/use-nodal-analysis.store';
import type { BhaRowData } from '@/core/nodal-modules/wellbore-design/types/bha-builder.type';
import { useTheme } from 'next-themes';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from 'react';
import {
  Stage,
  Layer,
  Rect,
  Line,
  Text,
  Group,
  Circle,
  Arrow,
  RegularPolygon,
  Path,
} from 'react-konva';

export interface BhaDiagramKonvaProps {
  showNodalPoint: boolean;
  onNodalPointDepth: (depth: number) => void;
  exaggeration?: number;
}

interface AppleColorsType {
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

interface ComponentStyle {
  fillColor: string;
  strokeColor: string;
  pattern?: 'dotted' | 'mesh' | 'gradient';
  specialShape?: 'hexagon' | 'lhorn' | 'triangular' | 'motor';
  opacity?: number;
  strokeWidth?: number;
}

const AppleColorsLight: AppleColorsType = {
  systemBlue: '#3B82F6',
  systemRed: '#EF4444',
  systemGreen: '#10B981',
  systemOrange: '#F59E0B',

  background: '#FFFFFF',
  secondaryBackground: '#F8F9FA',

  casing: '#8B9DC3',
  bha: '#7C9AD9',
  tubing: '#9CA3AF',

  nodalPoint: '#DC2626',
  nodalPointGlow: 'rgba(220, 38, 38, 0.2)',
  gasLift: '#3B82F6',
  gasLiftGlow: 'rgba(59, 130, 246, 0.2)',

  gridLine: '#E5E7EB',
  borderLine: '#D1D5DB',
  accentLine: '#3B82F6',

  textPrimary: '#111827',
  textSecondary: '#374151',
  textTertiary: '#6B7280',

  tooltipBackground: 'rgba(255, 255, 255, 0.95)',
  tooltipText: '#111827',
  tooltipBorder: '#D1D5DB',
};

const AppleColorsDark: AppleColorsType = {
  systemBlue: '#60A5FA',
  systemRed: '#EF4444',
  systemGreen: '#10B981',
  systemOrange: '#F59E0B',

  background: '#111827',
  secondaryBackground: '#1F2937',

  casing: '#6B7A99',
  bha: '#5B7BB8',
  tubing: '#6B7280',

  nodalPoint: '#DC2626',
  nodalPointGlow: 'rgba(220, 38, 38, 0.3)',
  gasLift: '#60A5FA',
  gasLiftGlow: 'rgba(96, 165, 250, 0.3)',

  gridLine: '#4B5563',
  borderLine: '#6B7280',
  accentLine: '#3B82F6',

  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',

  tooltipBackground: 'rgba(17, 24, 39, 0.95)',
  tooltipText: '#F9FAFB',
  tooltipBorder: '#4B5563',
};

const getRenderStyle = (
  type: string,
  description: string = '',
  colors: AppleColorsType
): ComponentStyle => {
  const lowerType = type.toLowerCase();
  const lowerDesc = description.toLowerCase();

  // Casing components
  if (casingTypeOptions.includes(type)) {
    return {
      fillColor: colors.casing,
      strokeColor: colors.borderLine,
      opacity: 0.8,
      strokeWidth: 1,
    };
  }

  // Gas Lift components
  if (lowerType.includes('gas lift mandrel')) {
    return {
      fillColor: colors.systemBlue,
      strokeColor: colors.systemBlue,
      specialShape: 'lhorn',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  if (lowerType.includes('gas lift') || lowerType.includes('gas separator')) {
    return {
      fillColor: colors.systemBlue,
      strokeColor: colors.systemBlue,
      opacity: 0.7,
      strokeWidth: 2,
    };
  }

  // Anchors and TACs
  if (
    lowerType.includes('anchor') ||
    lowerType.includes('catcher') ||
    lowerType.includes('tac')
  ) {
    return {
      fillColor: colors.systemRed,
      strokeColor: colors.systemRed,
      specialShape: 'triangular',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Packers
  if (lowerType.includes('packer')) {
    return {
      fillColor: colors.systemGreen,
      strokeColor: colors.systemGreen,
      specialShape: 'hexagon',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Nipples (SN, XN, Profile, Pump Seating, etc.)
  if (
    lowerType.includes('nipple') ||
    lowerType.includes(' sn') ||
    lowerType.includes('xn')
  ) {
    return {
      fillColor: '#2563EB',
      strokeColor: colors.systemBlue,
      opacity: 0.9,
      strokeWidth: 2,
    };
  }

  // ESP
  if (lowerType.includes('esp')) {
    return {
      fillColor: colors.systemOrange,
      strokeColor: '#D97706',
      specialShape: 'motor',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Jet Pump
  if (lowerType.includes('jet pump')) {
    return {
      fillColor: '#7C3AED',
      strokeColor: '#5B21B6',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Perforated components
  if (lowerType.includes('perforated')) {
    return {
      fillColor: colors.bha,
      strokeColor: colors.borderLine,
      pattern: 'dotted',
      opacity: 0.7,
      strokeWidth: 1,
    };
  }

  // Sand Screen
  if (lowerType.includes('sand screen')) {
    return {
      fillColor: '#92400E',
      strokeColor: '#78350F',
      pattern: 'mesh',
      opacity: 0.8,
      strokeWidth: 1,
    };
  }

  // Slotted components
  if (lowerType.includes('slotted')) {
    return {
      fillColor: colors.bha,
      strokeColor: colors.borderLine,
      pattern: 'dotted',
      opacity: 0.7,
      strokeWidth: 1,
    };
  }

  // Tubing
  if (lowerType.includes('tubing') && !lowerType.includes('hanger')) {
    return {
      fillColor: 'rgba(59, 130, 246, 0.3)',
      strokeColor: colors.systemBlue,
      pattern: 'gradient',
      opacity: 0.6,
      strokeWidth: 1,
    };
  }

  // Float components
  if (lowerType.includes('float')) {
    return {
      fillColor: '#059669',
      strokeColor: '#047857',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Centralizer
  if (lowerType.includes('centralizer')) {
    return {
      fillColor: '#DC2626',
      strokeColor: '#B91C1C',
      opacity: 0.7,
      strokeWidth: 1,
    };
  }

  // Cross Over
  if (lowerType.includes('cross over')) {
    return {
      fillColor: '#7C2D12',
      strokeColor: '#92400E',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Plugs
  if (lowerType.includes('plug')) {
    return {
      fillColor: '#1F2937',
      strokeColor: '#111827',
      opacity: 0.9,
      strokeWidth: 2,
    };
  }

  // Tools
  if (lowerType.includes('tool')) {
    return {
      fillColor: '#6366F1',
      strokeColor: '#4F46E5',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Default BHA component
  return {
    fillColor: colors.bha,
    strokeColor: colors.borderLine,
    opacity: 0.7,
    strokeWidth: 1,
  };
};

/**
 * BhaDiagramKonva - Interactive BHA diagram component with Apple Design System and Visual Differentiation
 */
export const BhaDiagramKonva: FC<BhaDiagramKonvaProps> = ({
  exaggeration = 10,
  showNodalPoint,
  onNodalPointDepth,
}) => {
  const { theme } = useTheme();
  const { bhaRows, casingRows, initialTop, nodalDepth, setNodalDepth } =
    useBhaStore();
  const { gasLiftEnabled, injectionDepth, setGasLiftValue } =
    useAnalysisStore();

  const calculateBhaNetLength = useMemo(() => {
    if (bhaRows.length === 0) return 0;
    const intervals = bhaRows
      .map(row => [row.top, row.bottom] as [number, number])
      .sort((a, b) => a[0] - b[0]);

    let netLength = 0;
    let [currentStart, currentEnd] = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
      const [start, end] = intervals[i];
      if (start <= currentEnd) {
        currentEnd = Math.max(currentEnd, end);
      } else {
        netLength += currentEnd - currentStart;
        [currentStart, currentEnd] = [start, end];
      }
    }
    netLength += currentEnd - currentStart;
    return netLength;
  }, [bhaRows]);

  const calculateCasingNetLength = useMemo(() => {
    if (casingRows.length === 0) return 0;
    const intervals = casingRows
      .map(row => [row.top, row.bottom] as [number, number])
      .sort((a, b) => a[0] - b[0]);

    let netLength = 0;
    let [currentStart, currentEnd] = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
      const [start, end] = intervals[i];
      if (start <= currentEnd) {
        currentEnd = Math.max(currentEnd, end);
      } else {
        netLength += currentEnd - currentStart;
        [currentStart, currentEnd] = [start, end];
      }
    }
    netLength += currentEnd - currentStart;
    return netLength;
  }, [casingRows]);

  const AppleColors = useMemo(() => {
    return theme === 'dark' ? AppleColorsDark : AppleColorsLight;
  }, [theme]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  }>({ x: 0, y: 0, text: '' });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const PADDING = 20;
  const innerHeight = useMemo(
    () => Math.max(size.height - 2 * PADDING, 0),
    [size.height]
  );

  const tubingRows = useMemo(
    () => bhaRows.filter(row => row.type.toLowerCase().includes('tubing')),
    [bhaRows]
  );

  const bhaToolRows = useMemo(
    () => bhaRows.filter(row => !row.type.toLowerCase().includes('tubing')),
    [bhaRows]
  );

  // Calculate overall depth range including both casing and BHA
  const overallDepthRange = useMemo(() => {
    const allDepths = [initialTop];

    // Add all BHA depths
    if (bhaRows.length > 0) {
      const bhaDepths = bhaRows.flatMap(row => [row.top, row.bottom]);
      allDepths.push(...bhaDepths);
    }

    // Add all casing depths
    if (casingRows.length > 0) {
      const casingDepths = casingRows.flatMap(row => [row.top, row.bottom]);
      allDepths.push(...casingDepths);
    }

    return {
      min: Math.min(...allDepths),
      max: Math.max(...allDepths),
    };
  }, [bhaRows, casingRows, initialTop]);

  const tubingDepthRange = useMemo(() => {
    if (tubingRows.length === 0) return { min: initialTop, max: initialTop };
    const depths = tubingRows.flatMap(row => [row.top, row.bottom]);
    return { min: Math.min(...depths), max: Math.max(...depths) };
  }, [tubingRows, initialTop]);

  const bhaDepthRange = useMemo(() => {
    if (bhaToolRows.length === 0) return { min: initialTop, max: initialTop };
    const depths = bhaToolRows.flatMap(row => [row.top, row.bottom]);
    return { min: Math.min(...depths), max: Math.max(...depths) };
  }, [bhaToolRows, initialTop]);

  const tubingLength = useMemo(
    () => tubingDepthRange.max - tubingDepthRange.min,
    [tubingDepthRange]
  );
  const bhaLength = useMemo(
    () => bhaDepthRange.max - bhaDepthRange.min,
    [bhaDepthRange]
  );

  // Calculate component groups and their actual depth ranges
  const componentGroups = useMemo(() => {
    const groups: Array<{
      type: 'casing' | 'tubing' | 'bha';
      rows: any[];
      depthRange: { min: number; max: number };
      length: number;
    }> = [];

    // Casing group
    if (casingRows.length > 0) {
      const casingDepths = casingRows.flatMap(row => [row.top, row.bottom]);
      const casingRange = {
        min: Math.min(...casingDepths),
        max: Math.max(...casingDepths),
      };
      groups.push({
        type: 'casing',
        rows: casingRows,
        depthRange: casingRange,
        length: casingRange.max - casingRange.min,
      });
    }

    // Tubing group
    if (tubingRows.length > 0) {
      const tubingDepths = tubingRows.flatMap(row => [row.top, row.bottom]);
      const tubingRange = {
        min: Math.min(...tubingDepths),
        max: Math.max(...tubingDepths),
      };
      groups.push({
        type: 'tubing',
        rows: tubingRows,
        depthRange: tubingRange,
        length: tubingRange.max - tubingRange.min,
      });
    }

    // BHA tools group (non-tubing BHA components)
    if (bhaToolRows.length > 0) {
      const bhaDepths = bhaToolRows.flatMap(row => [row.top, row.bottom]);
      const bhaRange = {
        min: Math.min(...bhaDepths),
        max: Math.max(...bhaDepths),
      };
      groups.push({
        type: 'bha',
        rows: bhaToolRows,
        depthRange: bhaRange,
        length: bhaRange.max - bhaRange.min,
      });
    }

    return groups;
  }, [casingRows, tubingRows, bhaToolRows]);

  const zones = useMemo(() => {
    let zonesObj: Record<
      string,
      {
        startY: number;
        height: number;
        depthRange: { min: number; max: number };
        scale: number;
      }
    > = {};

    // Calculate overall depth range for the diagram
    const overallLength = Math.max(
      overallDepthRange.max - overallDepthRange.min,
      1
    );

    // Determine zoning strategy based on available components
    const nonCasingGroups = componentGroups.filter(g => g.type !== 'casing');
    const casingGroup = componentGroups.find(g => g.type === 'casing');
    const tubingGroup = componentGroups.find(g => g.type === 'tubing');
    const bhaGroup = componentGroups.find(g => g.type === 'bha');

    if (componentGroups.length === 0) {
      // No components - use overall range
      zonesObj.all = {
        startY: PADDING,
        height: innerHeight,
        depthRange: overallDepthRange,
        scale: innerHeight / overallLength,
      };
    } else if (componentGroups.length === 1) {
      // Single component type - gets 100% of space
      const singleGroup = componentGroups[0];
      zonesObj[singleGroup.type] = {
        startY: PADDING,
        height: innerHeight,
        depthRange: singleGroup.depthRange,
        scale: innerHeight / Math.max(singleGroup.length, 1),
      };
      zonesObj.all = zonesObj[singleGroup.type];
    } else {
      // Multiple components - implement dynamic allocation

      // Casing always spans full height with consistent ft/px scaling
      if (casingGroup) {
        zonesObj.casing = {
          startY: PADDING,
          height: innerHeight,
          depthRange: casingGroup.depthRange,
          scale: innerHeight / Math.max(casingGroup.length, 1),
        };
        zonesObj.all = zonesObj.casing; // Fallback to casing zone
      } else {
        // No casing - use overall range for fallback
        zonesObj.all = {
          startY: PADDING,
          height: innerHeight,
          depthRange: overallDepthRange,
          scale: innerHeight / overallLength,
        };
      }

      // Handle BHA components (tubing + other BHA tools)
      if (nonCasingGroups.length > 0) {
        if (nonCasingGroups.length === 1) {
          // Only one BHA component type - gets 100% of BHA space
          const singleBhaGroup = nonCasingGroups[0];
          zonesObj[singleBhaGroup.type] = {
            startY: PADDING,
            height: innerHeight,
            depthRange: singleBhaGroup.depthRange,
            scale: innerHeight / Math.max(singleBhaGroup.length, 1),
          };
        } else {
          // Multiple BHA components - apply 30% tubing rule
          const totalBhaLength = nonCasingGroups.reduce(
            (sum, g) => sum + g.length,
            0
          );

          if (tubingGroup && bhaGroup) {
            // Both tubing and BHA tools present
            const tubingMaxHeight = innerHeight * 0.3;
            const remainingHeight = innerHeight * 0.7;

            // Tubing gets maximum 30%
            zonesObj.tubing = {
              startY: PADDING,
              height: tubingMaxHeight,
              depthRange: tubingGroup.depthRange,
              scale: tubingMaxHeight / Math.max(tubingGroup.length, 1),
            };

            // BHA tools get remaining 70%
            zonesObj.bha = {
              startY: PADDING,
              height: remainingHeight,
              depthRange: bhaGroup.depthRange,
              scale: remainingHeight / Math.max(bhaGroup.length, 1),
            };
          } else if (tubingGroup) {
            // Only tubing present
            zonesObj.tubing = {
              startY: PADDING,
              height: innerHeight,
              depthRange: tubingGroup.depthRange,
              scale: innerHeight / Math.max(tubingGroup.length, 1),
            };
          } else if (bhaGroup) {
            // Only BHA tools present
            zonesObj.bha = {
              startY: PADDING,
              height: innerHeight,
              depthRange: bhaGroup.depthRange,
              scale: innerHeight / Math.max(bhaGroup.length, 1),
            };
          }
        }
      }
    }

    return zonesObj;
  }, [
    innerHeight,
    overallDepthRange,
    componentGroups,
  ]);

  // General depth to Y conversion - uses appropriate zone based on context
  const depthToY = useCallback(
    (depth: number) => {
      const zone = zones.all || zones.casing || zones.tubing || zones.bha;
      if (!zone) return PADDING;

      // Clamp depth to zone's actual range to prevent extending beyond real depths
      const clampedDepth = Math.max(
        zone.depthRange.min,
        Math.min(depth, zone.depthRange.max)
      );

      const relativeDepth = clampedDepth - zone.depthRange.min;
      return zone.startY + relativeDepth * zone.scale;
    },
    [zones]
  );

  // Tubing-specific depth to Y conversion
  const tubingDepthToY = useCallback(
    (depth: number) => {
      const zone = zones.tubing || zones.all || zones.casing;
      if (!zone) return PADDING;

      // Clamp depth to tubing's actual range
      const clampedDepth = Math.max(
        zone.depthRange.min,
        Math.min(depth, zone.depthRange.max)
      );

      const relativeDepth = clampedDepth - zone.depthRange.min;
      return zone.startY + relativeDepth * zone.scale;
    },
    [zones]
  );

  // BHA-specific depth to Y conversion
  const bhaDepthToY = useCallback(
    (depth: number) => {
      const zone = zones.bha || zones.all || zones.casing;
      if (!zone) return PADDING;

      // Clamp depth to BHA's actual range
      const clampedDepth = Math.max(
        zone.depthRange.min,
        Math.min(depth, zone.depthRange.max)
      );

      const relativeDepth = clampedDepth - zone.depthRange.min;
      return zone.startY + relativeDepth * zone.scale;
    },
    [zones]
  );

  // Casing-specific depth to Y conversion
  const casingDepthToY = useCallback(
    (depth: number) => {
      const zone = zones.casing || zones.all;
      if (!zone) return PADDING;

      // Clamp depth to casing's actual range
      const clampedDepth = Math.max(
        zone.depthRange.min,
        Math.min(depth, zone.depthRange.max)
      );

      const relativeDepth = clampedDepth - zone.depthRange.min;
      return zone.startY + relativeDepth * zone.scale;
    },
    [zones]
  );

  const yToDepth = useCallback(
    (y: number) => {
      // Use casing zone for general Y to depth conversion
      const zone = zones.all || zones.casing || zones.tubing || zones.bha;
      if (!zone) return initialTop;

      const relativeY = y - zone.startY;
      return zone.depthRange.min + relativeY / zone.scale;
    },
    [zones, initialTop]
  );

  const maxDepth = useMemo(() => {
    return overallDepthRange.max;
  }, [overallDepthRange]);

  const calcY = useCallback((depth: number) => depthToY(depth), [depthToY]);

  const maxRectWidth = useMemo(() => {
    const widths = [...casingRows, ...bhaRows].map(r => r.od * exaggeration);
    return Math.max(...widths, 100);
  }, [casingRows, bhaRows, exaggeration]);

  const halfMaxW = maxRectWidth / 2;
  const centerX = size.width / 2;
  const lineLeftX = centerX - halfMaxW - 20;
  const lineRightX = centerX + halfMaxW + 20;
  const labelX = lineRightX + 15;

  const allRows = useMemo(
    () => [...bhaRows].sort((a, b) => a.top - b.top),
    [bhaRows]
  );

  const sortedCasingRows = useMemo(
    () => [...casingRows].sort((a, b) => a.top - b.top),
    [casingRows]
  );

  const ballY = useMemo(() => depthToY(nodalDepth), [depthToY, nodalDepth]);

  const gasLiftY = useMemo(() => {
    const depth =
      typeof injectionDepth === 'string'
        ? parseFloat(injectionDepth)
        : injectionDepth;
    return depthToY(depth);
  }, [depthToY, injectionDepth]);

  const handleMouseMove = (e: any, row: BhaRowData) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const depth = yToDepth(pos.y);

    const text = row.desc
      ? `${row.type} (${row.desc}) • Depth: ${depth.toFixed(2)} ft • OD: ${
          row.od
        }" • ID: ${row.idVal}"`
      : `${row.type} • Depth: ${depth.toFixed(2)} ft • OD: ${row.od}" • ID: ${
          row.idVal
        }"`;

    setTooltip({
      x: Math.min(pos.x + 20, size.width - 200),
      y: Math.max(pos.y - 10, 20),
      text,
    });
  };

  const handleMouseOut = () => setTooltip(t => ({ ...t, text: '' }));

  // Special shape rendering functions
  const renderLHorn = (
    centerX: number,
    rectY: number,
    rectH: number,
    outerW: number,
    style: ComponentStyle
  ) => {
    const midY = rectY + rectH / 2;
    const hornSize = 12;
    return (
      <Group>
        {/* L-shaped horn on left side */}
        <Path
          data={`M ${centerX - outerW} ${midY - 6} L ${
            centerX - outerW - hornSize
          } ${midY - 6} L ${centerX - outerW - hornSize} ${midY + 6} L ${
            centerX - outerW
          } ${midY + 6} Z`}
          fill={style.fillColor}
          stroke={style.strokeColor}
          strokeWidth={style.strokeWidth}
          opacity={style.opacity}
        />
      </Group>
    );
  };

  const renderTriangularWedges = (
    centerX: number,
    rectY: number,
    rectH: number,
    innerW: number,
    outerW: number,
    style: ComponentStyle
  ) => {
    const yCenter = rectY + rectH / 2;
    const triHeight = 10;

    return (
      <Group>
        {/* Left triangle */}
        <Path
          data={`M ${centerX - innerW} ${yCenter - triHeight / 2} L ${
            centerX - innerW
          } ${yCenter + triHeight / 2} L ${centerX - outerW} ${yCenter} Z`}
          fill={style.fillColor}
          stroke={style.strokeColor}
          strokeWidth={style.strokeWidth}
          opacity={style.opacity}
        />
        {/* Right triangle */}
        <Path
          data={`M ${centerX + innerW} ${yCenter - triHeight / 2} L ${
            centerX + innerW
          } ${yCenter + triHeight / 2} L ${centerX + outerW} ${yCenter} Z`}
          fill={style.fillColor}
          stroke={style.strokeColor}
          strokeWidth={style.strokeWidth}
          opacity={style.opacity}
        />
      </Group>
    );
  };

  const renderHexagon = (
    centerX: number,
    rectY: number,
    rectH: number,
    outerW: number,
    style: ComponentStyle
  ) => {
    const centerY = rectY + rectH / 2;
    return (
      <RegularPolygon
        x={centerX}
        y={centerY}
        sides={6}
        radius={outerW * 0.8}
        fill={style.fillColor}
        stroke={style.strokeColor}
        strokeWidth={style.strokeWidth || 2}
        opacity={style.opacity}
      />
    );
  };

  const renderMotorIcon = (
    centerX: number,
    rectY: number,
    rectH: number,
    outerW: number,
    style: ComponentStyle
  ) => {
    const centerY = rectY + rectH / 2;
    const motorSize = Math.min(outerW * 0.6, 8);

    return (
      <Group>
        {/* Motor body */}
        <Circle
          x={centerX}
          y={centerY}
          radius={motorSize}
          fill={style.fillColor}
          stroke={style.strokeColor}
          strokeWidth={style.strokeWidth}
          opacity={style.opacity}
        />
        {/* Motor lines */}
        <Line
          points={[
            centerX - motorSize / 2,
            centerY,
            centerX + motorSize / 2,
            centerY,
          ]}
          stroke={style.strokeColor}
          strokeWidth={1}
        />
        <Line
          points={[
            centerX,
            centerY - motorSize / 2,
            centerX,
            centerY + motorSize / 2,
          ]}
          stroke={style.strokeColor}
          strokeWidth={1}
        />
      </Group>
    );
  };

  const renderDottedPattern = (
    centerX: number,
    rectY: number,
    rectH: number,
    outerW: number,
    innerW: number
  ) => {
    const dots = [];
    const dotSpacing = 8;
    const dotsPerRow = Math.floor(outerW / dotSpacing);
    const rows = Math.floor(rectH / dotSpacing);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < dotsPerRow; col++) {
        const x = centerX - outerW / 2 + col * dotSpacing + dotSpacing / 2;
        const y = rectY + row * dotSpacing + dotSpacing / 2;

        // Skip dots in the inner area
        if (Math.abs(x - centerX) > innerW / 2) {
          dots.push(
            <Circle
              key={`dot-${row}-${col}`}
              x={x}
              y={y}
              radius={1}
              fill="#000000"
              opacity={0.4}
            />
          );
        }
      }
    }

    return <Group>{dots}</Group>;
  };

  const renderMeshPattern = (
    centerX: number,
    rectY: number,
    rectH: number,
    outerW: number,
    innerW: number
  ) => {
    const lines = [];
    const lineSpacing = 6;
    const verticalLines = Math.floor(outerW / lineSpacing);
    const horizontalLines = Math.floor(rectH / lineSpacing);

    // Vertical lines
    for (let i = 0; i <= verticalLines; i++) {
      const x = centerX - outerW / 2 + i * lineSpacing;
      if (Math.abs(x - centerX) > innerW / 2) {
        lines.push(
          <Line
            key={`v-${i}`}
            points={[x, rectY, x, rectY + rectH]}
            stroke="#8B4513"
            strokeWidth={0.5}
            opacity={0.6}
          />
        );
      }
    }

    // Horizontal lines
    for (let i = 0; i <= horizontalLines; i++) {
      const y = rectY + i * lineSpacing;
      lines.push(
        <Line
          key={`h-${i}`}
          points={[centerX - outerW / 2, y, centerX - innerW / 2, y]}
          stroke="#8B4513"
          strokeWidth={0.5}
          opacity={0.6}
        />
      );
      lines.push(
        <Line
          key={`h2-${i}`}
          points={[centerX + innerW / 2, y, centerX + outerW / 2, y]}
          stroke="#8B4513"
          strokeWidth={0.5}
          opacity={0.6}
        />
      );
    }

    return <Group>{lines}</Group>;
  };

  const renderCasing = (row: BhaRowData, index: number) => {
    const style = getRenderStyle(row.type, row.desc || '', AppleColors);
    const odW = Math.max(row.od * exaggeration, 8);
    const rectY = casingDepthToY(row.top);
    const rectH = Math.max(
      casingDepthToY(row.bottom) - casingDepthToY(row.top),
      2
    );
    const isLastCasing = index === sortedCasingRows.length - 1;
    const showBottom =
      isLastCasing ||
      (index < sortedCasingRows.length - 1 &&
        sortedCasingRows[index + 1].top - row.bottom > 10);

    return (
      <Group
        key={`casing-${row.id}`}
        onMouseMove={e => handleMouseMove(e, row)}
        onMouseLeave={handleMouseOut}
      >
        <Rect
          x={centerX - odW / 2}
          y={rectY}
          width={odW}
          height={rectH}
          fill={style.fillColor}
          stroke={style.strokeColor}
          strokeWidth={style.strokeWidth}
          cornerRadius={2}
          opacity={style.opacity}
          shadowColor="rgba(0, 0, 0, 0.2)"
          shadowBlur={3}
          shadowOffset={{ x: 0, y: 1 }}
        />
        <Line
          points={[lineLeftX, rectY, lineRightX, rectY]}
          stroke={AppleColors.gridLine}
          strokeWidth={1}
          dash={[6, 4]}
          opacity={0.7}
        />
        <Text
          x={labelX}
          y={rectY - 8}
          text={`${row.top.toFixed(1)} ft`}
          fontSize={11}
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fill={AppleColors.textSecondary}
          fontStyle="500"
        />
        {rectH > 25 && (
          <Text
            x={centerX - 30}
            y={rectY + rectH / 2 - 6}
            text={row.type}
            fontSize={10}
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fill={AppleColors.textPrimary}
            fontStyle="600"
            align="center"
            width={60}
          />
        )}
        {showBottom && (
          <>
            <Line
              points={[lineLeftX, rectY + rectH, lineRightX, rectY + rectH]}
              stroke={AppleColors.gridLine}
              strokeWidth={1}
              dash={[6, 4]}
              opacity={0.7}
            />
            <Text
              x={labelX}
              y={rectY + rectH - 8}
              text={`${row.bottom.toFixed(1)} ft`}
              fontSize={11}
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fill={AppleColors.textSecondary}
              fontStyle="500"
            />
          </>
        )}
      </Group>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-[100%] bg-background rounded-lg border border-border/30 transition-colors duration-200"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: '650px',
        backgroundColor: AppleColors.background,
        overflow: 'hidden',
      }}
    >
      {size.width > 0 && size.height > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          style={{
            width: '100%',
            height: '100%',
            background: AppleColors.background,
          }}
        >
          <Layer>
            {/* Render Casing */}
            {sortedCasingRows.map((row, index) => renderCasing(row, index))}

            {/* Render BHA Components with Enhanced Styling */}
            {allRows.map((row, index) => {
              const style = getRenderStyle(
                row.type,
                row.desc || '',
                AppleColors
              );
              const odW = Math.max(row.od * exaggeration, 8);
              const idW = Math.max(row.idVal * exaggeration, 4);

              // Use appropriate depth conversion based on component type
              const isTubing = row.type.toLowerCase().includes('tubing');
              const depthConverter = isTubing ? tubingDepthToY : bhaDepthToY;
              const rectY = depthConverter(row.top);
              const rectH = Math.max(
                depthConverter(row.bottom) - depthConverter(row.top),
                2
              );

              const outerW = Math.max((odW - idW) / 2, 2);
              const innerX = centerX - idW / 2;

              const isLastComponent = index === allRows.length - 1;

              return (
                <Group
                  key={row.id}
                  onMouseMove={e => handleMouseMove(e, row)}
                  onMouseLeave={handleMouseOut}
                  opacity={0.9}
                >
                  {/* Main component body */}
                  {style.specialShape === 'hexagon' ? (
                    renderHexagon(centerX, rectY, rectH, odW / 2, style)
                  ) : (
                    <>
                      {/* Left outer wall */}
                      <Rect
                        x={centerX - odW / 2}
                        y={rectY}
                        width={outerW}
                        height={rectH}
                        fill={style.fillColor}
                        stroke={style.strokeColor}
                        strokeWidth={style.strokeWidth}
                        cornerRadius={2}
                        opacity={style.opacity}
                        shadowColor="rgba(0, 0, 0, 0.3)"
                        shadowBlur={4}
                        shadowOffset={{ x: 0, y: 2 }}
                      />

                      {/* Inner bore */}
                      <Rect
                        x={innerX}
                        y={rectY}
                        width={idW}
                        height={rectH}
                        fill={
                          style.pattern === 'gradient'
                            ? 'url(#tubing-gradient)'
                            : AppleColors.background
                        }
                        stroke={style.strokeColor}
                        strokeWidth={0.8}
                        cornerRadius={1}
                        opacity={0.8}
                      />

                      {/* Right outer wall */}
                      <Rect
                        x={centerX + idW / 2}
                        y={rectY}
                        width={outerW}
                        height={rectH}
                        fill={style.fillColor}
                        stroke={style.strokeColor}
                        strokeWidth={style.strokeWidth}
                        cornerRadius={2}
                        opacity={style.opacity}
                        shadowColor="rgba(0, 0, 0, 0.3)"
                        shadowBlur={4}
                        shadowOffset={{ x: 0, y: 2 }}
                      />
                    </>
                  )}

                  {/* Special shape overlays */}
                  {style.specialShape === 'lhorn' &&
                    renderLHorn(centerX, rectY, rectH, odW / 2, style)}
                  {style.specialShape === 'triangular' &&
                    renderTriangularWedges(
                      centerX,
                      rectY,
                      rectH,
                      idW,
                      odW / 2,
                      style
                    )}
                  {style.specialShape === 'motor' &&
                    renderMotorIcon(centerX, rectY, rectH, odW / 2, style)}

                  {/* Pattern overlays */}
                  {style.pattern === 'dotted' &&
                    renderDottedPattern(centerX, rectY, rectH, odW, idW)}
                  {style.pattern === 'mesh' &&
                    renderMeshPattern(centerX, rectY, rectH, odW, idW)}

                  {/* Depth lines and labels */}
                  <Line
                    points={[lineLeftX, rectY, lineRightX, rectY]}
                    stroke={AppleColors.gridLine}
                    strokeWidth={1}
                    dash={[6, 4]}
                    opacity={0.7}
                  />

                  <Text
                    x={labelX}
                    y={rectY - 8}
                    text={`${row.top.toFixed(1)} ft`}
                    fontSize={11}
                    fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    fill={AppleColors.textSecondary}
                    fontStyle="500"
                  />

                  {rectH > 25 && (
                    <Text
                      x={centerX - 30}
                      y={rectY + rectH / 2 - 6}
                      text={row.type}
                      fontSize={10}
                      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                      fill={AppleColors.textPrimary}
                      fontStyle="600"
                      align="center"
                      width={60}
                    />
                  )}

                  {(isLastComponent ||
                    (index < allRows.length - 1 &&
                      allRows[index + 1].top - row.bottom > 10)) && (
                    <>
                      <Line
                        points={[
                          lineLeftX,
                          depthConverter(row.bottom),
                          lineRightX,
                          depthConverter(row.bottom),
                        ]}
                        stroke={AppleColors.gridLine}
                        strokeWidth={1}
                        dash={[6, 4]}
                        opacity={0.7}
                      />
                      <Text
                        x={labelX}
                        y={depthConverter(row.bottom) - 8}
                        text={`${row.bottom.toFixed(1)} ft`}
                        fontSize={11}
                        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        fill={AppleColors.textSecondary}
                        fontStyle="500"
                      />
                    </>
                  )}
                </Group>
              );
            })}

            {/* Center line */}
            <Line
              points={[centerX, PADDING, centerX, size.height - PADDING]}
              stroke={AppleColors.accentLine}
              strokeWidth={1}
              opacity={0.3}
              dash={[2, 8]}
            />
          </Layer>

          {/* Tooltip Layer */}
          <Layer>
            {tooltip.text && (
              <Group>
                <Rect
                  x={tooltip.x - 5}
                  y={tooltip.y - 15}
                  width={Math.min(
                    tooltip.text.length * 7 + 20,
                    size.width - tooltip.x
                  )}
                  height={30}
                  fill={AppleColors.tooltipBackground}
                  stroke={AppleColors.tooltipBorder}
                  strokeWidth={1}
                  cornerRadius={8}
                  shadowColor="rgba(0, 0, 0, 0.5)"
                  shadowBlur={8}
                  shadowOffset={{ x: 0, y: 4 }}
                />
                <Text
                  x={tooltip.x}
                  y={tooltip.y - 8}
                  text={tooltip.text}
                  fontSize={12}
                  fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  fill={AppleColors.tooltipText}
                  fontStyle="500"
                  width={Math.min(
                    tooltip.text.length * 7 + 10,
                    size.width - tooltip.x - 10
                  )}
                />
              </Group>
            )}
          </Layer>

          {/* Nodal Point Layer */}
          {showNodalPoint && (
            <Layer>
              <Circle
                x={centerX}
                y={ballY}
                radius={16}
                fill={AppleColors.nodalPointGlow}
                opacity={0.6}
              />

              <Circle
                x={centerX}
                y={ballY}
                radius={10}
                fill={AppleColors.nodalPoint}
                stroke={AppleColors.textPrimary}
                strokeWidth={2}
                draggable
                shadowColor="rgba(0, 0, 0, 0.4)"
                shadowBlur={6}
                shadowOffset={{ x: 0, y: 3 }}
                dragBoundFunc={pos => {
                  const minY = depthToY(overallDepthRange.min);
                  const maxY = depthToY(overallDepthRange.max);
                  const y = Math.max(minY, Math.min(maxY, pos.y));
                  return {
                    x: centerX,
                    y,
                  };
                }}
                onDragMove={e => {
                  const y = e.target.y();
                  const depth = yToDepth(y);
                  const validDepth = Math.max(depth, overallDepthRange.min);
                  setNodalDepth(validDepth);
                  onNodalPointDepth(validDepth);
                }}
                onMouseEnter={e => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = 'grab';
                  }
                }}
                onMouseLeave={e => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = 'default';
                  }
                }}
                onDragStart={e => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = 'grabbing';
                  }
                }}
                onDragEnd={e => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = 'grab';
                  }
                  const y = e.target.y();
                  const depth = yToDepth(y);
                  const validDepth = Math.max(depth, overallDepthRange.min);
                  setNodalDepth(validDepth);
                  onNodalPointDepth(validDepth);
                }}
              />

              <Text
                x={centerX + 20}
                y={ballY - 8}
                text={`Nodal: ${nodalDepth.toFixed(1)} ft`}
                fontSize={12}
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fill={AppleColors.nodalPoint}
                fontStyle="600"
              />

              <Line
                points={[lineLeftX, ballY, centerX - 15, ballY]}
                stroke={AppleColors.nodalPoint}
                strokeWidth={2}
                dash={[8, 4]}
                opacity={0.8}
              />
            </Layer>
          )}

          {/* Gas Lift Layer */}
          {gasLiftEnabled && (
            <Layer>
              <Circle
                x={centerX - 30}
                y={gasLiftY}
                radius={12}
                fill={AppleColors.gasLiftGlow}
                opacity={0.6}
              />

              <Group
                x={centerX - 30}
                y={gasLiftY}
                draggable
                shadowColor="rgba(0, 0, 0, 0.4)"
                shadowBlur={6}
                shadowOffset={{ x: 0, y: 3 }}
                dragBoundFunc={pos => {
                  const minY = depthToY(overallDepthRange.min);
                  const maxY = depthToY(overallDepthRange.max);
                  const y = Math.max(minY, Math.min(maxY, pos.y));
                  return {
                    x: centerX - 30,
                    y,
                  };
                }}
                onDragMove={e => {
                  const y = e.target.y();
                  const depth = yToDepth(y);
                  const validDepth = Math.max(depth, overallDepthRange.min);
                  setGasLiftValue('injectionDepth', validDepth);
                }}
                onDragEnd={e => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = 'grab';
                  }
                  const y = e.target.y();
                  const depth = yToDepth(y);
                  const validDepth = Math.max(depth, overallDepthRange.min);
                  setGasLiftValue('injectionDepth', validDepth);
                }}
                onMouseEnter={e => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = 'grab';
                  }
                }}
                onMouseLeave={e => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = 'default';
                  }
                }}
                onDragStart={e => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = 'grabbing';
                  }
                }}
              >
                <Arrow
                  points={[0, 0, 25, 0]}
                  pointerLength={8}
                  pointerWidth={6}
                  fill={AppleColors.gasLift}
                  stroke={AppleColors.gasLift}
                  strokeWidth={2}
                />
              </Group>

              <Text
                x={centerX + 20}
                y={gasLiftY - 8}
                text={`Gas Lift: ${
                  typeof injectionDepth === 'string'
                    ? parseFloat(injectionDepth).toFixed(1)
                    : injectionDepth.toFixed(1)
                } ft`}
                fontSize={12}
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fill={AppleColors.gasLift}
                fontStyle="600"
              />

              <Line
                points={[lineLeftX, gasLiftY, centerX - 35, gasLiftY]}
                stroke={AppleColors.gasLift}
                strokeWidth={2}
                dash={[6, 3]}
                opacity={0.8}
              />
            </Layer>
          )}
        </Stage>
      )}
    </div>
  );
};
