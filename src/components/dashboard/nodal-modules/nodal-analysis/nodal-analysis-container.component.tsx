'use client';

import React, { memo, Suspense, useCallback, useMemo, useState } from 'react';
import { NodalAnalysisStepper } from './components/nodal-analysis-stepper.component';
import { NodalAnalysisIprModule } from './components/nodal-analysis-ipr-module.component';
import { NodalAnalysisPvtModule } from './components/nodal-analysis-pvt-module.component';
import { NodalAnalysisHydraulicsModule } from './components/nodal-analysis-hydraulics-module.component';
import { NodalAnalysisChartsModule } from './components/nodal-analysis-charts-module.component';
import { NodalAnalysisMultiCorrelationModule } from './components/nodal-analysis-multi-correlation-module.component';
import { useAnalysisStore } from '@/store/nodal-modules/nodal-analysis/use-nodal-analysis.store';
import { ContextualDescriptionPanel } from '@/components/dashboard/nodal-modules/common/contextual-description-panel.component';
import { useBhaStore } from '@/store/nodal-modules/wellbore-design/use-bha.store';
import { WellboreDesignRequiredModal } from './components/wellbore-design-required-modal.component';
import { mergeBhaAndCasingRows } from '@/core/nodal-modules/nodal-analysis/util/merge-bha-and-casing-rows.util';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  BhaDiagramKonva,
  BhaDiagramKonvaProps,
} from '../wellbore-design/bha/components/bha-diagram-konva.component';
import { Button } from '@/components/ui/button';
import { Activity, Settings, Table } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BhaBuilderTable } from '../wellbore-design/bha/components/bha-builder-table.component';
import {
  bhaTypeOptions,
  casingTypeOptions,
} from '@/core/nodal-modules/wellbore-design/constants/bha-type-options.constant';
import { BhaCasingBuilderTab } from '@/core/nodal-modules/wellbore-design/types/bha-builder.type';
import { validate } from '@/core/nodal-modules/wellbore-design/util/bha-validations.util';
import {
  recalcTopBtmBha,
  recalcTopBtmCasing,
} from '@/core/nodal-modules/wellbore-design/util/bha-recalc.util';

const NodalAnalysisSensitivityModule = () => (
  <div className="p-8 text-center bg-card rounded-xl border border-border/50">
    <p className="text-muted-foreground">Sensitivity Module - TODO</p>
  </div>
);

export const NodalAnalysisContainer: React.FC = () => {
  const { activeSection } = useAnalysisStore();
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
  const [activeTab, setActiveTab] = useState<BhaCasingBuilderTab>(
    BhaCasingBuilderTab.BHA
  );
  const [showBHADesign, setShowBHADesign] = useState<boolean>(false);
  const [isTableOpen, setTableOpen] = useState(false);

  const isWellboreDesignRequired =
    bhaRows.length === 0 && casingRows.length === 0;

  const handleTabChange = useCallback((newValue: string) => {
    setActiveTab(newValue as BhaCasingBuilderTab);
  }, []);

  const mergedRows = useMemo(() => {
    if (isWellboreDesignRequired) return [];
    return mergeBhaAndCasingRows(bhaRows, casingRows, nodalDepth);
  }, [bhaRows, casingRows, nodalDepth, isWellboreDesignRequired]);

  return (
    <>
      <WellboreDesignRequiredModal open={isWellboreDesignRequired} />

      {/* Main Container with Apple Design System */}
      <div className={cn('min-h-screen bg-background', 'p-6 space-y-8')}>
        <NodalAnalysisStepper
          showBHADesign={showBHADesign}
          setShowBHADesign={setShowBHADesign}
        />

        <div
          className={cn(
            'flex gap-4 mx-auto max-w-7xl',
            'transition-all duration-500 ease-out',
            showBHADesign ? 'justify-between' : 'justify-center'
          )}
        >
          {/* BHA Design Panel - Conditional rendering with animation */}
          {showBHADesign && (
            <Card
              className={cn(
                'w-[30%] min-w-[350px]',
                'border-border/60 shadow-xl shadow-black/5',
                'bg-gradient-to-br from-background via-background to-muted/20',
                'backdrop-blur-xl',
                'dark:bg-gradient-to-br dark:from-background/95 dark:via-background/90 dark:to-muted/30',
                'dark:border-border/30 dark:shadow-lg',
                'animate-in fade-in-0 slide-in-from-left-4 duration-500'
              )}
              style={{
                maxHeight: '760px',
              }}
            >
              <CardContent className="p-6 space-y-8">
                <div className="space-y-4">
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

                <MemoizedDiagram
                  exaggeration={15}
                  showNodalPoint={true}
                  onNodalPointDepth={(depth: number) => setNodalDepth(depth)}
                />
              </CardContent>
            </Card>
          )}

          {/* Main Content - Adaptive width */}
          <div
            className={cn(
              'transition-all duration-500 ease-out',
              'animate-in fade-in-0 slide-in-from-bottom-4',
              showBHADesign ? 'w-[68%] flex-shrink-0' : 'w-full'
            )}
          >
            {activeSection === 'ipr' && <NodalAnalysisIprModule />}
            {activeSection === 'pvt' && <NodalAnalysisPvtModule />}
            {activeSection === 'hydraulics' && (
              <NodalAnalysisHydraulicsModule segments={mergedRows} />
            )}
            {activeSection === 'results' && <NodalAnalysisChartsModule />}
            {activeSection === 'correlations' && (
              <NodalAnalysisMultiCorrelationModule segments={mergedRows} />
            )}
            {activeSection === 'sensitivity' && (
              <NodalAnalysisSensitivityModule />
            )}
          </div>

          {/* Table section Sheet */}
          <Sheet open={isTableOpen} onOpenChange={setTableOpen}>
            <SheetTitle></SheetTitle>
            <SheetContent
              side="right"
              className={cn(
                'w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl',
                'p-0 overflow-hidden'
              )}
              style={{
                top: `${64}px`,
                height: `calc(100% - ${64}px)`,
              }}
            >
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
                    transform: isTableOpen
                      ? 'translateY(0)'
                      : 'translateY(8px)',
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
                      transform: isTableOpen
                        ? 'translateY(0)'
                        : 'translateY(4px)',
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
                          <Activity className="h-4 w-4 mr-2" />
                          BHA
                        </TabsTrigger>
                        <TabsTrigger
                          value={BhaCasingBuilderTab.CASING}
                          className="data-[state=active]:bg-system-blue/10 data-[state=active]:text-system-blue transition-all duration-200 ease-apple"
                        >
                          <Settings className="h-4 w-4 mr-2" />
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
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
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
