'use client';
import {
  AppleColorsDark,
  AppleColorsLight,
} from '@/core/nodal-modules/wellbore-design/constants/colors.constant';
import {
  Arrow,
  Circle,
  Group,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
} from 'react-konva';
import { getRenderStyle } from '@/core/nodal-modules/wellbore-design/util/get-render-style.util';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAnalysisStore } from '@/store/nodal-modules/nodal-analysis/use-nodal-analysis.store';
import { useBhaStore } from '@/store/nodal-modules/wellbore-design/use-bha.store';
import { useTheme } from 'next-themes';
import type { BhaRowData } from '@/core/nodal-modules/wellbore-design/types/bha-builder.type';

export interface BhaDiagramKonvaProps {
  showNodalPoint: boolean;
  onNodalPointDepth: (depth: number) => void;
  exaggeration?: number;
}

/**
 * BhaDiagramKonva - Interactive BHA diagram component with Apple Design System and proper zone-based scaling
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

  // Separate tubing and BHA tool rows
  const tubingRows = useMemo(
    () => bhaRows.filter(row => row.type.toLowerCase().includes('tubing')),
    [bhaRows]
  );

  const bhaToolRows = useMemo(
    () => bhaRows.filter(row => !row.type.toLowerCase().includes('tubing')),
    [bhaRows]
  );

  // Calculate depth ranges for each component type
  const depthRanges = useMemo(() => {
    const ranges = {
      overall: { min: initialTop, max: initialTop },
      casing: { min: Infinity, max: -Infinity },
      tubing: { min: Infinity, max: -Infinity },
      bha: { min: Infinity, max: -Infinity },
    };

    // Calculate casing range
    if (casingRows.length > 0) {
      const casingDepths = casingRows.flatMap(row => [row.top, row.bottom]);
      ranges.casing.min = Math.min(...casingDepths);
      ranges.casing.max = Math.max(...casingDepths);
    }

    // Calculate tubing range
    if (tubingRows.length > 0) {
      const tubingDepths = tubingRows.flatMap(row => [row.top, row.bottom]);
      ranges.tubing.min = Math.min(...tubingDepths);
      ranges.tubing.max = Math.max(...tubingDepths);
    }

    // Calculate BHA tools range
    if (bhaToolRows.length > 0) {
      const bhaDepths = bhaToolRows.flatMap(row => [row.top, row.bottom]);
      ranges.bha.min = Math.min(...bhaDepths);
      ranges.bha.max = Math.max(...bhaDepths);
    }

    // Calculate overall range
    const allDepths = [initialTop];
    if (casingRows.length > 0)
      allDepths.push(ranges.casing.min, ranges.casing.max);
    if (tubingRows.length > 0)
      allDepths.push(ranges.tubing.min, ranges.tubing.max);
    if (bhaToolRows.length > 0) allDepths.push(ranges.bha.min, ranges.bha.max);

    ranges.overall.min = Math.min(...allDepths);
    ranges.overall.max = Math.max(...allDepths);

    return ranges;
  }, [casingRows, tubingRows, bhaToolRows, initialTop]);

  // Calculate zones with proper scaling based on component combinations
  const zones = useMemo(() => {
    const hasTubing = tubingRows.length > 0;
    const hasBhaTools = bhaToolRows.length > 0;
    const hasCasing = casingRows.length > 0;

    // Determine the maximum depth that defines the bottom of the diagram
    const maxDepth = Math.max(
      hasCasing ? depthRanges.casing.max : -Infinity,
      hasTubing ? depthRanges.tubing.max : -Infinity,
      hasBhaTools ? depthRanges.bha.max : -Infinity,
      initialTop
    );

    let zones: Record<
      string,
      {
        startY: number;
        height: number;
        depthRange: { min: number; max: number };
        scale: number;
      }
    > = {};

    // Scenario 1: Only Casing or Only Tubing - single scale
    if (
      (hasCasing && !hasTubing && !hasBhaTools) ||
      (!hasCasing && hasTubing && !hasBhaTools)
    ) {
      const singleComponentRange = hasCasing
        ? depthRanges.casing
        : depthRanges.tubing;
      const totalDepthRange = singleComponentRange.max - initialTop;
      const scale = innerHeight / Math.max(totalDepthRange, 1);

      if (hasCasing) {
        zones.casing = {
          startY: PADDING,
          height: innerHeight,
          depthRange: { min: initialTop, max: singleComponentRange.max },
          scale,
        };
      }

      if (hasTubing) {
        zones.tubing = {
          startY: PADDING,
          height: innerHeight,
          depthRange: { min: initialTop, max: singleComponentRange.max },
          scale,
        };
      }

      zones.general = {
        startY: PADDING,
        height: innerHeight,
        depthRange: { min: initialTop, max: maxDepth },
        scale,
      };
    }
    // Scenario 2: Tubing + BHA Tools (without Casing)
    else if (hasTubing && hasBhaTools && !hasCasing) {
      const tubingZoneHeight = innerHeight * 0.3;
      const bhaZoneHeight = innerHeight * 0.7;

      // Tubing zone (30%)
      const tubingDepthRange = depthRanges.tubing.max - depthRanges.tubing.min;
      zones.tubing = {
        startY: PADDING,
        height: tubingZoneHeight,
        depthRange: depthRanges.tubing,
        scale: tubingZoneHeight / Math.max(tubingDepthRange, 1),
      };

      // BHA zone (70%)
      const bhaDepthRange = depthRanges.bha.max - depthRanges.bha.min;
      zones.bha = {
        startY: PADDING + tubingZoneHeight,
        height: bhaZoneHeight,
        depthRange: depthRanges.bha,
        scale: bhaZoneHeight / Math.max(bhaDepthRange, 1),
      };

      zones.general = {
        startY: PADDING,
        height: innerHeight,
        depthRange: { min: initialTop, max: maxDepth },
        scale: innerHeight / Math.max(maxDepth - initialTop, 1),
      };
    }
    // Scenario 3: Tubing + BHA + Casing
    else if (hasTubing && hasBhaTools && hasCasing) {
      const tubingZoneHeight = innerHeight * 0.3;
      const lowerZoneHeight = innerHeight * 0.7;

      // Tubing zone (30%) - always uses tubing depth range
      const tubingDepthRange = depthRanges.tubing.max - depthRanges.tubing.min;
      zones.tubing = {
        startY: PADDING,
        height: tubingZoneHeight,
        depthRange: depthRanges.tubing,
        scale: tubingZoneHeight / Math.max(tubingDepthRange, 1),
      };

      // Lower zone (70%) - scale determined by MAX(casing_depth - tubing_depth, bha_depth)
      const casingBeyondTubing = Math.max(
        0,
        depthRanges.casing.max - depthRanges.tubing.max
      );
      const bhaDepthRange = depthRanges.bha.max - depthRanges.bha.min;
      const lowerZoneDepthRange = Math.max(casingBeyondTubing, bhaDepthRange);

      const lowerZoneStartDepth = depthRanges.tubing.max;
      const lowerZoneEndDepth = Math.max(
        depthRanges.casing.max,
        depthRanges.bha.max
      );

      zones.bha = {
        startY: PADDING + tubingZoneHeight,
        height: lowerZoneHeight,
        depthRange: { min: lowerZoneStartDepth, max: lowerZoneEndDepth },
        scale:
          lowerZoneHeight /
          Math.max(lowerZoneEndDepth - lowerZoneStartDepth, 1),
      };

      // Casing spans both zones - will be handled specially in rendering
      zones.casing = {
        startY: PADDING,
        height: innerHeight,
        depthRange: { min: initialTop, max: depthRanges.casing.max },
        scale: 0, // Will be calculated per zone during rendering
      };

      zones.general = {
        startY: PADDING,
        height: innerHeight,
        depthRange: { min: initialTop, max: maxDepth },
        scale: innerHeight / Math.max(maxDepth - initialTop, 1),
      };
    }
    // Scenario 4: Only BHA Tools
    else if (!hasTubing && hasBhaTools) {
      const bhaDepthRange = depthRanges.bha.max - initialTop;
      const scale = innerHeight / Math.max(bhaDepthRange, 1);

      zones.bha = {
        startY: PADDING,
        height: innerHeight,
        depthRange: { min: initialTop, max: depthRanges.bha.max },
        scale,
      };

      zones.general = {
        startY: PADDING,
        height: innerHeight,
        depthRange: { min: initialTop, max: maxDepth },
        scale,
      };
    }
    // Scenario 5: Tubing + Casing (without BHA)
    else if (hasTubing && hasCasing && !hasBhaTools) {
      const maxComponentDepth = Math.max(
        depthRanges.tubing.max,
        depthRanges.casing.max
      );
      const totalDepthRange = maxComponentDepth - initialTop;
      const scale = innerHeight / Math.max(totalDepthRange, 1);

      zones.tubing = {
        startY: PADDING,
        height: innerHeight,
        depthRange: { min: initialTop, max: maxComponentDepth },
        scale,
      };

      zones.casing = {
        startY: PADDING,
        height: innerHeight,
        depthRange: { min: initialTop, max: maxComponentDepth },
        scale,
      };

      zones.general = {
        startY: PADDING,
        height: innerHeight,
        depthRange: { min: initialTop, max: maxDepth },
        scale,
      };
    }

    return zones;
  }, [
    tubingRows,
    bhaToolRows,
    casingRows,
    depthRanges,
    innerHeight,
    initialTop,
  ]);

  // Depth to Y conversion functions with multi-zone casing support
  const depthToY = useCallback(
    (
      depth: number,
      zoneType: 'tubing' | 'bha' | 'casing' | 'general' = 'general'
    ) => {
      // Special handling for casing in multi-zone scenarios
      if (zoneType === 'casing' && zones.tubing && zones.bha && zones.casing) {
        // Casing spans both tubing and BHA zones
        if (depth <= zones.tubing.depthRange.max) {
          // Use tubing zone scale
          const clampedDepth = Math.max(
            zones.tubing.depthRange.min,
            Math.min(depth, zones.tubing.depthRange.max)
          );
          const relativeDepth = clampedDepth - zones.tubing.depthRange.min;
          return zones.tubing.startY + relativeDepth * zones.tubing.scale;
        } else {
          // Use BHA zone scale
          const clampedDepth = Math.max(
            zones.bha.depthRange.min,
            Math.min(depth, zones.bha.depthRange.max)
          );
          const relativeDepth = clampedDepth - zones.bha.depthRange.min;
          return zones.bha.startY + relativeDepth * zones.bha.scale;
        }
      }

      const zone = zones[zoneType];
      if (!zone) return PADDING;

      const clampedDepth = Math.max(
        zone.depthRange.min,
        Math.min(depth, zone.depthRange.max)
      );

      const relativeDepth = clampedDepth - zone.depthRange.min;
      return zone.startY + relativeDepth * zone.scale;
    },
    [zones]
  );

  // Helper function to automatically detect the correct zone for a given depth
  const getZoneForDepth = useCallback(
    (depth: number): 'tubing' | 'bha' | 'casing' | 'general' => {
      const hasTubing = tubingRows.length > 0;
      const hasBhaTools = bhaToolRows.length > 0;
      const hasCasing = casingRows.length > 0;

      // For multi-zone scenarios with tubing and BHA
      if (hasTubing && hasBhaTools && zones.tubing && zones.bha) {
        // If depth is within tubing range, use tubing zone
        if (depth <= zones.tubing.depthRange.max) {
          return 'tubing';
        } else {
          // If depth is beyond tubing, use BHA zone
          return 'bha';
        }
      }

      // For single component scenarios
      if (hasTubing && !hasBhaTools) {
        return 'tubing';
      }

      if (hasBhaTools && !hasTubing) {
        return 'bha';
      }

      if (hasCasing && !hasTubing && !hasBhaTools) {
        return 'casing';
      }

      // Default fallback
      return 'general';
    },
    [tubingRows.length, bhaToolRows.length, casingRows.length, zones]
  );

  const yToDepth = useCallback(
    (y: number) => {
      // Multi-zone Y to depth conversion
      // Detect which zone the Y coordinate is in and apply the corresponding scale

      const hasTubing = tubingRows.length > 0;
      const hasBhaTools = bhaToolRows.length > 0;
      const hasCasing = casingRows.length > 0;

      // For scenarios with multiple zones, determine which zone the Y coordinate falls into
      if (hasTubing && hasBhaTools && zones.tubing && zones.bha) {
        // Scenario: Tubing + BHA (with or without casing)
        const tubingZoneEnd = zones.tubing.startY + zones.tubing.height;

        if (y <= tubingZoneEnd) {
          // Y is in tubing zone (0-30% of canvas)
          const zone = zones.tubing;
          const relativeY = y - zone.startY;
          return zone.depthRange.min + relativeY / zone.scale;
        } else {
          // Y is in BHA zone (30-100% of canvas)
          const zone = zones.bha;
          const relativeY = y - zone.startY;
          return zone.depthRange.min + relativeY / zone.scale;
        }
      }

      // For single component scenarios or when zones aren't properly defined,
      // fall back to general zone
      const zone = zones.general;
      if (!zone) return initialTop;

      const relativeY = y - zone.startY;
      return zone.depthRange.min + relativeY / zone.scale;
    },
    [
      zones,
      initialTop,
      tubingRows.length,
      bhaToolRows.length,
      casingRows.length,
    ]
  );

  const maxRectWidth = useMemo(() => {
    const widths = [...casingRows, ...bhaRows].map(r => r.od * exaggeration);
    return Math.max(...widths, 100);
  }, [casingRows, bhaRows, exaggeration]);

  const halfMaxW = maxRectWidth / 2;
  const centerX = size.width / 2;
  const lineLeftX = centerX - halfMaxW - 20;
  const lineRightX = centerX + halfMaxW + 20;
  const labelX = lineRightX + 15;

  // Sort rows by their actual top depths for sequential rendering
  const sortedTubingRows = useMemo(
    () => [...tubingRows].sort((a, b) => a.top - b.top),
    [tubingRows]
  );

  const sortedBhaToolRows = useMemo(
    () => [...bhaToolRows].sort((a, b) => a.top - b.top),
    [bhaToolRows]
  );

  const sortedCasingRows = useMemo(
    () => [...casingRows].sort((a, b) => a.top - b.top),
    [casingRows]
  );

  const ballY = useMemo(() => {
    const zoneType = getZoneForDepth(nodalDepth);
    return depthToY(nodalDepth, zoneType);
  }, [depthToY, nodalDepth, getZoneForDepth]);

  const gasLiftY = useMemo(() => {
    const depth =
      typeof injectionDepth === 'string'
        ? parseFloat(injectionDepth)
        : injectionDepth;
    const zoneType = getZoneForDepth(depth);
    return depthToY(depth, zoneType);
  }, [depthToY, injectionDepth, getZoneForDepth]);

  // Handle gas lift marker drag (now uses multi-zone conversion)
  const handleGasLiftDragEnd = useCallback(
    (e: any) => {
      const y = e.target.y();
      // Uses multi-zone yToDepth conversion for accurate depth calculation
      const depth = yToDepth(y);
      const validDepth = Math.max(depth, initialTop);
      setGasLiftValue('injectionDepth', validDepth);
    },
    [yToDepth, initialTop, setGasLiftValue]
  );

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

  // Render casing with proper ID (inner diameter) handling and sequential positioning
  const renderCasing = (row: BhaRowData, index: number) => {
    const style = getRenderStyle(row.type, AppleColors);
    const odW = Math.max(row.od * exaggeration, 8);
    const idW = Math.max(row.idVal * exaggeration, 4);

    // Use actual top and bottom depths for positioning
    const rectY = depthToY(row.top, 'casing');
    const bottomY = depthToY(row.bottom, 'casing');
    const rectH = Math.max(bottomY - rectY, 2);

    const outerW = Math.max((odW - idW) / 2, 2);
    const innerX = centerX - idW / 2;

    // Show bottom line for last casing or when there's a gap to next casing
    const isLastCasing = index === sortedCasingRows.length - 1;
    const hasGapToNext =
      index < sortedCasingRows.length - 1 &&
      sortedCasingRows[index + 1].top > row.bottom;
    const showBottom = isLastCasing || hasGapToNext;

    return (
      <Group
        key={`casing-${row.id}`}
        onMouseMove={e => handleMouseMove(e, row)}
        onMouseLeave={handleMouseOut}
        opacity={0.9}
      >
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

        {/* Inner bore (ID) */}
        <Rect
          x={innerX}
          y={rectY}
          width={idW}
          height={rectH}
          fill={AppleColors.background}
          stroke={style.strokeColor}
          strokeWidth={0.8}
          cornerRadius={1}
          opacity={0.6}
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
        {showBottom && (
          <>
            <Line
              points={[lineLeftX, bottomY, lineRightX, bottomY]}
              stroke={AppleColors.gridLine}
              strokeWidth={1}
              dash={[6, 4]}
              opacity={0.7}
            />
            <Text
              x={labelX}
              y={bottomY - 8}
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

  // Render BHA component (tubing or BHA tools) with proper zone-based positioning
  const renderBhaComponent = (
    row: BhaRowData,
    index: number,
    componentType: 'tubing' | 'bha'
  ) => {
    const style = getRenderStyle(row.type, AppleColors);
    const odW = Math.max(row.od * exaggeration, 8);
    const idW = Math.max(row.idVal * exaggeration, 4);

    // Use actual top and bottom depths for positioning
    const rectY = depthToY(row.top, componentType);
    const bottomY = depthToY(row.bottom, componentType);
    const rectH = Math.max(bottomY - rectY, 2);

    const outerW = Math.max((odW - idW) / 2, 2);
    const innerX = centerX - idW / 2;

    const sortedRows =
      componentType === 'tubing' ? sortedTubingRows : sortedBhaToolRows;
    const isLastComponent = index === sortedRows.length - 1;
    const hasGapToNext =
      index < sortedRows.length - 1 && sortedRows[index + 1].top > row.bottom;

    return (
      <Group
        key={`${componentType}-${row.id}`}
        onMouseMove={e => handleMouseMove(e, row)}
        onMouseLeave={handleMouseOut}
        opacity={0.9}
      >
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

        {(isLastComponent || hasGapToNext) && (
          <>
            <Line
              points={[lineLeftX, bottomY, lineRightX, bottomY]}
              stroke={AppleColors.gridLine}
              strokeWidth={1}
              dash={[6, 4]}
              opacity={0.7}
            />
            <Text
              x={labelX}
              y={bottomY - 8}
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
            {/* Zone separators */}
            {zones.tubing && zones.bha && (
              <Line
                points={[
                  0,
                  zones.tubing.startY + zones.tubing.height,
                  size.width,
                  zones.tubing.startY + zones.tubing.height,
                ]}
                stroke={AppleColors.gridLine}
                strokeWidth={2}
                dash={[10, 5]}
                opacity={0.5}
              />
            )}

            {/* Render Casing */}
            {sortedCasingRows.map((row, index) => renderCasing(row, index))}

            {/* Render Tubing - rendered in tubing zone */}
            {sortedTubingRows.map((row, index) =>
              renderBhaComponent(row, index, 'tubing')
            )}

            {/* Render BHA Tools - rendered in BHA zone */}
            {sortedBhaToolRows.map((row, index) =>
              renderBhaComponent(row, index, 'bha')
            )}

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
                  // Use general zone bounds but allow movement across all zones
                  const minY = depthToY(
                    zones.general.depthRange.min,
                    'general'
                  );
                  const maxY = depthToY(
                    zones.general.depthRange.max,
                    'general'
                  );
                  const y = Math.max(minY, Math.min(maxY, pos.y));
                  return {
                    x: centerX,
                    y,
                  };
                }}
                onDragMove={e => {
                  const y = e.target.y();
                  // Use multi-zone conversion to get accurate depth
                  const depth = yToDepth(y);
                  const validDepth = Math.max(
                    depth,
                    zones.general.depthRange.min
                  );
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
                  // Use multi-zone conversion to get accurate depth
                  const depth = yToDepth(y);
                  const validDepth = Math.max(
                    depth,
                    zones.general.depthRange.min
                  );
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
                  // Use general zone bounds but allow movement across all zones
                  const minY = depthToY(
                    zones.general.depthRange.min,
                    'general'
                  );
                  const maxY = depthToY(
                    zones.general.depthRange.max,
                    'general'
                  );
                  const y = Math.max(minY, Math.min(maxY, pos.y));
                  return {
                    x: centerX - 30,
                    y,
                  };
                }}
                onDragMove={e => {
                  const y = e.target.y();
                  // Use multi-zone conversion to get accurate depth
                  const depth = yToDepth(y);
                  const validDepth = Math.max(
                    depth,
                    zones.general.depthRange.min
                  );
                  setGasLiftValue('injectionDepth', validDepth);
                }}
                onDragEnd={e => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = 'grab';
                  }
                  const y = e.target.y();
                  // Use multi-zone conversion to get accurate depth
                  const depth = yToDepth(y);
                  const validDepth = Math.max(
                    depth,
                    zones.general.depthRange.min
                  );
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
