'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Gauge, 
  Droplets, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Target,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisPoint } from '@/core/nodal-modules/nodal-analysis/types/nodal-analysis.types';

interface NodalAnalysisSummaryProps {
  iprInputs: Record<string, number>;
  pvtInputs: Record<string, any> | null;
  hydraulicsResults: any;
  operatingPoint: AnalysisPoint | null;
}

export const NodalAnalysisSummary: React.FC<NodalAnalysisSummaryProps> = ({
  iprInputs,
  pvtInputs,
  hydraulicsResults,
  operatingPoint,
}) => {
  if (!operatingPoint) {
    return null;
  }

  const formatValue = (value: any, precision = 0) => {
    if (value === undefined || value === null) return "N/A";
    return typeof value === "number"
      ? value.toFixed(precision)
      : value.toString();
  };

  const calculateEfficiency = () => {
    if (!iprInputs || !operatingPoint) return "N/A";
    const efficiency = (operatingPoint.rate / iprInputs.BOPD) * 100;
    return `${Math.round(efficiency)}%`;
  };

  const generateRecommendations = () => {
    const recs = [];

    if (operatingPoint && iprInputs && operatingPoint.rate < iprInputs.BOPD * 0.9) {
      recs.push(
        "The operating point is below the test rate. Consider optimizing the wellbore configuration."
      );
    }

    if (hydraulicsResults && hydraulicsResults.hydrostatic_pressure_drop / hydraulicsResults.overall_pressure_drop > 0.8) {
      recs.push(
        "Hydrostatic pressure dominates the pressure drop. Consider gas lift to reduce this component."
      );
    }

    if (hydraulicsResults && hydraulicsResults.friction_pressure_drop / hydraulicsResults.overall_pressure_drop > 0.4) {
      recs.push(
        "Friction pressure drop is significant. Consider increasing tubing size to reduce friction losses."
      );
    }

    if (hydraulicsResults && hydraulicsResults.surface_pressure > 100) {
      const target = Math.max(50, hydraulicsResults.surface_pressure - 50);
      recs.push(
        `Consider reducing wellhead pressure to ${target} psia to increase production rate.`
      );
    }

    if (operatingPoint && iprInputs && operatingPoint.pressure < iprInputs.Pr * 0.5) {
      recs.push(
        "Bottomhole pressure is less than 50% of reservoir pressure. Artificial lift might improve production."
      );
    }

    if (recs.length === 0) {
      recs.push(
        "The well appears to be operating normally. Continue monitoring performance over time."
      );
    }

    return recs;
  };

  return (
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-title-2 font-semibold text-foreground">
          Analysis Summary
        </h3>
        <p className="text-body text-muted-foreground">
          Detailed breakdown of nodal analysis results and performance metrics
        </p>
      </div>

      {/* Key Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operating Point Card */}
        <Card className={cn(
          'glass-effect border-system-blue/30 shadow-lg',
          'bg-gradient-to-br from-system-blue/5 via-background/90 to-system-blue/10',
          'backdrop-blur-sm'
        )}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-system-blue/10 rounded-lg">
                <Target className="h-5 w-5 text-system-blue" />
              </div>
              <CardTitle className="text-headline text-system-blue">
                Operating Point
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-footnote font-medium text-muted-foreground">Flow Rate</p>
                <p className="text-title-3 font-semibold text-foreground">
                  {formatValue(operatingPoint.rate)} <span className="text-footnote text-muted-foreground">BOPD</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-footnote font-medium text-muted-foreground">BHP</p>
                <p className="text-title-3 font-semibold text-foreground">
                  {formatValue(operatingPoint.pressure)} <span className="text-footnote text-muted-foreground">psia</span>
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-footnote font-medium text-muted-foreground">Efficiency</span>
              <Badge 
                variant="secondary" 
                className="bg-system-green/10 text-system-green border-system-green/20"
              >
                {calculateEfficiency()} of test rate
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Production Rates Card */}
        <Card className={cn(
          'glass-effect border-system-green/30 shadow-lg',
          'bg-gradient-to-br from-system-green/5 via-background/90 to-system-green/10',
          'backdrop-blur-sm'
        )}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-system-green/10 rounded-lg">
                <Droplets className="h-5 w-5 text-system-green" />
              </div>
              <CardTitle className="text-headline text-system-green">
                Production Rates
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-footnote font-medium text-muted-foreground">Oil Rate</p>
                <p className="text-body font-semibold text-foreground">
                  {formatValue(iprInputs?.BOPD)} BOPD
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-footnote font-medium text-muted-foreground">Water Rate</p>
                <p className="text-body font-semibold text-foreground">
                  {formatValue(iprInputs?.BWPD)} BWPD
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-footnote font-medium text-muted-foreground">Gas Rate</p>
                <p className="text-body font-semibold text-foreground">
                  {formatValue(iprInputs?.MCFD)} MCFD
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-footnote font-medium text-muted-foreground">Total Liquid</p>
                <p className="text-body font-semibold text-foreground">
                  {formatValue(iprInputs ? iprInputs.BOPD + iprInputs.BWPD : null)} BPD
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Technical Analysis Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IPR Analysis */}
        <Card className="glass-effect border-border/30 bg-background/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-subheadline font-semibold">
                IPR Analysis
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-footnote text-muted-foreground">Reservoir Pressure:</span>
              <span className="text-footnote font-medium">{formatValue(iprInputs?.Pr)} psia</span>
            </div>
            <div className="flex justify-between">
              <span className="text-footnote text-muted-foreground">Pump Intake Pressure:</span>
              <span className="text-footnote font-medium">{formatValue(iprInputs?.PIP)} psia</span>
            </div>
            <div className="flex justify-between">
              <span className="text-footnote text-muted-foreground">Bubble Point:</span>
              <span className="text-footnote font-medium">{formatValue(iprInputs?.Pb || pvtInputs?.pb)} psia</span>
            </div>
            <div className="flex justify-between">
              <span className="text-footnote text-muted-foreground">Productivity Index:</span>
              <span className="text-footnote font-medium">
                {iprInputs ? formatValue(iprInputs.BOPD / (iprInputs.Pr - iprInputs.PIP), 2) : "N/A"} BOPD/psi
              </span>
            </div>
          </CardContent>
        </Card>

        {/* PVT Analysis */}
        <Card className="glass-effect border-border/30 bg-background/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-subheadline font-semibold">
                PVT Analysis
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-footnote text-muted-foreground">API Gravity:</span>
              <span className="text-footnote font-medium">{formatValue(pvtInputs?.api, 1)} °API</span>
            </div>
            <div className="flex justify-between">
              <span className="text-footnote text-muted-foreground">Gas Gravity:</span>
              <span className="text-footnote font-medium">{formatValue(pvtInputs?.gas_gravity, 3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-footnote text-muted-foreground">GOR:</span>
              <span className="text-footnote font-medium">{formatValue(pvtInputs?.gor)} SCF/STB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-footnote text-muted-foreground">Temperature:</span>
              <span className="text-footnote font-medium">{formatValue(pvtInputs?.temperature)} °F</span>
            </div>
          </CardContent>
        </Card>

        {/* Hydraulics Analysis */}
        <Card className="glass-effect border-border/30 bg-background/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Gauge className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-subheadline font-semibold">
                Hydraulics Analysis
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-footnote text-muted-foreground">Wellhead Pressure:</span>
              <span className="text-footnote font-medium">{formatValue(hydraulicsResults?.surface_pressure)} psia</span>
            </div>
            <div className="flex justify-between">
              <span className="text-footnote text-muted-foreground">Bottomhole Pressure:</span>
              <span className="text-footnote font-medium">{formatValue(hydraulicsResults?.bottomhole_pressure)} psia</span>
            </div>
            <div className="flex justify-between">
              <span className="text-footnote text-muted-foreground">Total Pressure Drop:</span>
              <span className="text-footnote font-medium">{formatValue(hydraulicsResults?.overall_pressure_drop)} psi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-footnote text-muted-foreground">Correlation Method:</span>
              <span className="text-footnote font-medium">{hydraulicsResults?.method || "N/A"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* System Analysis */}
      <Card className="glass-effect border-border/30 bg-background/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Zap className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <CardTitle className="text-subheadline font-semibold">
              System Analysis
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-body text-muted-foreground leading-relaxed">
            The well is operating at{" "}
            <span className="font-semibold text-foreground">{formatValue(operatingPoint.rate)} BOPD</span> with a
            bottomhole pressure of{" "}
            <span className="font-semibold text-foreground">{formatValue(operatingPoint.pressure)} psia</span>. This
            represents the intersection of the IPR and VLP curves.
          </p>

          {hydraulicsResults && (
            <p className="text-body text-muted-foreground leading-relaxed">
              Total pressure drop in the wellbore is{" "}
              <span className="font-semibold text-foreground">{formatValue(hydraulicsResults.overall_pressure_drop)} psi</span>, with{" "}
              <span className="font-semibold text-foreground">{formatValue(hydraulicsResults.hydrostatic_pressure_drop)} psi</span> (
              {formatValue(hydraulicsResults.elevation_drop_percentage, 0)}%) from
              hydrostatic pressure and{" "}
              <span className="font-semibold text-foreground">{formatValue(hydraulicsResults.friction_pressure_drop)} psi</span> (
              {formatValue(hydraulicsResults.friction_drop_percentage, 0)}%) from
              friction.
            </p>
          )}

          <p className="text-body text-muted-foreground leading-relaxed">
            Based on current conditions, the well is producing at{" "}
            <span className="font-semibold text-foreground">{calculateEfficiency()}</span> of the test rate.
            {operatingPoint.rate > (iprInputs?.BOPD || 0) * 1.1
              ? " This exceeds the test rate, which may indicate improved performance."
              : ""}
          </p>
        </CardContent>
      </Card>

      {/* Optimization Opportunities */}
      <Card className={cn(
        'glass-effect border-system-orange/30 shadow-lg',
        'bg-gradient-to-br from-system-orange/5 via-background/90 to-system-orange/10',
        'backdrop-blur-sm'
      )}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-system-orange/10 rounded-lg">
              <Lightbulb className="h-5 w-5 text-system-orange" />
            </div>
            <CardTitle className="text-headline text-system-orange">
              Optimization Opportunities
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {generateRecommendations().map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-system-orange mt-0.5 flex-shrink-0" />
                <p className="text-body text-muted-foreground leading-relaxed">
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 