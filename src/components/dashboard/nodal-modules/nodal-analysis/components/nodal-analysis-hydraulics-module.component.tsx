'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAnalysisStore } from '@/store/nodal-modules/nodal-analysis/use-nodal-analysis.store';
import { useSurveyDataStore } from '@/store/nodal-modules/use-survey-data.store';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  AlertTriangle,
  Settings,
  Loader2,
  Zap,
  Gauge,
  Activity,
  FlaskConical,
} from 'lucide-react';
import { CorrelationSelector } from './correlation-selector.component';
import type { Segments } from '@/core/nodal-modules/nodal-analysis/util/merge-bha-and-casing-rows.util';
import { SurveyDataUploader } from './survey-data-uploader.component';

interface InputFieldProps {
  name: string;
  label: string;
  value: number;
  unit?: string;
  onChange: (name: string, value: number) => void;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  value,
  unit,
  onChange,
  error,
  disabled = false,
  readOnly = false,
}) => {
  const [focused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const num = parseFloat(newValue);
    onChange(name, isNaN(num) ? 0 : num);
  };

  const hasValue = value > 0;
  const shouldShowFloatingLabel = focused || hasValue || inputValue !== '';

  return (
    <div className="space-y-2">
      <div className="relative group">
        <Label
          htmlFor={name}
          className={cn(
            'absolute left-3 transition-all duration-300 ease-apple pointer-events-none',
            'text-muted-foreground font-medium',
            shouldShowFloatingLabel
              ? 'top-2 text-xs text-system-blue dark:text-system-blue scale-90 origin-left'
              : 'top-1/2 -translate-y-1/2 text-sm'
          )}
        >
          {label}
          {unit && shouldShowFloatingLabel && (
            <span className="text-muted-foreground/70 ml-1">({unit})</span>
          )}
        </Label>

        <Input
          id={name}
          name={name}
          type="number"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            'h-12 pt-6 pb-2 px-3 transition-all duration-300 ease-apple',
            'bg-background border border-border/60 shadow-sm',
            'hover:border-border/80 hover:bg-muted/30 hover:shadow-md hover:shadow-black/5',
            'focus:border-system-blue focus:bg-background focus:shadow-lg focus:shadow-system-blue/10',
            'focus:ring-2 focus:ring-system-blue/30',
            'placeholder:text-transparent',
            error &&
              'border-system-red focus:border-system-red focus:ring-system-red/30',
            hasValue && !error && 'border-system-green/60 bg-system-green/5',
            (disabled || readOnly) &&
              'opacity-60 cursor-not-allowed bg-muted/30',
            'dark:bg-background/80 dark:backdrop-blur-sm dark:border-border/40',
            'dark:hover:border-border/60 dark:hover:bg-background/90',
            'dark:focus:border-system-blue dark:focus:bg-background dark:focus:ring-system-blue/20'
          )}
          placeholder={label}
        />

        {unit && !shouldShowFloatingLabel && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">
            {unit}
          </span>
        )}

        {hasValue && !error && !disabled && (
          <div className="absolute right-3 top-2">
            <CheckCircle className="h-3 w-3 text-system-green" />
          </div>
        )}

        {error && (
          <div className="absolute right-3 top-2">
            <AlertTriangle className="h-3 w-3 text-system-red" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-system-red font-medium animate-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
};

interface HydraulicsModuleProps {
  segments: Segments[];
}

export const NodalAnalysisHydraulicsModule: React.FC<HydraulicsModuleProps> = ({
  segments,
}) => {
  const [surveyDataValid, setSurveyDataValid] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    hydraulicsInputs: formData,
    setHydraulicsInputs: setFormData,
    fluidProperties: fluidProps,
    iprInputs,
    correlationMethod,
    setCorrelationMethod,
    availableCorrelations,
    setAvailableCorrelations,
    calculateHydraulicsCurve,
    recommendBestCorrelation,
    loading,
    errors: storeErrors,
    completeness,
    setInclination,
    setRoughness,
  } = useAnalysisStore();

  const { clearSurveyData } = useSurveyDataStore();

  // Set default correlations
  useEffect(() => {
    setAvailableCorrelations([
      {
        id: 'hagedorn-brown',
        name: 'Hagedorn-Brown',
        description:
          'Vertical multiphase flow correlation for oil and gas wells',
        best_for: 'Vertical wells with moderate gas-liquid ratios',
      },
      {
        id: 'beggs-brill',
        name: 'Beggs-Brill',
        description:
          'Inclined multiphase flow correlation for all inclination angles',
        best_for: 'Deviated wells and horizontal flow sections',
      },
      {
        id: 'duns-ross',
        name: 'Duns-Ross',
        description:
          'Vertical flow correlation based on flow pattern transitions',
        best_for: 'Vertical wells with high gas-liquid ratios',
      },
      {
        id: 'chokshi',
        name: 'Chokshi',
        description: 'Modern mechanistic model for multiphase flow in wells',
        best_for: 'Complex flow regimes with transitional patterns',
      },
      {
        id: 'orkiszewski',
        name: 'Orkiszewski',
        description: 'Specialized correlation for large diameter tubing wells',
        best_for: 'Large diameter vertical wells',
      },
    ]);
  }, [setAvailableCorrelations]);

  // Update form data when fluid properties or IPR inputs change
  useEffect(() => {
    let changed = false;
    const next = { ...formData };

    if (fluidProps) {
      [
        'oil_rate',
        'water_rate',
        'gas_rate',
        'oil_gravity',
        'gas_gravity',
        'water_gravity',
        'bubble_point',
        'temperature',
        'temperature_gradient',
      ].forEach(key => {
        const v = (fluidProps as any)[key];
        if (v != null && next[key as keyof typeof formData] !== v) {
          next[key as keyof typeof formData] = v;
          changed = true;
        }
      });
    }

    if (iprInputs) {
      if (iprInputs.Pr != null && next.reservoir_pressure !== iprInputs.Pr) {
        next.reservoir_pressure = iprInputs.Pr;
        changed = true;
      }
      if (
        iprInputs.PIP != null &&
        next.pump_intake_pressure !== iprInputs.PIP
      ) {
        next.pump_intake_pressure = iprInputs.PIP;
        changed = true;
      }
    }

    if (changed) setFormData(next);
  }, [fluidProps, iprInputs, formData, setFormData]);

  const validateField = (name: string, value: number) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'inclination':
        if (value < 0 || value > 90) {
          newErrors[name] = 'Inclination must be between 0-90°';
        } else {
          delete newErrors[name];
        }
        break;
      case 'reservoir_pressure':
        if (value <= 0) {
          newErrors[name] = 'Reservoir pressure must be greater than 0';
        } else if (value > 10000) {
          newErrors[name] = 'Reservoir pressure seems too high';
        } else {
          delete newErrors[name];
        }
        break;
      case 'pump_intake_pressure':
        if (value < 0) {
          newErrors[name] = 'Pump intake pressure cannot be negative';
        } else if (
          value >= formData.reservoir_pressure &&
          formData.reservoir_pressure > 0
        ) {
          newErrors[name] = 'PIP should be less than reservoir pressure';
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
      case 'roughness':
        if (value <= 0 || value > 0.01) {
          newErrors[name] = 'Roughness should be between 0-0.01 inches';
        } else {
          delete newErrors[name];
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (name: string, value: number) => {
    if (name === 'inclination') {
      setInclination(value);
    } else if (name === 'roughness') {
      setRoughness(value);
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await calculateHydraulicsCurve(formData, segments);
  };

  const handleCorrelationChange = (correlation: string) => {
    setCorrelationMethod(correlation);

    if (correlation !== 'beggs-brill') {
      clearSurveyData();
      setSurveyDataValid(false);
    }
  };

  const handleRecommend = async () => {
    try {
      const rec = await recommendBestCorrelation(formData);
      handleCorrelationChange(rec);
      // TODO: Show toast notification instead of alert
      alert(`Recommended method: ${rec}`);
    } catch (error) {
      console.error('Error getting recommendation:', error);
    }
  };

  const isBeggsbrillSelected = correlationMethod === 'beggs-brill';
  const canCalculate = !isBeggsbrillSelected || surveyDataValid;
  const hasErrors = Object.keys(errors).length > 0;

  const { gasOilRatio, waterOilRatio, totalLiquid, productivityIndex } =
    useMemo(() => {
      const or = formData.oil_rate || 0;
      const gr = or > 0 ? (formData.gas_rate * 1000) / or : 0;
      const wr = or > 0 ? formData.water_rate / or : 0;
      const tl = or + formData.water_rate;
      const pi =
        formData.reservoir_pressure - formData.pump_intake_pressure > 0
          ? or / (formData.reservoir_pressure - formData.pump_intake_pressure)
          : 0;

      return {
        gasOilRatio: gr,
        waterOilRatio: wr,
        totalLiquid: tl,
        productivityIndex: pi,
      };
    }, [
      formData.oil_rate,
      formData.gas_rate,
      formData.water_rate,
      formData.reservoir_pressure,
      formData.pump_intake_pressure,
    ]);

  const fluidFields = [
    { name: 'oil_rate', label: 'Oil Rate', unit: 'BOPD', readOnly: true },
    { name: 'water_rate', label: 'Water Rate', unit: 'BWPD', readOnly: true },
    { name: 'gas_rate', label: 'Gas Rate', unit: 'MCFD', readOnly: true },
  ];

  const wellboreFields = [
    { name: 'inclination', label: 'Inclination', unit: '°' },
    { name: 'reservoir_pressure', label: 'Reservoir Pressure', unit: 'psia' },
    {
      name: 'pump_intake_pressure',
      label: 'Pump Intake Pressure',
      unit: 'psia',
    },
    { name: 'temperature', label: 'Temperature', unit: '°F' },
    { name: 'temperature_gradient', label: 'Temp. Gradient', unit: '°F/ft' },
    { name: 'wellhead_pressure', label: 'Wellhead Pressure', unit: 'psia' },
    {
      name: 'bubble_point',
      label: 'Bubble Point',
      unit: 'psia',
      readOnly: true,
    },
    { name: 'roughness', label: 'Pipe Roughness', unit: 'in' },
  ];

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
            <div className="p-2 bg-system-orange/10 rounded-xl">
              <Settings className="h-6 w-6 text-system-orange" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-title-1 font-semibold text-foreground">
                Wellbore Hydraulics
              </CardTitle>
              <CardDescription className="text-subheadline text-muted-foreground leading-relaxed">
                Compute the VLP curve by modeling pressure drop; will intersect
                with IPR to find operating point.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* PVT Required Alert */}
          {!fluidProps && (
            <Alert
              className={cn(
                'border-system-orange/50 bg-system-orange/8 shadow-md shadow-system-orange/10',
                'animate-in slide-in-from-left-2 duration-300',
                'dark:border-system-orange/30 dark:bg-system-orange/5 dark:shadow-lg'
              )}
            >
              <AlertTriangle className="h-4 w-4 text-system-orange" />
              <AlertDescription className="text-system-orange/90 font-medium">
                Please complete PVT analysis before hydraulics calculations.
              </AlertDescription>
            </Alert>
          )}

          {fluidProps && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Correlation Method Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-headline font-semibold text-foreground flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-system-blue" />
                    Correlation Method
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRecommend}
                    className="hover:bg-muted/50"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Recommend Method
                  </Button>
                </div>

                <CorrelationSelector
                  correlations={availableCorrelations}
                  selectedCorrelation={correlationMethod}
                  onSelectCorrelation={handleCorrelationChange}
                />
              </div>

              {/* Survey Data Section for Beggs-Brill */}
              {isBeggsbrillSelected && (
                <div className="space-y-4">
                  <Separator />
                  <SurveyDataUploader
                    onDataChange={isValid => setSurveyDataValid(isValid)}
                  />
                </div>
              )}

              {/* Validation Alert for Beggs-Brill */}
              {!canCalculate && (
                <Alert
                  className={cn(
                    'border-system-orange/50 bg-system-orange/8 shadow-md shadow-system-orange/10',
                    'animate-in slide-in-from-left-2 duration-300',
                    'dark:border-system-orange/30 dark:bg-system-orange/5 dark:shadow-lg'
                  )}
                >
                  <AlertTriangle className="h-4 w-4 text-system-orange" />
                  <AlertDescription className="text-system-orange/90 font-medium">
                    Please upload survey data to use Beggs-Brill correlation.
                  </AlertDescription>
                </Alert>
              )}

              {/* Fluid Parameters */}
              <div className="space-y-4">
                <h3 className="text-headline font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-system-green" />
                  Fluid Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {fluidFields.map(field => (
                    <InputField
                      key={field.name}
                      name={field.name}
                      label={field.label}
                      unit={field.unit}
                      value={formData[field.name as keyof typeof formData] || 0}
                      onChange={handleChange}
                      readOnly={field.readOnly}
                      disabled={field.readOnly}
                    />
                  ))}
                </div>
              </div>

              {/* Wellbore & Reservoir Parameters */}
              <div className="space-y-4">
                <h3 className="text-headline font-semibold text-foreground flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-system-purple" />
                  Wellbore & Reservoir
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {wellboreFields.map(field => (
                    <InputField
                      key={field.name}
                      name={field.name}
                      label={field.label}
                      unit={field.unit}
                      value={formData[field.name as keyof typeof formData] || 0}
                      onChange={handleChange}
                      error={errors[field.name]}
                      readOnly={field.readOnly}
                      disabled={field.readOnly}
                    />
                  ))}
                </div>
              </div>

              {/* Derived Parameters */}
              <div
                className={cn(
                  'p-6 rounded-xl border border-border/50 shadow-lg shadow-black/5',
                  'bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30',
                  'animate-in fade-in-0 slide-in-from-bottom-2 duration-500',
                  'dark:border-border/30 dark:shadow-lg dark:from-muted/40 dark:via-muted/20 dark:to-muted/40'
                )}
              >
                <h4 className="text-headline font-medium text-foreground mb-4">
                  Derived Parameters
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Gas-Oil Ratio
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {gasOilRatio.toFixed(0)}{' '}
                      <span className="text-xs text-muted-foreground">
                        scf/STB
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Water-Oil Ratio
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {waterOilRatio.toFixed(2)}{' '}
                      <span className="text-xs text-muted-foreground">
                        ratio
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Total Liquid
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {totalLiquid.toFixed(0)}{' '}
                      <span className="text-xs text-muted-foreground">B/D</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Productivity Index
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {productivityIndex.toFixed(3)}{' '}
                      <span className="text-xs text-muted-foreground">
                        B/D/psi
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {storeErrors.hydraulics && (
                <Alert
                  className={cn(
                    'border-system-red/50 bg-system-red/8 shadow-md shadow-system-red/10',
                    'animate-in slide-in-from-left-2 duration-300',
                    'dark:border-system-red/30 dark:bg-system-red/5 dark:shadow-lg'
                  )}
                >
                  <AlertTriangle className="h-4 w-4 text-system-red" />
                  <AlertDescription className="text-system-red/90 font-medium">
                    <span className="font-semibold">Hydraulics Error:</span>{' '}
                    {storeErrors.hydraulics}
                  </AlertDescription>
                </Alert>
              )}

              {/* Validation Errors */}
              {hasErrors && (
                <Alert
                  className={cn(
                    'border-system-red/50 bg-system-red/8 shadow-md shadow-system-red/10',
                    'animate-in slide-in-from-left-2 duration-300',
                    'dark:border-system-red/30 dark:bg-system-red/5 dark:shadow-lg'
                  )}
                >
                  <AlertTriangle className="h-4 w-4 text-system-red" />
                  <AlertDescription className="text-system-red/90 font-medium">
                    Please correct the validation errors above before
                    proceeding.
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button and Success Message */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  type="submit"
                  disabled={loading.hydraulics || !canCalculate || hasErrors}
                  className={cn(
                    'px-8 py-2 bg-gradient-to-r from-system-orange to-system-orange/90',
                    'hover:from-system-orange/90 hover:to-system-orange',
                    'text-white font-medium',
                    'shadow-lg hover:shadow-xl hover:shadow-system-orange/25',
                    'transition-all duration-200 ease-apple',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {loading.hydraulics ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Calculate VLP Curve
                    </>
                  )}
                </Button>

                {completeness.hydraulics && (
                  <Alert
                    className={cn(
                      'border-system-green/50 bg-system-green/8 shadow-md shadow-system-green/10 flex-1 max-w-md',
                      'animate-in slide-in-from-right-2 duration-300',
                      'dark:border-system-green/30 dark:bg-system-green/5 dark:shadow-lg'
                    )}
                  >
                    <CheckCircle className="h-4 w-4 text-system-green" />
                    <AlertDescription className="text-system-green/90 font-medium">
                      Hydraulics calculation complete! VLP curve generated
                      successfully.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
