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

const getColorFromType = (type: string, colors: AppleColorsType): string => {
  if (casingTypeOptions.includes(type)) {
    return colors.casing;
  } else {
    return colors.bha;
  }
};

/**
 * BhaDiagramKonva - Interactive BHA diagram component with Apple Design System
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

  const tubingRows = useMemo(
    () => bhaRows.filter(row => row.type.toLowerCase().includes('tubing')),
    [bhaRows]
  );

  const bhaToolRows = useMemo(
    () => bhaRows.filter(row => !row.type.toLowerCase().includes('tubing')),
    [bhaRows]
  );

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

  const tubingLength = tubingDepthRange.max - tubingDepthRange.min;
  const bhaLength = bhaDepthRange.max - bhaDepthRange.min;

  const zones = useMemo(() => {
    const hasOnlyTubing = bhaToolRows.length === 0;

    if (hasOnlyTubing) {
      return {
        tubing: {
          startY: PADDING,
          height: innerHeight,
          depthRange: tubingDepthRange,
          scale: innerHeight / tubingLength,
        },
      };
    } else {
      const tubingHeight = innerHeight * 0.3;
      const bhaHeight = innerHeight * 0.7;

      return {
        tubing: {
          startY: PADDING,
          height: tubingHeight,
          depthRange: tubingDepthRange,
          scale: tubingHeight / tubingLength,
        },
        bha: {
          startY: PADDING + tubingHeight,
          height: bhaHeight,
          depthRange: bhaDepthRange,
          scale: bhaHeight / bhaLength,
        },
      };
    }
  }, [
    innerHeight,
    tubingDepthRange,
    bhaDepthRange,
    tubingLength,
    bhaLength,
    bhaToolRows.length,
  ]);

  const depthToY = useCallback(
    (depth: number) => {
      if (
        zones.tubing &&
        depth >= zones.tubing.depthRange.min &&
        depth <= zones.tubing.depthRange.max
      ) {
        const relativeDepth = depth - zones.tubing.depthRange.min;
        return zones.tubing.startY + relativeDepth * zones.tubing.scale;
      } else if (
        zones.bha &&
        depth >= zones.bha.depthRange.min &&
        depth <= zones.bha.depthRange.max
      ) {
        const relativeDepth = depth - zones.bha.depthRange.min;
        return zones.bha.startY + relativeDepth * zones.bha.scale;
      } else {
        if (zones.tubing) {
          const relativeDepth = depth - zones.tubing.depthRange.min;
          return zones.tubing.startY + relativeDepth * zones.tubing.scale;
        }
        return PADDING;
      }
    },
    [zones]
  );

  const yToDepth = useCallback(
    (y: number) => {
      if (
        zones.tubing &&
        y >= zones.tubing.startY &&
        y <= zones.tubing.startY + zones.tubing.height
      ) {
        const relativeY = y - zones.tubing.startY;
        return zones.tubing.depthRange.min + relativeY / zones.tubing.scale;
      } else if (
        zones.bha &&
        y >= zones.bha.startY &&
        y <= zones.bha.startY + zones.bha.height
      ) {
        const relativeY = y - zones.bha.startY;
        return zones.bha.depthRange.min + relativeY / zones.bha.scale;
      } else {
        // Default to tubing zone calculation if outside bounds
        if (zones.tubing) {
          const relativeY = y - zones.tubing.startY;
          return zones.tubing.depthRange.min + relativeY / zones.tubing.scale;
        }
        return initialTop;
      }
    },
    [zones, initialTop]
  );

  const maxDepth = useMemo(() => {
    const depths = [
      initialTop,
      ...casingRows.map(r => r.bottom),
      ...bhaRows.map(r => r.bottom),
    ];
    return Math.max(...depths);
  }, [initialTop, casingRows, bhaRows]);

  const scaleFactor = useMemo(() => {
    return innerHeight > 0 ? innerHeight / (maxDepth - initialTop) : 1;
  }, [innerHeight, maxDepth, initialTop]);

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
    () => [...casingRows, ...bhaRows].sort((a, b) => a.top - b.top),
    [casingRows, bhaRows]
  );

  const ballY = useMemo(() => depthToY(nodalDepth), [depthToY, nodalDepth]);

  const gasLiftY = useMemo(() => {
    const depth =
      typeof injectionDepth === 'string'
        ? parseFloat(injectionDepth)
        : injectionDepth;
    return depthToY(depth);
  }, [depthToY, injectionDepth]);

  const handleGasLiftDragEnd = useCallback(
    (e: any) => {
      const y = e.target.y();
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

    let depth = initialTop;

    if (
      zones.tubing &&
      pos.y >= zones.tubing.startY &&
      pos.y <= zones.tubing.startY + zones.tubing.height
    ) {
      const relativeY = pos.y - zones.tubing.startY;
      depth = zones.tubing.depthRange.min + relativeY / zones.tubing.scale;
    } else if (
      zones.bha &&
      pos.y >= zones.bha.startY &&
      pos.y <= zones.bha.startY + zones.bha.height
    ) {
      const relativeY = pos.y - zones.bha.startY;
      depth = zones.bha.depthRange.min + relativeY / zones.bha.scale;
    }

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

  const renderCasing = (row: BhaRowData) => {
    const odW = Math.max(row.od * exaggeration, 8);
    const rectY = depthToY(row.top);
    const rectH = Math.max(depthToY(row.bottom) - depthToY(row.top), 2);

    return (
      <Group key={`casing-${row.id}`}>
        <Rect
          x={centerX - odW / 2}
          y={rectY}
          width={odW}
          height={rectH}
          fill={AppleColors.casing}
          stroke={AppleColors.borderLine}
          strokeWidth={1}
          cornerRadius={2}
          opacity={0.7}
          shadowColor="rgba(0, 0, 0, 0.2)"
          shadowBlur={3}
          shadowOffset={{ x: 0, y: 1 }}
        />
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
            {casingRows.map(row => renderCasing(row))}

            {allRows.map((row, index) => {
              const odW = Math.max(row.od * exaggeration, 8);
              const idW = Math.max(row.idVal * exaggeration, 4);
              const rectY = calcY(row.top);
              const rectH = Math.max(calcY(row.bottom) - calcY(row.top), 2);

              const outerW = Math.max((odW - idW) / 2, 2);
              const innerX = centerX - idW / 2;

              const componentColor = getColorFromType(row.type, AppleColors);
              const isLastComponent = index === allRows.length - 1;

              return (
                <Group
                  key={row.id}
                  onMouseMove={e => handleMouseMove(e, row)}
                  onMouseLeave={handleMouseOut}
                  opacity={0.9}
                >
                  <Rect
                    x={centerX - odW / 2}
                    y={rectY}
                    width={outerW}
                    height={rectH}
                    fill={componentColor}
                    stroke={AppleColors.borderLine}
                    strokeWidth={1}
                    cornerRadius={2}
                    shadowColor="rgba(0, 0, 0, 0.3)"
                    shadowBlur={4}
                    shadowOffset={{ x: 0, y: 2 }}
                  />

                  <Rect
                    x={innerX}
                    y={rectY}
                    width={idW}
                    height={rectH}
                    fill={AppleColors.tubing}
                    stroke={AppleColors.borderLine}
                    strokeWidth={0.8}
                    cornerRadius={1}
                    opacity={0.6}
                  />

                  <Rect
                    x={centerX + idW / 2}
                    y={rectY}
                    width={outerW}
                    height={rectH}
                    fill={componentColor}
                    stroke={AppleColors.borderLine}
                    strokeWidth={1}
                    cornerRadius={2}
                    shadowColor="rgba(0, 0, 0, 0.3)"
                    shadowBlur={4}
                    shadowOffset={{ x: 0, y: 2 }}
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

                  {(isLastComponent ||
                    (index < allRows.length - 1 &&
                      allRows[index + 1].top - row.bottom > 10)) && (
                    <>
                      <Line
                        points={[
                          lineLeftX,
                          calcY(row.bottom),
                          lineRightX,
                          calcY(row.bottom),
                        ]}
                        stroke={AppleColors.gridLine}
                        strokeWidth={1}
                        dash={[6, 4]}
                        opacity={0.7}
                      />
                      <Text
                        x={labelX}
                        y={calcY(row.bottom) - 8}
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

            <Line
              points={[centerX, PADDING, centerX, size.height - PADDING]}
              stroke={AppleColors.accentLine}
              strokeWidth={1}
              opacity={0.3}
              dash={[2, 8]}
            />
          </Layer>

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
                  // Calculate the valid Y range based on zones
                  let minY = PADDING;
                  let maxY = PADDING + innerHeight;

                  if (zones.tubing) {
                    minY = zones.tubing.startY;
                    maxY = zones.tubing.startY + zones.tubing.height;
                  }

                  if (zones.bha) {
                    maxY = zones.bha.startY + zones.bha.height;
                  }

                  return {
                    x: centerX,
                    y: Math.min(Math.max(pos.y, minY), maxY),
                  };
                }}
                onDragMove={e => {
                  const y = e.target.y();
                  const depth = yToDepth(y);
                  const validDepth = Math.max(depth, initialTop);
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
                  // Ensure final position is accurate
                  const y = e.target.y();
                  const depth = yToDepth(y);
                  const validDepth = Math.max(depth, initialTop);
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

          {gasLiftEnabled && (
            <Layer>
              {/* Gas lift marker glow */}
              <Circle
                x={centerX - 30}
                y={gasLiftY}
                radius={12}
                fill={AppleColors.gasLiftGlow}
                opacity={0.6}
              />

              {/* Gas lift arrow */}
              <Group
                x={centerX - 30}
                y={gasLiftY}
                draggable
                dragBoundFunc={pos => {
                  let minY = PADDING;
                  let maxY = PADDING + innerHeight;

                  if (zones.tubing) {
                    minY = zones.tubing.startY;
                    maxY = zones.tubing.startY + zones.tubing.height;
                  }

                  if (zones.bha) {
                    maxY = zones.bha.startY + zones.bha.height;
                  }

                  return {
                    x: centerX - 30,
                    y: Math.min(Math.max(pos.y, minY), maxY),
                  };
                }}
                onDragEnd={handleGasLiftDragEnd}
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
                  shadowColor="rgba(0, 0, 0, 0.4)"
                  shadowBlur={4}
                  shadowOffset={{ x: 0, y: 2 }}
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

              {/* Gas lift connection line */}
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
