'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAnalysisStore } from '@/store/nodal-modules/nodal-analysis/use-nodal-analysis.store';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  AlertTriangle,
  Beaker,
  Loader2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  Droplets,
} from 'lucide-react';
import { InputField } from '@/components/custom/input-field/input-field.component';

// Placeholder components for complex subcomponents
const PVTForm: React.FC<{
  initialInputs: any;
  onSubmit: (inputs: any) => void;
  initialPb?: number;
}> = ({ initialInputs, onSubmit, initialPb }) => {
  const [formData, setFormData] = useState(initialInputs);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fields = [
    { name: 'api', label: 'API Gravity', unit: '°API' },
    { name: 'gas_gravity', label: 'Gas Gravity', unit: 'specific' },
    { name: 'temperature', label: 'Reservoir Temperature', unit: '°F' },
    { name: 'water_gravity', label: 'Water Gravity', unit: 'specific' },
    { name: 'stock_temp', label: 'Stock Tank Temperature', unit: '°F' },
    { name: 'stock_pressure', label: 'Stock Tank Pressure', unit: 'psia' },
  ];

  const validateField = (name: string, value: number) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'api':
        if (value <= 0 || value > 50) {
          newErrors[name] = 'API Gravity should be between 1-50';
        } else {
          delete newErrors[name];
        }
        break;
      case 'gas_gravity':
        if (value <= 0 || value > 2) {
          newErrors[name] = 'Gas gravity should be between 0.1-2.0';
        } else {
          delete newErrors[name];
        }
        break;
      case 'temperature':
        if (value <= 32 || value > 400) {
          newErrors[name] = 'Temperature should be between 32-400°F';
        } else {
          delete newErrors[name];
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleFieldChange = (name: string, value: number) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const isValid = Object.keys(errors).length === 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map(field => (
          <InputField
            key={field.name}
            name={field.name}
            label={field.label}
            unit={field.unit}
            value={formData[field.name] || 0}
            onChange={handleFieldChange}
            error={errors[field.name]}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className={cn(
            'px-8 py-2 bg-gradient-to-r from-system-blue to-system-blue/90',
            'hover:from-system-blue/90 hover:to-system-blue',
            'text-white font-medium',
            'shadow-lg hover:shadow-xl hover:shadow-system-blue/25',
            'transition-all duration-200 ease-apple',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Beaker className="h-4 w-4 mr-2" />
          Calculate PVT Properties
        </Button>
      </div>
    </div>
  );
};

const BubblePointDisplay: React.FC<{
  value: number | null;
  method: string;
}> = ({ value, method }) => (
  <div
    className={cn(
      'p-6 rounded-xl border border-border/30',
      'bg-gradient-to-br from-system-blue/5 via-system-blue/10 to-system-blue/5',
      'animate-in fade-in-0 slide-in-from-bottom-2 duration-500'
    )}
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-system-blue/10 rounded-lg">
        <Droplets className="h-5 w-5 text-system-blue" />
      </div>
      <Label className="text-sm font-medium text-muted-foreground">
        Bubble Point Pressure
      </Label>
    </div>

    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold text-system-blue">
        {value != null ? value.toFixed(1) : 'N/A'}
      </span>
      <span className="text-sm text-muted-foreground">psia</span>
    </div>

    <Badge variant="secondary" className="mt-2">
      Method: {method}
    </Badge>
  </div>
);

const CollapsiblePanel: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between p-4 h-auto">
          <span className="font-medium">{title}</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const CompactPVTResults: React.FC<{
  data: any;
  showDetails: boolean;
  onToggleDetails: () => void;
}> = ({ data, showDetails, onToggleDetails }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Oil Density</p>
        <p className="font-medium">
          {data?.results?.[0]?.oil_density?.toFixed(3) || 'N/A'} g/cc
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Gas Density</p>
        <p className="font-medium">
          {data?.results?.[0]?.gas_density?.toFixed(4) || 'N/A'} g/cc
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Oil Viscosity</p>
        <p className="font-medium">
          {data?.results?.[0]?.oil_viscosity?.toFixed(2) || 'N/A'} cp
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Gas Viscosity</p>
        <p className="font-medium">
          {data?.results?.[0]?.gas_viscosity?.toFixed(4) || 'N/A'} cp
        </p>
      </div>
    </div>

    <Button
      variant="outline"
      size="sm"
      onClick={onToggleDetails}
      className="w-full"
    >
      <BarChart3 className="h-4 w-4 mr-2" />
      {showDetails ? 'Hide Details' : 'Show Details'}
    </Button>

    {showDetails && (
      <div className="p-4 bg-muted/50 rounded-lg animate-in slide-in-from-top-2 duration-300">
        <p className="text-sm text-muted-foreground">
          Detailed PVT results would be displayed here...
        </p>
      </div>
    )}
  </div>
);

export const NodalAnalysisPvtModule: React.FC = () => {
  const {
    calculatePVTProperties: calculatePVT,
    pvtResults,
    loading,
    errors,
    iprInputs,
    computedGOR,
    fluidProperties: fluidProps,
  } = useAnalysisStore();

  const [formInputs, setFormInputs] = useState<Record<string, any> | null>(
    null
  );
  const [bubblePoints, setBubblePoints] = useState<Record<
    string,
    number
  > | null>(null);
  const [selectedBubblePointMethod, setSelectedBubblePointMethod] =
    useState<string>('standing');
  const [showDetails, setShowDetails] = useState(false);
  const [showPvtDetails, setShowPvtDetails] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (iprInputs) {
      setFormInputs({
        api: 35,
        gas_gravity: 0.7,
        temperature: 180,
        gor: computedGOR,
        water_gravity: 1.05,
        pb: iprInputs.pb ?? null,
        stock_temp: 60,
        stock_pressure: 14.7,
        co2_frac: 0,
        h2s_frac: 0,
        n2_frac: 0,
        correlations: {
          pb: 'standing',
          rs: 'standing',
          bo: 'standing',
          muod: 'beggs',
        },
      });
    }
  }, [iprInputs, computedGOR]);

  const handleCalculate = async (inputs: any) => {
    setLocalError(null);
    setLocalLoading(true);
    try {
      const enhanced = {
        ...inputs,
        pb: null,
        correlations: {
          pb: selectedBubblePointMethod,
          rs: 'standing',
          bo: 'standing',
          muod: 'beggs',
        },
      };
      await calculatePVT(enhanced);

      // Mock bubble points for demo
      setBubblePoints({
        standing: 2450,
        vazquez: 2425,
        glaso: 2470,
      });
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setLocalLoading(false);
    }
  };

  const getDisplayBubblePoint = () => {
    if (bubblePoints?.[selectedBubblePointMethod] != null)
      return bubblePoints[selectedBubblePointMethod];
    if (fluidProps?.bubble_point != null) return fluidProps.bubble_point;
    return iprInputs.pb ?? null;
  };

  const isLoading = loading.pvt || localLoading;
  const errorMsg = errors.pvt ?? localError;
  const displayBP = getDisplayBubblePoint();

  return (
    <div className="w-full mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
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
            <div className="p-2 bg-system-purple/10 rounded-xl">
              <Beaker className="h-6 w-6 text-system-purple" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-title-1 font-semibold text-foreground">
                PVT Analysis
              </CardTitle>
              <CardDescription className="text-subheadline text-muted-foreground leading-relaxed">
                Calculate fluid properties and bubble point pressure for
                accurate nodal analysis.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Loading State */}
          {isLoading ? (
            <div
              className={cn(
                'flex items-center justify-center p-8',
                'bg-gradient-to-r from-muted/20 via-muted/40 to-muted/20',
                'rounded-xl border border-border/30'
              )}
            >
              <Loader2 className="h-8 w-8 animate-spin text-system-blue mr-3" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Calculating PVT Properties
                </p>
                <p className="text-sm text-muted-foreground">
                  Processing fluid correlations and thermodynamic
                  calculations...
                </p>
              </div>
            </div>
          ) : (
            formInputs && (
              <PVTForm
                initialInputs={formInputs}
                onSubmit={handleCalculate}
                initialPb={pvtResults?.results?.[0]?.pb}
              />
            )
          )}

          {/* Error Alert */}
          {errorMsg && (
            <Alert
              className={cn(
                'border-system-red/50 bg-system-red/8 shadow-md shadow-system-red/10',
                'animate-in slide-in-from-left-2 duration-300',
                'dark:border-system-red/30 dark:bg-system-red/5 dark:shadow-lg'
              )}
            >
              <AlertTriangle className="h-4 w-4 text-system-red" />
              <AlertDescription className="text-system-red/90 font-medium">
                <span className="font-semibold">PVT Calculation Error:</span>{' '}
                {errorMsg}
              </AlertDescription>
            </Alert>
          )}

          {/* Results Section */}
          {pvtResults && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-headline font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-system-green" />
                  Analysis Results
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                  className="hover:bg-muted/50"
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>

              {/* Bubble Point Display */}
              <BubblePointDisplay
                value={displayBP}
                method={selectedBubblePointMethod}
              />

              {/* Detailed Results */}
              {showDetails && (
                <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                  <Separator />

                  <CollapsiblePanel title="PVT Properties">
                    <CompactPVTResults
                      data={pvtResults}
                      showDetails={showPvtDetails}
                      onToggleDetails={() => setShowPvtDetails(!showPvtDetails)}
                    />
                  </CollapsiblePanel>

                  {bubblePoints && (
                    <CollapsiblePanel title="Bubble Point Correlations">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(bubblePoints).map(([method, value]) => (
                          <div
                            key={method}
                            className={cn(
                              'p-4 rounded-lg border transition-all duration-200',
                              selectedBubblePointMethod === method
                                ? 'border-system-blue bg-system-blue/5'
                                : 'border-border/30 hover:border-border/60'
                            )}
                          >
                            <p className="font-medium capitalize">{method}</p>
                            <p className="text-xl font-bold text-system-blue">
                              {value.toFixed(1)} psia
                            </p>
                          </div>
                        ))}
                      </div>
                    </CollapsiblePanel>
                  )}
                </div>
              )}

              {/* Success Alert */}
              <Alert
                className={cn(
                  'border-system-green/50 bg-system-green/8 shadow-md shadow-system-green/10',
                  'animate-in slide-in-from-left-2 duration-300',
                  'dark:border-system-green/30 dark:bg-system-green/5 dark:shadow-lg'
                )}
              >
                <CheckCircle className="h-4 w-4 text-system-green" />
                <AlertDescription className="text-system-green/90 font-medium">
                  PVT analysis complete! Fluid properties calculated
                  successfully. You can now proceed to Wellbore Hydraulics
                  analysis.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
