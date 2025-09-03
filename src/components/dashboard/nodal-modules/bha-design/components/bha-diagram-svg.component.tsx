'use client';
import { useTheme } from 'next-themes';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBhaStore } from "@/store/nodal-modules/wellbore-design/use-bha.store";

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

const BHA_SVG_MAP: Record<string, string> = {
  'Anchor/Catcher': '/BHA SVG_s/Anchor - Catcher-08.svg',
  'Bull Plug': '/BHA SVG_s/Bull Pug-02.svg',
  'Centralizer': '/BHA SVG_s/Centralizer-07.svg',
  'Gas Lift Mandrel': '/BHA SVG_s/Gas Lift Mandrel-04.svg',
  'On/Off Tool': '/BHA SVG_s/On - Off-05.svg',
  'Perforated Joint': '/BHA SVG_s/Perforated Joint-10.svg',
  'Profile Nipple': '/BHA SVG_s/Profile Nipple-09.svg',
  'Mechanical Seating Nipple': '/BHA SVG_s/Seating Niple-03.svg',
  'Pump Seating Nipple': '/BHA SVG_s/Seating Niple-03.svg',
  'ESP': '/BHA SVG_s/Bomba-02.svg',
};

interface BhaDiagramSimpleProps {
  exaggeration?: number;
  registerDownload?: (fn: (() => void) | null) => void;
}

