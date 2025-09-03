'use client';
import { Table } from 'lucide-react';
import { AppColors } from '@/core/common/types/app-colors.type';
import { Badge } from '@/components/ui/badge';
import { BhaBuilderTable } from '../wellbore-design/bha/components';
import { Button } from '@/components/ui/button';
import { FC, Suspense, useState, useEffect, memo, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { recalcTopBtmBha } from '@/core/nodal-modules/wellbore-design/util/bha-recalc.util';
import { bhaTypeOptions } from '@/core/nodal-modules/wellbore-design/constants/bha-type-options.constant';
import { Slider } from '@/components/ui/slider';
import { useBhaStore } from '@/store/nodal-modules/wellbore-design/use-bha.store';
import { useDebouncedValue } from '@mantine/hooks';
import { validate } from '@/core/nodal-modules/wellbore-design/util/bha-validations.util';
import dynamic from 'next/dynamic';

const BhaDiagramSvg = dynamic(
  () =>
    import('./components/bha-diagram-svg.component').then(mod => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[100%] w-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-system-blue border-t-transparent mx-auto" />
          <div className="space-y-2">
            <p className="text-title-3 font-semibold text-foreground">
              Cargando diagrama BHA...
            </p>
            <p className="text-callout text-muted-foreground">
              Inicializando componente interactivo
            </p>
          </div>
        </div>
      </div>
    ),
  }
);

interface BhaDiagramSvgProps {
  exaggeration?: number;
  handleRegisterDownload?:(fn: (() => void) | null) => void;
}

interface BHADesignTabProps {
  nodalColors: AppColors;
}


