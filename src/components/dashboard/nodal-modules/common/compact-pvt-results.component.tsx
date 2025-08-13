'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const unitMap: { [key: string]: string } = {
  z: '',
  bg: 'RB/SCF',
  pb: 'psia',
  rs: 'SCF/STB',
  bo: 'RB/STB',
  mu_o: 'cp',
  co: '1/psi',
  bt: 'RB/STB',
  rho_o: 'lb/ft³',
  ift: 'dyn/cm',
};

const shortcodeMap: { [key: string]: string } = {
  z: 'Z',
  bg: 'Bg',
  pb: 'Pb',
  rs: 'Rs',
  bo: 'Bo',
  mu_o: 'μo',
  co: 'co',
  bt: 'Bt',
  rho_o: 'ρo',
  ift: 'IFT',
};

const precisionMap: { [key: string]: number } = {
  z: 4,
  bg: 6,
  pb: 1,
  rs: 1,
  bo: 4,
  mu_o: 3,
  co: 7,
  bt: 4,
  rho_o: 2,
  ift: 2,
};

const methodDisplayNames: { [key: string]: string } = {
  standing: 'Standing',
  vazquez_beggs: 'Vazquez-Beggs',
  glaso: 'Glaso',
  marhoun: 'Marhoun',
  petrosky: 'Petrosky',
  beggs_robinson: 'Beggs-Robinson',
  bergman_sutton: 'Bergman-Sutton',
  sutton: 'Sutton',
  hall_yarborough: 'Hall-Yarborough',
  papay: 'Papay',
  katz: 'Katz',
  asheim: 'Asheim',
  parachor: 'Parachor',
  co2_adjusted: 'CO₂ Adjusted',
};

const formatValue = (value: any, property?: string) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') {
    if (property && property in precisionMap) {
      return value.toFixed(precisionMap[property as keyof typeof precisionMap]);
    }
    return value.toFixed(3);
  }
  return value.toString();
};

const getMethodDisplayName = (method: string) => {
  return (
    methodDisplayNames[method as keyof typeof methodDisplayNames] || method
  );
};

const getPropertyUnit = (property: string) => {
  return unitMap[property as keyof typeof unitMap] || '';
};

const getPropertyShortcode = (property: string) => {
  return shortcodeMap[property as keyof typeof shortcodeMap] || property;
};

interface CompactPVTResultsProps {
  data: any;
  showDetails?: boolean;
  onToggleDetails?: () => void;
  isLoading?: boolean;
}

const PropertyCard: React.FC<{
  label: string;
  value: string;
  unit: string;
  isLoading?: boolean;
}> = ({ label, value, unit, isLoading }) => (
  <div
    className={cn(
      'p-3 rounded-lg border border-border/30 bg-background/50',
      'hover:bg-muted/30 hover:border-border/50',
      'transition-all duration-200 ease-apple',
      'backdrop-blur-sm shadow-sm shadow-black/5',
      'focus-visible:ring-2 focus-visible:ring-system-blue/20'
    )}
  >
    <p className="text-xs text-muted-foreground font-medium leading-none mb-1.5">
      {label}
    </p>
    {isLoading ? (
      <Skeleton className="h-5 w-20" />
    ) : (
      <p className="text-sm font-semibold text-foreground leading-none">
        {value}{' '}
        <span className="text-xs text-muted-foreground font-normal">
          {unit}
        </span>
      </p>
    )}
  </div>
);

export const CompactPVTResults: React.FC<CompactPVTResultsProps> = ({
  data,
  showDetails = false,
  onToggleDetails,
  isLoading = false,
}) => {
  if (!data && !isLoading) {
    return (
      <Card
        className={cn(
          'border-border/60 shadow-lg shadow-black/5',
          'bg-gradient-to-br from-background via-background to-muted/20',
          'backdrop-blur-xl',
          'dark:border-border/30'
        )}
      >
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            No results available. Calculate PVT properties first.
          </p>
        </CardContent>
      </Card>
    );
  }

  const result = data?.data?.results?.[0] || data?.results?.[0] || {};

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">
          PVT Properties
        </h3>
        {onToggleDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDetails}
            className={cn(
              'h-8 px-3 text-xs font-medium',
              'hover:bg-muted/50 hover:border-border/60',
              'transition-all duration-200 ease-apple',
              'focus-visible:ring-2 focus-visible:ring-system-blue/20'
            )}
          >
            <BarChart3 className="h-3.5 w-3.5 mr-2" />
            {showDetails ? (
              <>
                Hide Details <ChevronUp className="h-3.5 w-3.5 ml-1" />
              </>
            ) : (
              <>
                Show Details <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>

      <Separator className="opacity-60" />

      <div className="grid grid-cols-2 gap-3">
        <PropertyCard
          label="Bubble Point Pressure"
          value={formatValue(result.pb, 'pb')}
          unit={getPropertyUnit('pb')}
          isLoading={isLoading}
        />

        <PropertyCard
          label="Gas Solubility"
          value={formatValue(result.rs, 'rs')}
          unit={getPropertyUnit('rs')}
          isLoading={isLoading}
        />

        <PropertyCard
          label="Oil Formation Volume Factor"
          value={formatValue(result.bo, 'bo')}
          unit={getPropertyUnit('bo')}
          isLoading={isLoading}
        />

        <PropertyCard
          label="Oil Viscosity"
          value={formatValue(result.mu || result.mu_o, 'mu_o')}
          unit={getPropertyUnit('mu_o')}
          isLoading={isLoading}
        />
      </div>

      {showDetails && (
        <div
          className={cn(
            'space-y-4 animate-in slide-in-from-top-2 duration-300',
            'border-t border-border/30 pt-4'
          )}
        >
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-foreground">
              Detailed Properties
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <PropertyCard
                label="Oil Compressibility"
                value={formatValue(result.co, 'co')}
                unit={getPropertyUnit('co')}
                isLoading={isLoading}
              />

              <PropertyCard
                label="Oil Density"
                value={formatValue(result.rho || result.rho_o, 'rho_o')}
                unit={getPropertyUnit('rho_o')}
                isLoading={isLoading}
              />

              <PropertyCard
                label="Gas Compressibility Factor"
                value={formatValue(result.z, 'z')}
                unit={getPropertyUnit('z')}
                isLoading={isLoading}
              />

              <PropertyCard
                label="Interfacial Tension"
                value={formatValue(result.ift, 'ift')}
                unit={getPropertyUnit('ift')}
                isLoading={isLoading}
              />
            </div>
          </div>

          {(data?.data?.correlations || data?.correlations) && (
            <div className="space-y-3">
              <Separator className="opacity-60" />
              <h4 className="text-sm font-semibold text-foreground">
                Used Correlations
              </h4>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(
                  data?.data?.correlations || data?.correlations || {}
                ).map(([key, value]: [string, any]) => (
                  <div
                    key={key}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-md',
                      'bg-muted/30 border border-border/20',
                      'hover:bg-muted/50 transition-colors duration-150'
                    )}
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {getPropertyShortcode(key)}:
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-system-blue/10 text-system-blue border-system-blue/20"
                    >
                      {getMethodDisplayName(value.toString())}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