const BhaDiagramSvg: FC<BhaDiagramSimpleProps> = ({ registerDownload, exaggeration = 1 }) => {
  const { bhaRows, initialTop } = useBhaStore();

  const { theme } = useTheme();
  const AppleColors = useMemo(() => {
    return theme === 'dark' ? AppleColorsDark : AppleColorsLight;
  }, [theme]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<any>(null);
  const fabricCanvasRef = useRef<any | null>(null);
  const svgCacheRef = useRef<Map<string, fabric.Group>>(new Map());

  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let mounted = true;
    let createdCanvas: any = null;

    (async () => {
      const mod = await import('fabric');
      const fab = mod.fabric;
      fabricRef.current = fab;

      if (!mounted || !canvasElRef.current) return;

      createdCanvas = new fab.Canvas(canvasElRef.current, {
        selection: false,
        preserveObjectStacking: true,
      });
      if (containerRef.current) {
        createdCanvas.setWidth(containerRef.current.clientWidth);
        createdCanvas.setHeight(containerRef.current.clientHeight);
      }
      fabricCanvasRef.current = createdCanvas;
    })();

    return () => {
      mounted = false;
      if (createdCanvas) {
        try {
          createdCanvas.dispose();
        } catch (e) {
          /* ignore */
        }
      }
    };
  }, []);


  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;
    canvas.setWidth(size.width + 60);
    canvas.setHeight(size.height);
    canvas.renderAll();
  }, [size.width, size.height]);

  const PADDING = 20;
  const innerHeight = Math.max(size.height - 2 * PADDING, 0);

  const maxDepth = useMemo(() => {
    const depths = [initialTop, ...bhaRows.map(r => r.bottom)];
    return Math.max(...depths);
  }, [initialTop, bhaRows]);

  const scaleFactor = useMemo(() => {
    return innerHeight > 0 ? innerHeight / (maxDepth - initialTop) : 1;
  }, [innerHeight, maxDepth, initialTop]);

  const calcY = useCallback(
    (depth: number) => PADDING + (depth - initialTop) * scaleFactor,
    [initialTop, scaleFactor]
  );

  const maxRectWidth = useMemo(() => {
    const widths = bhaRows.map(r => r.od * exaggeration);
    return Math.max(...widths, 100);
  }, [bhaRows, exaggeration]);

  const centerX = size.width / 2;
  const allRows = useMemo(() => [...bhaRows].sort((a, b) => a.top - b.top), [bhaRows]);

  const cloneGroup = useCallback((group: fabric.Group): Promise<fabric.Group> => {
    return new Promise((resolve) => {
      group.clone((cloned: fabric.Group) => resolve(cloned));
    });
  }, []);

  const loadSvgGroup = useCallback((url: string): Promise<fabric.Group> => {
    const fab = fabricRef.current;
    return new Promise((resolve) => {
      fab.loadSVGFromURL(url, (objects: any, options: any) => {
        const cleanObjects = objects.filter(
          (obj: any) => !(obj.type === "rect" && obj.fill === "black")
        );
        const group = fab.util.groupSVGElements(cleanObjects, options) as fabric.Group;
        resolve(group);
      });
    });
  }, []);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    const fab = fabricRef.current;
    if (!canvas || !fab) return;
    canvas.clear();
    if (allRows.length === 0) return;

    let currentY = PADDING;
    let rowBottom = allRows[allRows.length - 1].bottom;
    const totalHeight = calcY(rowBottom) + PADDING;

    const centerLine = new fab.Line([centerX, PADDING, centerX, (totalHeight - PADDING)], {
      stroke: AppleColors.borderLine,
      strokeWidth: 1,
      strokeDashArray: [2, 8],
      opacity: 0.3,
      selectable: false,
      evented: false,
    });
    canvas.add(centerLine);

    (async () => {
      for (const row of allRows) {
        // const rectY = calcY(row.top); // top red line
        const rectY = currentY; // top red line
        const rectH = Math.max((calcY(row.bottom) - calcY(row.top)) + (exaggeration > 10 ? exaggeration * row.od - 2 : 0), 2);
        const targetWidth = Math.max(row.od * exaggeration, 30);
        const xPos = centerX - targetWidth / 2;
        currentY += rectH;

        const rect = new fab.Rect({
          left: xPos,
          top: rectY,
          width: targetWidth,
          height: rectH,
          fill: '#7C9AD933',
          stroke: '#D1D5DB',
          strokeWidth: 1,
          rx: 2,
          ry: 2,
          selectable: false,
          evented: false,
        });
        canvas.add(rect);

        const rectTopLine = new fab.Line(
          [centerX - targetWidth / 2 - 35, rectY, centerX + targetWidth / 2 + 35, rectY],
          {
            fill: AppleColors.borderLine,
            stroke: AppleColors.borderLine,
            strokeWidth: 1.5,
            strokeDashArray: [10, 4],
            opacity: 0.6,
            selectable: false,
            evented: false,
          }
        );
        canvas.add(rectTopLine);

        const textFt = new fab.Text(`${row.top.toFixed(1)} ft`, {
          left: centerX + targetWidth / 2 + 43,
          top: rectY - 5,
          fontSize: 13,
          fill: AppleColors.textSecondary,
          selectable: false,
          evented: false,
        });
        canvas.add(textFt);

        const svgUrl = BHA_SVG_MAP[row.type];
        if (!svgUrl) continue;
        try {
          let group: fabric.Group;
          if (svgCacheRef.current.has(row.type)) {
            const cachedGroup = svgCacheRef.current.get(row.type);
            if (cachedGroup) {
              group = await cloneGroup(cachedGroup);
            } else {
              continue;
            }
          } else {
            const originalGroup = await loadSvgGroup(svgUrl);
            svgCacheRef.current.set(row.type, originalGroup);
            group = await cloneGroup(originalGroup);
          }

          const bounds = group.getBoundingRect(false);
          const scaleY = rectH / bounds.height;
          // const scaleX = targetWidth / bounds.width;
          const scaleX = scaleY;
          const scale = Math.min(scaleX, scaleY);

          group.set({
            left: centerX,
            top: rectY + rectH / 2,
            originX: 'center',
            originY: 'center',
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            hasControls: true,
            hasBorders: true,
            evented: true,
            opacity: 0.95,
          });

          group.setCoords();
          canvas.add(group);
        } catch (error) {
          console.error(`Error loading SVG for ${row.type}:`, error);
        }
      }

      const last = allRows[allRows.length - 1];
      const lineBottom = new fab.Line(
        [centerX - maxRectWidth / 2 - 10, currentY, centerX + maxRectWidth / 2 + 10, currentY],
        {
          stroke: AppleColors.gridLine,
          strokeWidth: 1.5,
          strokeDashArray: [10, 4],
          selectable: false,
          evented: false,
        }
      );
      canvas.add(lineBottom);

      const bottomText = new fab.Text(`${last.bottom.toFixed(1)} ft`, {
        left: centerX + maxRectWidth / 2 + 10,
        top: currentY - 5,
        fontSize: 13,
        fill: AppleColors.textPrimary,
        selectable: false,
        evented: false,
      });
      canvas.add(bottomText);

      canvas.setHeight(currentY + PADDING);
      canvas.requestRenderAll();
    })();
  }, [
    bhaRows,
    exaggeration,
    calcY,
    centerX,
    maxRectWidth,
    theme
  ]);

  const downloadPNG = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL({ format: 'png' });
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'bha-diagram.png';
    a.click();
  }, []);
  /* Para que?? */
  useEffect(() => {
    if (registerDownload) registerDownload(downloadPNG);
    return () => {
      if (registerDownload) registerDownload(null);
    };
  }, [registerDownload, downloadPNG]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[650px] rounded-lg border border-border/30 overflow-y-auto overflow-x-hidden" //scrollbar-hide
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: '600px',
        position: 'relative',
        backgroundColor: AppleColors.background
      }}
    >
      <canvas ref={canvasElRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

export default BhaDiagramSvg;