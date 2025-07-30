'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAnalysisStore } from '@/store/nodal-modules/nodal-analysis/use-nodal-analysis.store';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { InputField } from '@/components/custom/input-field/input-field.component';

export const NodalAnalysisIprModule: React.FC = () => {
  const { iprInputs, setIprInputs, completeness } = useAnalysisStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: number) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'BOPD':
        if (value <= 0) {
          newErrors[name] = 'Oil rate must be greater than 0';
        } else {
          delete newErrors[name];
        }
        break;
      case 'BWPD':
        if (value < 0) {
          newErrors[name] = 'Water rate cannot be negative';
        } else {
          delete newErrors[name];
        }
        break;
      case 'MCFD':
        if (value < 0) {
          newErrors[name] = 'Gas rate cannot be negative';
        } else {
          delete newErrors[name];
        }
        break;
      case 'Pr':
        if (value <= 0) {
          newErrors[name] = 'Reservoir pressure must be greater than 0';
        } else if (value > 10000) {
          newErrors[name] = 'Reservoir pressure seems too high';
        } else {
          delete newErrors[name];
        }
        break;
      case 'PIP':
        if (value < 0) {
          newErrors[name] = 'Pump intake pressure cannot be negative';
        } else if (value >= (iprInputs.Pr || 0) && iprInputs.Pr > 0) {
          newErrors[name] = 'PIP should be less than reservoir pressure';
        } else {
          delete newErrors[name];
        }
        break;
      case 'steps':
        if (value < 5) {
          newErrors[name] = 'Minimum 5 steps required';
        } else if (value > 50) {
          newErrors[name] = 'Maximum 50 steps allowed';
        } else {
          delete newErrors[name];
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (name: string, value: number) => {
    setIprInputs({ ...iprInputs, [name]: value });
    validateField(name, value);
  };

  const fields = [
    { name: 'BOPD', label: 'Oil Rate', unit: 'BOPD' },
    { name: 'BWPD', label: 'Water Rate', unit: 'BWPD' },
    { name: 'MCFD', label: 'Gas Rate', unit: 'MCFD' },
    { name: 'Pr', label: 'Reservoir Pressure', unit: 'psi' },
    { name: 'PIP', label: 'Pump Intake Pressure', unit: 'psi' },
    { name: 'steps', label: 'Calculation Steps', unit: 'steps' },
  ];

  const isReadyForCalculation =
    (iprInputs.BOPD || 0) > 0 && (iprInputs.Pr || 0) > 0;
  const hasErrors = Object.keys(errors).length > 0;

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
            <div className="p-2 bg-system-blue/10 rounded-xl">
              <TrendingUp className="h-6 w-6 text-system-blue" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-title-1 font-semibold text-foreground">
                Inflow Performance Relationship
              </CardTitle>
              <CardDescription className="text-subheadline text-muted-foreground leading-relaxed">
                Enter your well's flow rates and reservoir parameters. IPR curve
                will be calculated after completing PVT analysis.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.map(field => (
              <InputField
                key={field.name}
                name={field.name}
                label={field.label}
                unit={field.unit}
                value={iprInputs[field.name] || 0}
                onChange={handleInputChange}
                error={errors[field.name]}
              />
            ))}
          </div>

          {/* Status Alerts */}
          <div className="space-y-4">
            {!completeness.pvt && (
              <Alert
                className={cn(
                  'border-system-orange/50 bg-system-orange/8 shadow-md shadow-system-orange/10',
                  'animate-in slide-in-from-left-2 duration-300',
                  'dark:border-system-orange/30 dark:bg-system-orange/5 dark:shadow-lg'
                )}
              >
                <AlertTriangle className="h-4 w-4 text-system-orange" />
                <AlertDescription className="text-system-orange/90 font-medium">
                  Complete the PVT analysis first to calculate the IPR curve and
                  proceed to the next step.
                </AlertDescription>
              </Alert>
            )}

            {!isReadyForCalculation && (
              <Alert
                className={cn(
                  'border-system-blue/50 bg-system-blue/8 shadow-md shadow-system-blue/10',
                  'animate-in slide-in-from-left-2 duration-300 delay-100',
                  'dark:border-system-blue/30 dark:bg-system-blue/5 dark:shadow-lg'
                )}
              >
                <TrendingUp className="h-4 w-4 text-system-blue" />
                <AlertDescription className="text-system-blue/90 font-medium">
                  Enter valid Oil Rate (BOPD) and Reservoir Pressure (Pr) to
                  enable IPR calculations.
                </AlertDescription>
              </Alert>
            )}

            {hasErrors && (
              <Alert
                className={cn(
                  'border-system-red/50 bg-system-red/8 shadow-md shadow-system-red/10',
                  'animate-in slide-in-from-left-2 duration-300 delay-200',
                  'dark:border-system-red/30 dark:bg-system-red/5 dark:shadow-lg'
                )}
              >
                <AlertTriangle className="h-4 w-4 text-system-red" />
                <AlertDescription className="text-system-red/90 font-medium">
                  Please correct the validation errors above before proceeding.
                </AlertDescription>
              </Alert>
            )}

            {completeness.pvt && completeness.ipr && (
              <Alert
                className={cn(
                  'border-system-green/50 bg-system-green/8 shadow-md shadow-system-green/10',
                  'animate-in slide-in-from-left-2 duration-300',
                  'dark:border-system-green/30 dark:bg-system-green/5 dark:shadow-lg'
                )}
              >
                <CheckCircle className="h-4 w-4 text-system-green" />
                <AlertDescription className="text-system-green/90 font-medium">
                  IPR calculation complete! You can now proceed to Wellbore
                  Hydraulics analysis.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Calculation Summary */}
          {isReadyForCalculation && !hasErrors && (
            <div
              className={cn(
                'p-6 rounded-xl border border-border/50 shadow-lg shadow-black/5',
                'bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30',
                'animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-300',
                'dark:border-border/30 dark:shadow-lg dark:from-muted/40 dark:via-muted/20 dark:to-muted/40'
              )}
            >
              <h4 className="text-headline font-medium text-foreground mb-3">
                Calculation Preview
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Total Liquid</p>
                  <p className="font-medium text-foreground">
                    {(
                      (iprInputs.BOPD || 0) + (iprInputs.BWPD || 0)
                    ).toLocaleString()}{' '}
                    BPD
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">GOR</p>
                  <p className="font-medium text-foreground">
                    {iprInputs.BOPD > 0
                      ? (
                          ((iprInputs.MCFD || 0) * 1000) /
                          iprInputs.BOPD
                        ).toFixed(0)
                      : '0'}{' '}
                    SCF/STB
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Water Cut</p>
                  <p className="font-medium text-foreground">
                    {(iprInputs.BOPD || 0) + (iprInputs.BWPD || 0) > 0
                      ? (
                          ((iprInputs.BWPD || 0) /
                            ((iprInputs.BOPD || 0) + (iprInputs.BWPD || 0))) *
                          100
                        ).toFixed(1)
                      : '0'}
                    %
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Pressure Drop</p>
                  <p className="font-medium text-foreground">
                    {(
                      (iprInputs.Pr || 0) - (iprInputs.PIP || 0)
                    ).toLocaleString()}{' '}
                    psi
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
