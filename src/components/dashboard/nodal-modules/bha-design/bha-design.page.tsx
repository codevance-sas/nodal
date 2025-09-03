'use client';

import { Settings } from 'lucide-react';
import { appColors } from '@/core/common/constant/app-colors.constant';
import { AppLoader } from '@/components/common/app-loader.component';
import { BHADesignSvg } from './bha-design-svg.component';
import { ContextualDescriptionPanel } from '@/components/dashboard/nodal-modules/common/contextual-description-panel.component';
import { WellboreConfigPanel } from '../wellbore-design/wellbore-config-panel.component';
import React, { Suspense, FC } from 'react';

export const BHADesignModule: FC = () => {
  return (
    <>
      <ContextualDescriptionPanel
        anchor="left"
        drawerWidth={350}
        icon={<Settings className="h-4 w-4" />}
        title="Wellbore Configuration"
        description="Configure wellbore design parameters and settings"
      >
        <WellboreConfigPanel />
      </ContextualDescriptionPanel>

      <div className="w-full min-h-[100%] gap-0 glass-effect rounded-xl shadow-xl overflow-hidden relative animate-spring-in">
        <div className="min-h-[100%] w-full">
          <div className="relative overflow-hidden min-h-[100%]">
            <Suspense fallback={<AppLoader />}>
              <BHADesignSvg nodalColors={appColors} />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
};