export const BHADesignSvg: FC<BHADesignTabProps> = ({ nodalColors }) => {
  const [exaggeration, setExaggeration] = useState<number>(30);
  const [debounced] = useDebouncedValue(exaggeration, 100);
  const [isTableOpen, setTableOpen] = useState(true);
  const [depthInput, setDepthInput] = useState<string>('');

  const downloadRef = useRef<(() => void) | null>(null);
  const handleRegisterDownload = useCallback((fn: (() => void) | null) => {
    downloadRef.current = fn;
  }, []);
  const handleDownload = useCallback(() => {
    downloadRef.current?.();
  }, []);

  const {
    addBhaRow,
    averageTubingJoints,
    bhaRows,
    initialTop,
    nodalDepth,
    setAverageTubingJoints,
    setBhaRows,
    setInitialTop,
    setNodalDepth,
  } = useBhaStore();

  useEffect(() => {
    setDepthInput(nodalDepth.toFixed(2));
  }, [nodalDepth]);

  useEffect(() => {
    setExaggeration(isTableOpen ? 10 : 30);
  }, [isTableOpen]);

  const handleDepthUpdate = () => {
    const newDepth = parseFloat(depthInput) ?? 0;
    const validDepth = Math.max(newDepth, initialTop);
    setDepthInput(Number(validDepth).toFixed(2));
    setNodalDepth(validDepth);
  };

  const handleSliderChange = (value: number[]) => {
    setExaggeration(value[0]);
  };

  return (
    <div className="flex flex-col min-w-full min-h-[100%]">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/30 p-4 space-y-4 min-w-full flex-shrink-0">
        <div className="bg-background/95 backdrop-blur-sm border-b border-border/30 p-4 space-y-4 min-w-full flex-shrink-0">
          <div className="flex items-center justify-between w-full gap-3">
            <div className="space-y-2">
              <h1 className="text-title-1 font-bold text-foreground flex items-center gap-3">
                BHA Design
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-3 bg-card rounded-lg p-3 border">
                <Label
                  htmlFor="exaggeration-slider"
                  className="text-sm font-medium text-muted-foreground whitespace-nowrap"
                >
                  Exaggeration:
                </Label>
                <div className="flex items-center space-x-2 min-w-[180px]">
                  <Slider
                    id="exaggeration-slider"
                    value={[exaggeration]}
                    onValueChange={handleSliderChange}
                    min={10}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Badge
                    variant="secondary"
                    className="font-bold min-w-[45px] text-center text-xs"
                  >
                    {exaggeration}×
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-card rounded-lg p-3 border">
                <Button
                  onClick={() => setTableOpen(!isTableOpen)}
                  variant={isTableOpen ? 'filled' : 'outline'}
                  size="sm"
                  className="transition-all duration-200"
                >
                  <Table className="h-4 w-4 mr-2" />
                  {isTableOpen ? 'Hide Table' : 'BHA Table'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 h-[100%] w-full overflow-hidden p-6 flex-1">
        {/* CANVA */}
        <div
          className={`card-apple flex justify-center items-center transition-all duration-500 ease-apple h-[100%] 
            ${isTableOpen ? 'flex-[3_1_0%]' : 'flex-1'} min-w-0`}
        >
          <MemoizedDiagram
            exaggeration={debounced}
            handleRegisterDownload={handleRegisterDownload}
          />
        </div>

        {isTableOpen && (
          <div
            className={`card-apple overflow-hidden flex-[7_1_0%] min-w-0 h-[100%] transition-all 
              duration-700 ease-apple transform-gpu
              ${isTableOpen
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-4 scale-95 opacity-0'
              }`}
            style={{
              opacity: isTableOpen ? 1 : 0,
              transform: isTableOpen
                ? 'translateY(0) scale(1)'
                : 'translateY(16px) scale(0.95)',
            }}
          >
            <div
              className={`
                flex flex-col h-[100%] w-full p-6
                transition-all duration-500 ease-apple delay-150
                transform-gpu
                ${isTableOpen
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-2 opacity-0'
                }`}
              style={{
                opacity: isTableOpen ? 1 : 0,
                transform: isTableOpen ? 'translateY(0)' : 'translateY(8px)',
              }}
            >
              <div
                className={`
                  transition-all duration-600 ease-apple delay-200 transform-gpu
                  ${isTableOpen
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-1 opacity-0'
                  }`}
                style={{
                  opacity: isTableOpen ? 1 : 0,
                  transform: isTableOpen ? 'translateY(0)' : 'translateY(4px)',
                }}
              >
                {/* Body con contenido animado */}
                <div
                  className={`
                    flex-1 mt-6 transition-all duration-700 ease-apple delay-300 transform-gpu h-[100%]
                    ${isTableOpen
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-3 opacity-0'
                    }`}
                  style={{
                    opacity: isTableOpen ? 1 : 0,
                    transform: isTableOpen
                      ? 'translateY(0)'
                      : 'translateY(12px)',
                  }}
                >
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-[100%] space-x-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-system-blue border-t-transparent" />
                        <span className="text-system-blue animate-pulse text-callout">
                          Cargando...
                        </span>
                      </div>
                    }
                  >
                    <div
                      className={`
                        h-[100%] overflow-auto
                        transition-all duration-500 ease-apple delay-400
                        transform-gpu
                        ${isTableOpen
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-2 opacity-0'
                        }`}
                      style={{
                        opacity: isTableOpen ? 1 : 0,
                        transform: isTableOpen
                          ? 'translateY(0)'
                          : 'translateY(8px)',
                      }}
                    >
                      <BhaBuilderTable
                        addRow={addBhaRow}
                        initialTop={initialTop}
                        nameTable="BHA"
                        options={bhaTypeOptions}
                        recalcTopBtm={recalcTopBtmBha}
                        rows={bhaRows}
                        setInitialTop={setInitialTop}
                        setRows={setBhaRows}
                        validate={validate}
                        averageTubingJoints={averageTubingJoints}
                        setAverageTubingJoints={setAverageTubingJoints}
                        isAverageTubingJointsVisible={false}
                        onDownload={handleDownload}
                      />
                    </div>
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MemoizedDiagram = memo(({ exaggeration, handleRegisterDownload }: BhaDiagramSvgProps) => (
  <BhaDiagramSvg 
    exaggeration={exaggeration} 
    registerDownload={handleRegisterDownload}
  />
));
