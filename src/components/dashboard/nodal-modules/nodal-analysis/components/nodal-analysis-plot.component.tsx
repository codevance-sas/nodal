'use client';

import * as React from 'react';
import Plot from 'react-plotly.js';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisPoint } from '@/core/nodal-modules/nodal-analysis/types/nodal-analysis.types';

interface NodalAnalysisPlotProps {
  iprData: AnalysisPoint[];
  vlpData: AnalysisPoint[];
  operatingPoint: AnalysisPoint | null;
}

export const NodalAnalysisPlot: React.FC<NodalAnalysisPlotProps> = ({
  iprData,
  vlpData,
  operatingPoint,
}) => {
  const validIprData = iprData.filter(
    (d) => !isNaN(d.rate) && !isNaN(d.pressure)
  );
  const validVlpData = vlpData.filter(
    (d) => !isNaN(d.rate) && !isNaN(d.pressure)
  );

  if (validIprData.length === 0 || validVlpData.length === 0) {
    return (
      <Card className="glass-effect border-border/30 bg-background/50">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-muted/30 rounded-xl">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-headline font-medium text-foreground">
                No Chart Data Available
              </p>
              <p className="text-body text-muted-foreground">
                No valid data available to display the nodal analysis chart.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxRate = Math.max(
    ...validIprData.map((d) => d.rate),
    ...validVlpData.map((d) => d.rate),
    operatingPoint && !isNaN(operatingPoint.rate) ? operatingPoint.rate : 0
  );

  const maxPressure = Math.max(
    ...validIprData.map((d) => d.pressure),
    ...validVlpData.map((d) => d.pressure),
    operatingPoint && !isNaN(operatingPoint.pressure) ? operatingPoint.pressure : 0
  );

  const traces: any[] = [
    {
      x: validIprData.map(d => d.rate),
      y: validIprData.map(d => d.pressure),
      type: 'scatter',
      mode: 'lines',
      name: 'IPR Curve',
      line: {
        color: '#007AFF', // system-blue
        width: 4,
        shape: 'spline'
      },
      hovertemplate: 'Rate: %{x:.0f} BOPD<br>Pressure: %{y:.0f} psia<br>IPR Curve<extra></extra>'
    },
    {
      x: validVlpData.map(d => d.rate),
      y: validVlpData.map(d => d.pressure),
      type: 'scatter',
      mode: 'lines',
      name: 'VLP Curve',
      line: {
        color: '#FF3B30', // system-red
        width: 4,
        shape: 'spline'
      },
      hovertemplate: 'Rate: %{x:.0f} BOPD<br>Pressure: %{y:.0f} psia<br>VLP Curve<extra></extra>'
    }
  ];

  if (operatingPoint && !isNaN(operatingPoint.rate) && !isNaN(operatingPoint.pressure)) {
    traces.push({
      x: [operatingPoint.rate],
      y: [operatingPoint.pressure],
      type: 'scatter',
      mode: 'markers',
      name: 'Operating Point',
      marker: {
        color: '#34C759', // system-green
        size: 16,
        symbol: 'diamond',
        line: {
          color: '#ffffff',
          width: 3
        }
      },
      hovertemplate: 'Operating Point<br>Rate: %{x:.0f} BOPD<br>Pressure: %{y:.0f} psia<extra></extra>'
    });
  }

  const layout: any = {
    title: {
      text: '',
      font: { size: 0 }
    },
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
      zeroline: false,
      range: [0, maxRate * 1.1],
      showgrid: true,
      gridwidth: 1,
      tickfont: {
        color: 'var(--muted-foreground)',
        size: 12
      }
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
      zeroline: false,
      range: [0, maxPressure * 1.1],
      showgrid: true,
      gridwidth: 1,
      tickfont: {
        color: 'var(--muted-foreground)',
        size: 12
      }
    },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    margin: { l: 80, r: 50, t: 30, b: 80 },
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'var(--background)',
      bordercolor: 'var(--border)',
      borderwidth: 1,
      font: {
        color: 'var(--foreground)',
        size: 12,
        family: 'SF Pro Display, -apple-system, system-ui, sans-serif'
      }
    },
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: 'var(--popover)',
      bordercolor: 'var(--border)',
      font: {
        color: 'var(--popover-foreground)',
        family: 'SF Pro Display, -apple-system, system-ui, sans-serif'
      }
    }
  };

  const config = {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-headline font-semibold text-foreground">
            Nodal Analysis Chart
          </h3>
          <p className="text-body text-muted-foreground">
            IPR and VLP curves intersection showing the operating point
          </p>
        </div>
        
        {operatingPoint && !isNaN(operatingPoint.rate) && !isNaN(operatingPoint.pressure) && (
          <Badge 
            variant="secondary" 
            className={cn(
              'bg-system-green/10 text-system-green border-system-green/20',
              'px-3 py-2 text-sm font-medium',
              'dark:bg-system-green/20 dark:text-system-green'
            )}
          >
            Operating Point: {operatingPoint.rate.toFixed(0)} BOPD @ {operatingPoint.pressure.toFixed(0)} psia
          </Badge>
        )}
      </div>

      {/* Chart Container */}
      <Card className={cn(
        'glass-effect border-border/30 shadow-lg',
        'bg-gradient-to-br from-background/95 via-background/90 to-muted/30',
        'backdrop-blur-sm overflow-hidden'
      )}>
        <CardContent className="p-6">
          <div className="w-full h-[500px] relative">
            <Plot
              data={traces}
              layout={layout}
              config={config}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Chart Description */}
      <Alert className={cn(
        'border-system-blue/30 bg-system-blue/5',
        'animate-in slide-in-from-left-2 duration-300'
      )}>
        <Info className="h-4 w-4 text-system-blue" />
        <AlertDescription className="text-system-blue/90 text-sm">
          <strong>Chart Interpretation:</strong> The intersection of the IPR (blue) and VLP (red) curves represents 
          the expected operating point (green diamond). Hover over the chart elements to see detailed values. 
          The operating point indicates the natural flow rate of the well under current conditions.
        </AlertDescription>
      </Alert>
    </div>
  );
}; 