'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  TrendingUp,
  AlertTriangle,
  Download,
  BarChart3,
  Settings,
  Play,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalysisStore } from '@/store/nodal-modules/nodal-analysis/use-nodal-analysis.store';
import { InputField } from '@/components/custom/input-field/input-field.component';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
});
import type { AnalysisPoint } from '@/core/nodal-modules/nodal-analysis/types/nodal-analysis.types';

interface SensitivityParameter {
  key: string;
  label: string;
  unit: string;
  defaultMin: number;
  defaultMax: number;
  defaultStep: number;
  description: string;
}

const SENSITIVITY_PARAMETERS: SensitivityParameter[] = [
  {
    key: 'injectionVolume',
    label: 'Gas Lift Injection Volume',
    unit: 'MCFD',
    defaultMin: 100,
    defaultMax: 2000,
    defaultStep: 100,
    description: 'Volume of gas injected for gas lift operations'
  },
  {
    key: 'injectionDepth',
    label: 'Gas Lift Injection Depth',
    unit: 'ft',
    defaultMin: 1000,
    defaultMax: 8000,
    defaultStep: 500,
    description: 'Depth at which gas is injected into the wellbore'
  },
  {
    key: 'injectedGasGravity',
    label: 'Injected Gas Gravity',
    unit: 'specific gravity',
    defaultMin: 0.5,
    defaultMax: 1.2,
    defaultStep: 0.05,
    description: 'Specific gravity of the injected gas'
  },
  {
    key: 'oil_rate',
    label: 'Oil Production Rate',
    unit: 'BOPD',
    defaultMin: 100,
    defaultMax: 1000,
    defaultStep: 50,
    description: 'Oil production rate for sensitivity analysis'
  },
  {
    key: 'water_rate',
    label: 'Water Production Rate',
    unit: 'BWPD',
    defaultMin: 500,
    defaultMax: 3000,
    defaultStep: 250,
    description: 'Water production rate for sensitivity analysis'
  },
  {
    key: 'reservoir_pressure',
    label: 'Reservoir Pressure',
    unit: 'psi',
    defaultMin: 2000,
    defaultMax: 5000,
    defaultStep: 250,
    description: 'Reservoir pressure for sensitivity analysis'
  }
];

interface SensitivityInputs {
  parameter: string;
  minValue: number;
  maxValue: number;
  steps: number;
}

interface NodalAnalysisSensitivityModuleProps {
  segments: any[];
}

