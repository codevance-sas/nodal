'use client';

import React, { useMemo } from 'react';
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
import { appColors } from '@/core/common/constant/app-colors.constant';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// TODO: Implement these modules

const NodalAnalysisSensitivityModule = () => (
  <div className="p-8 text-center bg-card rounded-xl border border-border/50">
    <p className="text-muted-foreground">Sensitivity Module - TODO</p>
  </div>
);

const NodalAnalysisContent: React.FC = () => {
  const { activeSection } = useAnalysisStore();
  const { bhaRows, casingRows, nodalDepth } = useBhaStore();

  const isWellboreDesignRequired =
    bhaRows.length === 0 && casingRows.length === 0;

  const mergedRows = useMemo(() => {
    if (isWellboreDesignRequired) return [];
    return mergeBhaAndCasingRows(bhaRows, casingRows, nodalDepth);
  }, [bhaRows, casingRows, nodalDepth, isWellboreDesignRequired]);

  return (
    <>
      <WellboreDesignRequiredModal open={isWellboreDesignRequired} />

      {/* Main Container with Apple Design System */}
      <div className={cn('min-h-screen bg-background', 'p-6 space-y-8')}>
        <NodalAnalysisStepper />

        <div
          className={cn(
            'transition-all duration-300 ease-apple',
            'animate-in fade-in-0 slide-in-from-bottom-4'
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
      </div>
    </>
  );
};

export const NodalAnalysisContainer: React.FC = () => <NodalAnalysisContent />;
