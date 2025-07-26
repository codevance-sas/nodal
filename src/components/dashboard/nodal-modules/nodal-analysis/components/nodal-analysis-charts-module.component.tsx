'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BarChart3, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalysisStore } from '@/store/nodal-modules/nodal-analysis/use-nodal-analysis.store';
import { NodalAnalysisPlot } from './nodal-analysis-plot.component';
import { NodalAnalysisSummary } from './nodal-analysis-summary.component';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const NodalAnalysisChartsModule: React.FC = () => {
  const {
    iprCurve,
    vlpCurve,
    operatingPoint,
    iprInputs,
    pvtInputs,
    hydraulicsResult,
    completeness,
    loading,
    errors,
  } = useAnalysisStore();

  if (loading.hydraulics) {
    return (
      <div className="w-full max-w-7xl mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <Card
          className={cn(
            'border-border/60 shadow-xl shadow-black/5',
            'bg-gradient-to-br from-background via-background to-muted/20',
            'backdrop-blur-xl',
            'dark:bg-gradient-to-br dark:from-background/95 dark:via-background/90 dark:to-muted/30',
            'dark:border-border/30 dark:shadow-lg'
          )}
        >
          <CardContent className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-system-blue" />
              <p className="text-body text-muted-foreground">
                Loading charts and analysis...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (errors?.hydraulics) {
    return (
      <div className="w-full max-w-7xl mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <Alert
          className={cn(
            'border-system-red/50 bg-system-red/8 shadow-md shadow-system-red/10',
            'animate-in slide-in-from-left-2 duration-300',
            'dark:border-system-red/30 dark:bg-system-red/5 dark:shadow-lg'
          )}
        >
          <AlertTriangle className="h-4 w-4 text-system-red" />
          <AlertDescription className="text-system-red/90 font-medium">
            <span className="font-semibold">Analysis Error:</span>{' '}
            {errors.hydraulics}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <Card
        className={cn(
          'border-border/60 shadow-xl shadow-black/5',
          'bg-gradient-to-br from-background via-background to-muted/20',
          'backdrop-blur-xl',
          'dark:bg-gradient-to-br dark:from-background/95 dark:via-background/90 dark:to-muted/30',
          'dark:border-border/30 dark:shadow-lg'
        )}
      >
        <CardHeader className="space-y-4 pb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-system-blue/10 to-system-purple/10 rounded-xl">
              <BarChart3 className="h-6 w-6 text-system-blue" />
            </div>
            <div>
              <CardTitle className="text-title-1 font-semibold text-foreground">
                Nodal Analysis Results
              </CardTitle>
              <CardDescription className="text-subheadline text-muted-foreground leading-relaxed">
                Interactive charts and comprehensive analysis of IPR/VLP
                intersection and operating point
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {operatingPoint && iprCurve.length > 0 && vlpCurve.length > 0 ? (
            <>
              {/* Main Plot */}
              <div className="space-y-6">
                <NodalAnalysisPlot
                  iprData={iprCurve}
                  vlpData={vlpCurve}
                  operatingPoint={operatingPoint}
                />
              </div>

              {/* Summary Section */}
              <div className="space-y-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="summary" className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                          <BarChart3 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-base">
                            Analysis Summary
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Review key results and operating parameters
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-6 pt-2">
                        <NodalAnalysisSummary
                          iprInputs={iprInputs}
                          pvtInputs={pvtInputs}
                          hydraulicsResults={hydraulicsResult}
                          operatingPoint={operatingPoint}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Warning Alert */}
              <Alert
                className={cn(
                  'border-system-orange/50 bg-system-orange/8 shadow-md shadow-system-orange/10',
                  'animate-in slide-in-from-left-2 duration-300',
                  'dark:border-system-orange/30 dark:bg-system-orange/5 dark:shadow-lg'
                )}
              >
                <Info className="h-4 w-4 text-system-orange" />
                <AlertDescription className="text-system-orange/90 font-medium space-y-2">
                  <div className="font-semibold">
                    Complete all previous sections to generate nodal analysis
                    results
                  </div>
                  {!completeness.hydraulics && (
                    <div className="text-sm">
                      Please calculate wellbore hydraulics to view the nodal
                      analysis charts and operating point.
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {/* Progress Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className={cn(
                    'transition-all duration-200',
                    completeness.ipr
                      ? 'border-system-green/30 bg-system-green/5'
                      : 'border-border/30'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-3 w-3 rounded-full',
                          completeness.ipr
                            ? 'bg-system-green'
                            : 'bg-muted-foreground/30'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm font-medium',
                          completeness.ipr
                            ? 'text-system-green'
                            : 'text-muted-foreground'
                        )}
                      >
                        IPR Analysis
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    'transition-all duration-200',
                    completeness.pvt
                      ? 'border-system-green/30 bg-system-green/5'
                      : 'border-border/30'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-3 w-3 rounded-full',
                          completeness.pvt
                            ? 'bg-system-green'
                            : 'bg-muted-foreground/30'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm font-medium',
                          completeness.pvt
                            ? 'text-system-green'
                            : 'text-muted-foreground'
                        )}
                      >
                        PVT Analysis
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    'transition-all duration-200',
                    completeness.hydraulics
                      ? 'border-system-green/30 bg-system-green/5'
                      : 'border-border/30'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-3 w-3 rounded-full',
                          completeness.hydraulics
                            ? 'bg-system-green'
                            : 'bg-muted-foreground/30'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm font-medium',
                          completeness.hydraulics
                            ? 'text-system-green'
                            : 'text-muted-foreground'
                        )}
                      >
                        Hydraulics Analysis
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