export const NodalAnalysisSensitivityModule: React.FC<NodalAnalysisSensitivityModuleProps> = ({ segments }) => {
  const {
    sensitivityData,
    loading,
    errors,
    completeness,
    runSensitivityAnalysis,
    gasLiftEnabled,
    injectionVolume,
    injectionDepth,
    injectedGasGravity,
    setGasLiftEnabled,
    setGasLiftValue,
  } = useAnalysisStore();

  // Filter parameters based on gas lift configuration
  const availableParameters = SENSITIVITY_PARAMETERS.filter(param => {
    // Show gas lift parameters only if gas lift is enabled
    if (['injectionVolume', 'injectionDepth', 'injectedGasGravity'].includes(param.key)) {
      return gasLiftEnabled;
    }
    return true;
  });

  const [inputs, setInputs] = useState<SensitivityInputs>({
    parameter: gasLiftEnabled ? 'injectionVolume' : 'oil_rate',
    minValue: gasLiftEnabled ? 100 : 100,
    maxValue: gasLiftEnabled ? 2000 : 1000,
    steps: 20,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectedParameter = availableParameters.find(
    p => p.key === inputs.parameter
  );

  useEffect(() => {
    if (selectedParameter) {
      setInputs(prev => ({
        ...prev,
        minValue: selectedParameter.defaultMin,
        maxValue: selectedParameter.defaultMax,
        steps: Math.ceil(
          (selectedParameter.defaultMax - selectedParameter.defaultMin) /
            selectedParameter.defaultStep
        ),
      }));
    }
  }, [selectedParameter]);

  // Handle gas lift toggle - reset parameter if current one becomes unavailable
  useEffect(() => {
    const isCurrentParameterAvailable = availableParameters.some(
      param => param.key === inputs.parameter
    );
    
    if (!isCurrentParameterAvailable && availableParameters.length > 0) {
      const defaultParam = gasLiftEnabled ? 'injectionVolume' : 'oil_rate';
      const newParam = availableParameters.find(p => p.key === defaultParam) || availableParameters[0];
      
      setInputs(prev => ({
        ...prev,
        parameter: newParam.key,
        minValue: newParam.defaultMin,
        maxValue: newParam.defaultMax,
        steps: Math.ceil(
          (newParam.defaultMax - newParam.defaultMin) / newParam.defaultStep
        ),
      }));
    }
  }, [gasLiftEnabled, availableParameters, inputs.parameter]);

  const handleInputChange = (field: keyof SensitivityInputs, value: number | string) => {
    setInputs(prev => {
      const updated = { ...prev, [field]: value };
      
      return updated;
    });
  };

  const generateValues = (): number[] => {
    const values: number[] = [];
    const step = (inputs.maxValue - inputs.minValue) / (inputs.steps - 1);
    
    for (let i = 0; i < inputs.steps; i++) {
      values.push(inputs.minValue + i * step);
    }
    
    return values;
  };

  const handleRunAnalysis = async () => {
    if (!completeness.hydraulics) {
      return;
    }

    setIsRunning(true);
    setProgress(0);

    try {
      const values = generateValues();
      await runSensitivityAnalysis(inputs.parameter, values, segments);
    } catch (error) {
      console.error('Sensitivity analysis failed:', error);
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  const exportResults = () => {
    if (!sensitivityData) return;

    const csvData = [
      ['Parameter Value', 'Flow Rate (BOPD)', 'Pressure (psi)', 'Efficiency (%)'],
      ...sensitivityData.cases.map((caseItem: any) => [
        caseItem.value.toFixed(2),
        caseItem.operatingPoint?.rate?.toFixed(2) || 'N/A',
        caseItem.operatingPoint?.pressure?.toFixed(2) || 'N/A',
        caseItem.operatingPoint?.efficiency?.toFixed(1) || 'N/A'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensitivity_analysis_${inputs.parameter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canRunAnalysis = completeness.hydraulics && !isRunning;

  if (loading.sensitivity) {
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
                Running sensitivity analysis...
              </p>
              {progress > 0 && (
                <Progress value={progress} className="w-64" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (errors?.sensitivity) {
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
            <span className="font-semibold">Sensitivity Analysis Error:</span>{' '}
            {errors.sensitivity}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header Card */}
      <Card
        className={cn(
          'border-border/60 shadow-xl shadow-black/5',
          'bg-gradient-to-br from-background via-background to-muted/20',
          'backdrop-blur-xl',
          'dark:bg-gradient-to-br dark:from-background/95 dark:via-background/90 dark:to-muted/30',
          'dark:border-border/30 dark:shadow-lg'
        )}
      >
        <CardHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-system-purple/10 to-system-blue/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-system-purple" />
              </div>
              <div>
                <CardTitle className="text-title-1 font-semibold text-foreground">
                  Sensitivity Analysis
                </CardTitle>
                <CardDescription className="text-subheadline text-muted-foreground leading-relaxed">
                  Analyze the impact of parameter variations on gas lift performance and production rates
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {sensitivityData && (
                <Button
                  onClick={exportResults}
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 text-xs font-medium"
                >
                  <Download className="h-3 w-3 mr-1.5" />
                  Export CSV
                </Button>
              )}
              
              <Button
                onClick={handleRunAnalysis}
                disabled={!canRunAnalysis}
                className={cn(
                  'h-9 px-4 text-xs font-medium',
                  'bg-gradient-to-r from-system-purple to-system-purple/90',
                  'hover:from-system-purple/90 hover:to-system-purple',
                  'text-white shadow-lg hover:shadow-xl hover:shadow-system-purple/25',
                  'transition-all duration-200 ease-apple',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1.5" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>
          </div>

          {!completeness.hydraulics && (
            <Alert className="border-system-orange/50 bg-system-orange/8">
              <AlertTriangle className="h-4 w-4 text-system-orange" />
              <AlertDescription className="text-system-orange/90 font-medium">
                Complete the hydraulics analysis first to enable sensitivity analysis.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Parameter Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Parameter Selection</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Analysis Parameter
                  </label>
                  <Select
                    value={inputs.parameter}
                    onValueChange={(value) => handleInputChange('parameter', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select parameter" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableParameters.map((param) => (
                        <SelectItem key={param.key} value={param.key}>
                          <div className="flex flex-col">
                            <span className="font-medium">{param.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {param.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedParameter && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Unit:</span> {selectedParameter.unit}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedParameter.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Range Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Range Configuration</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  name="minValue"
                  label="Minimum Value"
                  value={inputs.minValue}
                  unit={selectedParameter?.unit}
                  onChange={(_, value) => handleInputChange('minValue', value)}
                />
                
                <InputField
                  name="maxValue"
                  label="Maximum Value"
                  value={inputs.maxValue}
                  unit={selectedParameter?.unit}
                  onChange={(_, value) => handleInputChange('maxValue', value)}
                />
                
                <InputField
                  name="steps"
                  label="Number of Steps"
                  value={inputs.steps}
                  onChange={(_, value) => handleInputChange('steps', value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Results Section */}
          {sensitivityData && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Analysis Results</h3>
                <Badge variant="secondary" className="text-xs">
                  {sensitivityData.cases?.length || 0} cases
                </Badge>
              </div>

              {/* Chart */}
              <Card className="p-4">
                <Plot
                  data={[
                    {
                      x: sensitivityData.cases?.map((c: any) => c.value) || [],
                      y: sensitivityData.cases?.map((c: any) => c.operatingPoint?.rate || 0) || [],
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Flow Rate',
                      line: { color: '#3b82f6', width: 3 },
                      marker: { size: 8, color: '#3b82f6' },
                    },
                  ]}
                  layout={{
                    title: {
                      text: `Sensitivity Analysis: ${selectedParameter?.label || inputs.parameter}`,
                      font: { size: 16, family: 'Inter, sans-serif' },
                    },
                    xaxis: {
                      title: {
                        text: `${selectedParameter?.label || inputs.parameter} (${selectedParameter?.unit || ''})`
                      },
                      gridcolor: '#f1f5f9',
                    },
                    yaxis: {
                      title: {
                        text: 'Flow Rate (BOPD)'
                      },
                      gridcolor: '#f1f5f9',
                    },
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    font: { family: 'Inter, sans-serif' },
                    margin: { t: 50, r: 50, b: 50, l: 50 },
                  }}
                  config={{
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
                  }}
                  style={{ width: '100%', height: '400px' }}
                />
              </Card>

              {/* Results Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Detailed Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-medium">
                            {selectedParameter?.label || 'Parameter'}
                          </TableHead>
                          <TableHead className="text-xs font-medium">Flow Rate (BOPD)</TableHead>
                          <TableHead className="text-xs font-medium">Pressure (psi)</TableHead>
                          <TableHead className="text-xs font-medium">Efficiency (%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sensitivityData.cases?.map((caseItem: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="text-xs font-medium">
                              {caseItem.value.toFixed(2)} {selectedParameter?.unit}
                            </TableCell>
                            <TableCell className="text-xs">
                              {caseItem.operatingPoint?.rate?.toFixed(2) || 'N/A'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {caseItem.operatingPoint?.pressure?.toFixed(2) || 'N/A'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {caseItem.operatingPoint && sensitivityData.baseCase.operatingPoint
                                ? ((caseItem.operatingPoint.rate / sensitivityData.baseCase.operatingPoint.rate) * 100).toFixed(1)
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};