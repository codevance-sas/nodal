'use client';
import { Table } from 'lucide-react';
import { AppColors } from '@/core/common/types/app-colors.type';
import { Badge } from '@/components/ui/badge';
import { BhaBuilderTable } from './bha/components/bha-builder-table.component';
import { BhaDiagramKonvaProps } from './bha/components/bha-diagram-konva.component';
import {
  bhaTypeOptions,
  casingTypeOptions,
} from '@/core/nodal-modules/wellbore-design/constants/bha-type-options.constant';
import { Button } from '@/components/ui/button';
import { FC, Suspense, useCallback, useState, useEffect, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  recalcTopBtmBha,
  recalcTopBtmCasing,
} from '@/core/nodal-modules/wellbore-design/util/bha-recalc.util';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBhaStore } from '@/store/nodal-modules/wellbore-design/use-bha.store';
import { useDebouncedValue } from '@mantine/hooks';
import { validate } from '@/core/nodal-modules/wellbore-design/util/bha-validations.util';
import dynamic from 'next/dynamic';

const BhaDiagramKonva = dynamic(
  () =>
    import('./bha/components/bha-diagram-konva.component').then(mod => ({
      default: mod.BhaDiagramKonva,
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

interface BHADesignTabProps {
  nodalColors: AppColors;
}

enum BhaCasingBuilderTab {
  BHA = 'bha',
  CASING = 'casing',
}

/**
 * Componente del tab de diseño BHA (Bottom Hole Assembly)
 * Muestra la configuración y visualización del ensamble de fondo de pozo
 */
export const BHADesignTab: FC<BHADesignTabProps> = ({ nodalColors }) => {
  const [activeTab, setActiveTab] = useState<BhaCasingBuilderTab>(
    BhaCasingBuilderTab.BHA
  );
  const [exaggeration, setExaggeration] = useState<number>(30);
  const [debounced] = useDebouncedValue(exaggeration, 100);
  const [isTableOpen, setTableOpen] = useState(true);
  const [depthInput, setDepthInput] = useState<string>('');
  const [showNodalPoint, setShowNodalPoint] = useState<boolean>(false);

  const {
    addBhaRow,
    addCasingRow,
    averageTubingJoints,
    bhaRows,
    casingRows,
    initialTop,
    nodalDepth,
    setAverageTubingJoints,
    setBhaRows,
    setCasingRows,
    setInitialTop,
    setNodalDepth,
  } = useBhaStore();

  useEffect(() => {
    setDepthInput(nodalDepth.toFixed(2));
  }, [nodalDepth]);

  useEffect(() => {
    if (isTableOpen) {
      setExaggeration(10);
    } else {
      setExaggeration(30);
    }
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

  const handleTabChange = useCallback((newValue: string) => {
    setActiveTab(newValue as BhaCasingBuilderTab);
  }, []);

  return (
    <div className="flex flex-col min-w-full min-h-[100%]">
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/30 p-4 space-y-4 min-w-full flex-shrink-0">
        <div className="flex flex-wrap items-center justify-around gap-3 w-full">
          <div className="space-y-2">
            <h1 className="text-title-1 font-bold text-foreground flex items-center gap-3">
              WBD Builder
            </h1>
          </div>

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
            <div className="flex items-center space-x-2">
              <Switch
                id="nodal-point-switch"
                checked={showNodalPoint}
                onCheckedChange={setShowNodalPoint}
              />
              <Label
                htmlFor="nodal-point-switch"
                className="text-callout font-medium"
              >
                Show Nodal Point
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Label
                htmlFor="depth-input"
                className="text-sm text-muted-foreground"
              >
                Depth:
              </Label>
              <Input
                id="depth-input"
                type="text"
                value={depthInput}
                onChange={e => setDepthInput(e.target.value)}
                onBlur={handleDepthUpdate}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleDepthUpdate();
                  }
                }}
                className="w-32 h-8"
              />
            </div>

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

      <div className="flex gap-6 h-[100%] w-full overflow-hidden p-6 flex-1">
        <div
          className={`card-apple flex justify-center items-center transition-all duration-500 ease-apple h-[100%] ${
            isTableOpen ? 'flex-[3_1_0%]' : 'flex-1'
          } min-w-0`}
        >
          <MemoizedDiagram
            exaggeration={debounced}
            onNodalPointDepth={(depth: number) => setNodalDepth(depth)}
            showNodalPoint={showNodalPoint}
          />
        </div>

        {isTableOpen && (
          <div
            className={`
              card-apple overflow-hidden flex-[7_1_0%] min-w-0 h-[100%]
              transition-all duration-700 ease-apple
              transform-gpu
              ${
                isTableOpen
                  ? 'translate-y-0 scale-100 opacity-100'
                  : 'translate-y-4 scale-95 opacity-0'
              }
            `}
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
                ${
                  isTableOpen
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-2 opacity-0'
                }
              `}
              style={{
                opacity: isTableOpen ? 1 : 0,
                transform: isTableOpen ? 'translateY(0)' : 'translateY(8px)',
              }}
            >
              <div
                className={`
                  transition-all duration-600 ease-apple delay-200
                  transform-gpu
                  ${
                    isTableOpen
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-1 opacity-0'
                  }
                `}
                style={{
                  opacity: isTableOpen ? 1 : 0,
                  transform: isTableOpen ? 'translateY(0)' : 'translateY(4px)',
                }}
              >
                <Tabs
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-system-gray5 dark:bg-system-gray4">
                    <TabsTrigger
                      value={BhaCasingBuilderTab.BHA}
                      className="data-[state=active]:bg-system-blue/10 data-[state=active]:text-system-blue transition-all duration-200 ease-apple"
                    >
                      BHA
                    </TabsTrigger>
                    <TabsTrigger
                      value={BhaCasingBuilderTab.CASING}
                      className="data-[state=active]:bg-system-blue/10 data-[state=active]:text-system-blue transition-all duration-200 ease-apple"
                    >
                      CASING
                    </TabsTrigger>
                  </TabsList>

                  {/* Body con contenido animado */}
                  <div
                    className={`
                      flex-1 mt-6 transition-all duration-700 ease-apple delay-300
                      transform-gpu h-[100%]
                      ${
                        isTableOpen
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-3 opacity-0'
                      }
                    `}
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
                      <TabsContent
                        value={BhaCasingBuilderTab.BHA}
                        className="mt-0"
                      >
                        <div
                          className={`
                            h-[100%] overflow-auto
                            transition-all duration-500 ease-apple delay-400
                            transform-gpu
                            ${
                              isTableOpen
                                ? 'translate-y-0 opacity-100'
                                : 'translate-y-2 opacity-0'
                            }
                          `}
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
                            isAverageTubingJointsVisible={true}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent
                        value={BhaCasingBuilderTab.CASING}
                        className="mt-0"
                      >
                        <div
                          className={`
                            h-[100%] overflow-auto
                            transition-all duration-500 ease-apple delay-400
                            transform-gpu
                            ${
                              isTableOpen
                                ? 'translate-y-0 opacity-100'
                                : 'translate-y-2 opacity-0'
                            }
                          `}
                          style={{
                            opacity: isTableOpen ? 1 : 0,
                            transform: isTableOpen
                              ? 'translateY(0)'
                              : 'translateY(8px)',
                          }}
                        >
                          <BhaBuilderTable
                            addRow={addCasingRow}
                            initialTop={initialTop}
                            nameTable="CASING"
                            options={casingTypeOptions}
                            recalcTopBtm={recalcTopBtmCasing}
                            rows={casingRows}
                            setInitialTop={setInitialTop}
                            setRows={setCasingRows}
                            validate={validate}
                            averageTubingJoints={averageTubingJoints}
                            setAverageTubingJoints={setAverageTubingJoints}
                          />
                        </div>
                      </TabsContent>
                    </Suspense>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MemoizedDiagram = memo(
  ({
    exaggeration,
    showNodalPoint,
    onNodalPointDepth,
  }: BhaDiagramKonvaProps) => (
    <BhaDiagramKonva
      exaggeration={exaggeration}
      showNodalPoint={showNodalPoint}
      onNodalPointDepth={onNodalPointDepth}
    />
  )
);
