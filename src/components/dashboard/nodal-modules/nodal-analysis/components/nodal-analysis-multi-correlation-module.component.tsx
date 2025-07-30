'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart3, 
  Play, 
  AlertTriangle, 
  Info, 
  Loader2,
  TrendingUp,
  Settings,
  FileSearch,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Plot from 'react-plotly.js';
import { useAnalysisStore } from '@/store/nodal-modules/nodal-analysis/use-nodal-analysis.store';
import { useSurveyDataStore } from '@/store/nodal-modules/use-survey-data.store';
import type { Segments } from '@/core/nodal-modules/nodal-analysis/util/merge-bha-and-casing-rows.util';
import { SurveyDataUploader } from './survey-data-uploader.component';

interface MultiCorrelationModuleProps {
  segments: Segments[];
}

export const NodalAnalysisMultiCorrelationModule: React.FC<MultiCorrelationModuleProps> = ({ segments }) => {
  const [surveyDataValid, setSurveyDataValid] = useState(false);
  const [activeCorrelations, setActiveCorrelations] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);

  // Analysis store
  const {
    iprCurve,
    fluidProperties: fluidProps,
    iprInputs,
    completeness,
    availableCorrelations,
    runCorrelationAnalysis,
    multiVlpCurves,
    multiOperatingPoints,
    loading,
    errors,
  } = useAnalysisStore();

  // Survey data store
  const clearSurveyData = useSurveyDataStore((s) => s.clearSurveyData);

  const isLoading = loading.sensitivity;
  const error = errors.sensitivity;

  useEffect(() => {
    if (availableCorrelations.length && activeCorrelations.length === 0) {
      setActiveCorrelations(availableCorrelations.slice(0, 4).map((c) => c.id));
    }
  }, [availableCorrelations, activeCorrelations]);

  const handleRun = async () => {
    if (!completeness.pvt || !iprCurve.length || !fluidProps) return;
    setProgress(0);
    await runCorrelationAnalysis(activeCorrelations, segments, (progress) => {
      setProgress(progress);
    });
  };

  const handleCorrelationToggle = (corrId: string) => {
    setActiveCorrelations((ac) => {
      const newCorrelations = ac.includes(corrId)
        ? ac.filter((id) => id !== corrId)
        : [...ac, corrId];

      if (corrId === "beggs-brill" && ac.includes(corrId)) {
        clearSurveyData();
        setSurveyDataValid(false);
      }

      return newCorrelations;
    });
  };

  const isBeggsbrillSelected = activeCorrelations.includes("beggs-brill");
  const canRunAnalysis = activeCorrelations.length > 0 && (!isBeggsbrillSelected || surveyDataValid);

  // Prepare chart data
  const iprTrace = {
    x: iprCurve.map((p) => p.rate),
    y: iprCurve.map((p) => p.pressure),
    mode: 'lines' as const,
    name: 'IPR Curve',
    line: { dash: 'dash', width: 4, color: '#6B7280' }, // gray for reference
  };

  const vlpTraces = activeCorrelations
    .filter((id) => multiVlpCurves[id]?.length > 0)
    .map((id, index) => {
      const pts = multiVlpCurves[id];
      const colors = ['#007AFF', '#FF3B30', '#34C759', '#FF9500', '#AF52DE', '#00C7BE'];
      return {
        x: pts.map((p) => p.rate),
        y: pts.map((p) => p.pressure),
        mode: 'lines+markers' as const,
        name: availableCorrelations.find((c) => c.id === id)?.name || id,
        line: { width: 3, color: colors[index % colors.length] },
        marker: { size: 6, color: colors[index % colors.length] },
      };
    });

  const opPoints = Object.entries(multiOperatingPoints)
    .filter(([id, pt]) => activeCorrelations.includes(id))
    .map(([id, pt]) => ({
      correlation: id,
      rate: pt.rate,
      pressure: pt.pressure,
    }));

  const opPointTrace = {
    x: opPoints.map((p) => p.rate),
    y: opPoints.map((p) => p.pressure),
    mode: 'markers' as const,
    name: 'Operating Points',
    marker: { size: 12, symbol: 'diamond', color: '#34C759', line: { color: '#ffffff', width: 2 } },
  };

  // Prerequisites check
  if (!completeness.pvt || !completeness.ipr) {
    return (
      <div className="w-full mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <Alert className={cn(
          'border-system-orange/50 bg-system-orange/8 shadow-md shadow-system-orange/10',
          'animate-in slide-in-from-left-2 duration-300',
          'dark:border-system-orange/30 dark:bg-system-orange/5 dark:shadow-lg'
        )}>
          <AlertTriangle className="h-4 w-4 text-system-orange" />
          <AlertDescription className="text-system-orange/90 font-medium">
            <div className="font-semibold mb-2">Prerequisites Required</div>
            <div className="text-sm">
              Please complete PVT and IPR sections before running multi-correlation analysis.
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <Card className={cn(
        'border-border/60 shadow-xl shadow-black/5',
        'bg-gradient-to-br from-background via-background to-muted/20',
        'backdrop-blur-xl',
        'dark:bg-gradient-to-br dark:from-background/95 dark:via-background/90 dark:to-muted/30',
        'dark:border-border/30 dark:shadow-lg'
      )}>
        <CardHeader className="space-y-4 pb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-system-purple/10 to-system-blue/10 rounded-xl">
              <BarChart3 className="h-6 w-6 text-system-purple" />
            </div>
            <div>
              <CardTitle className="text-title-1 font-semibold text-foreground">
                Multi-Correlation Analysis
              </CardTitle>
              <CardDescription className="text-subheadline text-muted-foreground leading-relaxed">
                Compare multiple VLP curve correlations against your IPR curve to evaluate operating point variations
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Correlation Selection */}
          <Card className="border-border/50 shadow-lg shadow-black/5 bg-background/80 dark:bg-background/50 dark:border-border/30 dark:shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-system-blue/10 rounded-lg">
                  <Settings className="h-4 w-4 text-system-blue" />
                </div>
                <CardTitle className="text-headline font-semibold">
                  Select Correlation Methods
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Correlation Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCorrelations.map((corr) => (
                  <div key={corr.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 hover:shadow-sm transition-all duration-200 border border-transparent hover:border-border/30">
                    <Checkbox
                      id={corr.id}
                      checked={activeCorrelations.includes(corr.id)}
                      onCheckedChange={() => handleCorrelationToggle(corr.id)}
                      className="mt-0.5"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={corr.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {corr.name}
                      </Label>
                      {corr.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {corr.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Action Button and Progress */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleRun}
                    disabled={isLoading || !canRunAnalysis}
                    className={cn(
                      'min-w-[200px] h-12 px-6',
                      'bg-system-blue/10 hover:bg-system-blue/15',
                      'border border-system-blue/20 hover:border-system-blue/30',
                      'text-system-blue hover:text-system-blue/90',
                      'font-medium',
                      'transition-all duration-200 ease-apple',
                      'shadow-sm hover:shadow-md',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'dark:bg-system-blue/15 dark:hover:bg-system-blue/20',
                      'dark:border-system-blue/30 dark:hover:border-system-blue/40',
                      'dark:text-system-blue dark:hover:text-system-blue/90'
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {progress === 0 ? 'Starting...' : `Processing... ${progress}%`}
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Correlation Analysis
                      </>
                    )}
                  </Button>
                  
                  {activeCorrelations.length > 0 && (
                    <Badge variant="secondary" className="px-3 py-1 text-sm">
                      {activeCorrelations.length} method{activeCorrelations.length !== 1 ? 's' : ''} selected
                    </Badge>
                  )}
                </div>

                {/* Progress Bar */}
                {isLoading && (
                  <div className="space-y-2">
                    <Progress 
                      value={progress} 
                      className="h-3 bg-muted/30 rounded-full overflow-hidden"
                    />
                    <p className="text-footnote text-muted-foreground">
                      Processing {activeCorrelations.length} correlations... {progress}% complete
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Survey Data Section */}
          {isBeggsbrillSelected && (
            <Card className="border-system-orange/50 shadow-lg shadow-system-orange/10 bg-system-orange/8 dark:border-system-orange/30 dark:bg-system-orange/5 dark:shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-system-orange/10 rounded-lg">
                    <FileSearch className="h-4 w-4 text-system-orange" />
                  </div>
                  <CardTitle className="text-headline font-semibold text-system-orange">
                    Survey Data Required for Beggs-Brill
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-body text-muted-foreground mb-4 leading-relaxed">
                  Beggs-Brill correlation requires directional survey data for inclination calculations.
                </p>
                <SurveyDataUploader
                  onDataChange={(isValid) => {
                    setSurveyDataValid(isValid);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Validation Alert */}
          {!canRunAnalysis && activeCorrelations.length > 0 && (
            <Alert className={cn(
              'border-system-orange/50 bg-system-orange/8 shadow-md shadow-system-orange/10',
              'animate-in slide-in-from-left-2 duration-300',
              'dark:border-system-orange/30 dark:bg-system-orange/5 dark:shadow-lg'
            )}>
              <AlertTriangle className="h-4 w-4 text-system-orange" />
              <AlertDescription className="text-system-orange/90 font-medium">
                {isBeggsbrillSelected && !surveyDataValid
                  ? "Please upload survey data to use Beggs-Brill correlation."
                  : "Please select at least one correlation method."}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className={cn(
              'border-system-red/50 bg-system-red/8 shadow-md shadow-system-red/10',
              'animate-in slide-in-from-left-2 duration-300',
              'dark:border-system-red/30 dark:bg-system-red/5 dark:shadow-lg'
            )}>
              <AlertTriangle className="h-4 w-4 text-system-red" />
              <AlertDescription className="text-system-red/90 font-medium">
                <span className="font-semibold">Analysis Error:</span> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Chart Section */}
          {Object.keys(multiVlpCurves).length > 0 && (
            <Card className="border-border/50 shadow-lg shadow-black/5 bg-background/80 dark:bg-background/50 dark:border-border/30 dark:shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-system-green/10 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-system-green" />
                  </div>
                  <CardTitle className="text-headline font-semibold">
                    IPR vs. VLP Correlation Comparison
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[500px] rounded-lg overflow-hidden bg-background/30">
                  <Plot
                    data={[iprTrace, ...vlpTraces, opPointTrace]}
                    layout={{
                      autosize: true,
                      xaxis: { 
                        title: { 
                          text: 'Flow Rate (BOPD)',
                          font: { 
                            size: 14, 
                            color: 'var(--foreground)',
                            family: 'SF Pro Display, -apple-system, system-ui, sans-serif'
                          }
                        },
                        gridcolor: 'var(--border)',
                        tickfont: { color: 'var(--muted-foreground)', size: 12 }
                      },
                      yaxis: { 
                        title: { 
                          text: 'Pressure (psia)',
                          font: { 
                            size: 14, 
                            color: 'var(--foreground)',
                            family: 'SF Pro Display, -apple-system, system-ui, sans-serif'
                          }
                        },
                        gridcolor: 'var(--border)',
                        tickfont: { color: 'var(--muted-foreground)', size: 12 }
                      },
                      title: { text: '' },
                      plot_bgcolor: 'transparent',
                      paper_bgcolor: 'transparent',
                      margin: { l: 80, r: 50, t: 30, b: 80 },
                      legend: {
                        x: 0.02,
                        y: 0.98,
                        bgcolor: 'var(--background)',
                        bordercolor: 'var(--border)',
                        borderwidth: 1,
                        font: { color: 'var(--foreground)', size: 12 }
                      },
                      hovermode: 'closest',
                    }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                    config={{
                      responsive: true,
                      displayModeBar: false,
                      scrollZoom: false
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operating Points Table */}
          {opPoints.length > 0 && (
            <Card className="border-border/50 shadow-lg shadow-black/5 bg-background/80 dark:bg-background/50 dark:border-border/30 dark:shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-system-green/10 rounded-lg">
                    <Target className="h-4 w-4 text-system-green" />
                  </div>
                  <CardTitle className="text-headline font-semibold">
                    Operating Points Comparison
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/50 shadow-sm overflow-hidden dark:border-border/30">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold text-foreground">Method</TableHead>
                        <TableHead className="font-semibold text-foreground">Rate (BOPD)</TableHead>
                        <TableHead className="font-semibold text-foreground">Pressure (psia)</TableHead>
                        <TableHead className="font-semibold text-foreground">% of Test Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {opPoints.map((pt, i) => {
                        const name = availableCorrelations.find((c) => c.id === pt.correlation)?.name ?? pt.correlation;
                        const pct = iprInputs?.BOPD ? (pt.rate / iprInputs.BOPD) * 100 : 0;
                        return (
                          <TableRow key={i} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="font-medium">{name}</TableCell>
                            <TableCell>{pt.rate.toFixed(0)}</TableCell>
                            <TableCell>{pt.pressure.toFixed(0)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  pct >= 90 ? 'bg-system-green/10 text-system-green' : 
                                  pct >= 70 ? 'bg-system-orange/10 text-system-orange' :
                                  'bg-system-red/10 text-system-red'
                                )}
                              >
                                {pct.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Summary */}
          {opPoints.length > 0 && (
            <Card className={cn(
              'border-system-blue/50 shadow-xl shadow-system-blue/10',
              'bg-gradient-to-br from-system-blue/8 via-background/90 to-system-blue/12',
              'backdrop-blur-sm',
              'dark:border-system-blue/30 dark:shadow-lg dark:from-system-blue/5 dark:to-system-blue/10'
            )}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-system-blue/10 rounded-lg">
                    <Info className="h-4 w-4 text-system-blue" />
                  </div>
                  <CardTitle className="text-headline font-semibold text-system-blue">
                    Analysis Summary
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 rounded-lg bg-background/80 border border-border/30 shadow-sm dark:bg-background/50">
                    <p className="text-footnote text-muted-foreground mb-1">Flow Rate Range</p>
                    <p className="text-title-3 font-semibold text-foreground">
                      {Math.min(...opPoints.map((p) => p.rate)).toFixed(0)} - {Math.max(...opPoints.map((p) => p.rate)).toFixed(0)} BOPD
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-background/80 border border-border/30 shadow-sm dark:bg-background/50">
                    <p className="text-footnote text-muted-foreground mb-1">Rate Spread</p>
                    <p className="text-title-3 font-semibold text-foreground">
                      {(Math.max(...opPoints.map((p) => p.rate)) - Math.min(...opPoints.map((p) => p.rate))).toFixed(0)} BOPD
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-background/80 border border-border/30 shadow-sm dark:bg-background/50">
                    <p className="text-footnote text-muted-foreground mb-1">Variation</p>
                    <p className="text-title-3 font-semibold text-foreground">
                      {(((Math.max(...opPoints.map((p) => p.rate)) - Math.min(...opPoints.map((p) => p.rate))) / (iprInputs?.BOPD || 1)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="prose prose-sm max-w-none">
                  <p className="text-body text-muted-foreground leading-relaxed mb-4">
                    Flow rates vary from{" "}
                    <span className="font-semibold text-foreground">{Math.min(...opPoints.map((p) => p.rate)).toFixed(0)} BOPD</span>{" "}
                    to{" "}
                    <span className="font-semibold text-foreground">{Math.max(...opPoints.map((p) => p.rate)).toFixed(0)} BOPD</span>,
                    representing a spread of{" "}
                    <span className="font-semibold text-foreground">
                      {(Math.max(...opPoints.map((p) => p.rate)) - Math.min(...opPoints.map((p) => p.rate))).toFixed(0)} BOPD
                    </span>{" "}
                    ({(((Math.max(...opPoints.map((p) => p.rate)) - Math.min(...opPoints.map((p) => p.rate))) / (iprInputs?.BOPD || 1)) * 100).toFixed(1)}% variation).
                  </p>
                  
                  {iprInputs?.MCFD && iprInputs?.BOPD && (
                    <p className="text-body text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Recommendation:</span>{" "}
                      {(iprInputs.MCFD * 1000) / iprInputs.BOPD > 1000
                        ? "High GOR wells typically perform best with Gray correlation for accurate pressure drop predictions."
                        : "Low GOR wells typically perform best with Hagedorn-Brown correlation for reliable flow predictions."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 