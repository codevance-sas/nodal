'use client';

import { Navigation, Settings } from 'lucide-react';
import { appColors } from '@/core/common/constant/app-colors.constant';
import { AppLoader } from '@/components/common/app-loader.component';
import { BHADesignTab } from './bha-design-tab.component';
import { ContextualDescriptionPanel } from '@/components/dashboard/nodal-modules/common/contextual-description-panel.component';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WellboreConfigPanel } from './wellbore-config-panel.component';
import React, { useState, Suspense, useCallback, FC } from 'react';

enum WellboreTab {
  BHA = 'bha',
  SURVEY = 'survey',
}

export const WellboreDesignModule: FC = () => {
  const [activeTab, setActiveTab] = useState<WellboreTab>(WellboreTab.BHA);

  const handleTabChange = useCallback((value: string) => {
    const newTab = value as WellboreTab;
    setActiveTab(newTab);
  }, []);

  const [surfaceTemperature] = useState(75);
  const [temperatureGradient] = useState(1.5);

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
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="h-[100%]"
          >
            <div className="border-b border-border/30 glass-effect">
              <TabsList className="grid w-full grid-cols-2 bg-transparent p-2 gap-2">
                <TabsTrigger
                  value={WellboreTab.BHA}
                  className="data-[state=active]:bg-system-blue/10 data-[state=active]:text-system-blue data-[state=active]:shadow-sm transition-all duration-200 ease-apple text-callout font-medium rounded-lg"
                >
                  BHA Design
                </TabsTrigger>
                <TabsTrigger
                  value={WellboreTab.SURVEY}
                  className="data-[state=active]:bg-system-blue/10 data-[state=active]:text-system-blue data-[state=active]:shadow-sm transition-all duration-200 ease-apple text-callout font-medium rounded-lg"
                >
                  Survey
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="relative overflow-hidden min-h-[100%]">
              <Suspense fallback={<AppLoader />}>
                <TabsContent
                  value={WellboreTab.BHA}
                  className="min-h-[100%] w-full animate-fade-in data-[state=active]:animate-slide-up p-0 m-0"
                >
                  <BHADesignTab nodalColors={appColors} />
                </TabsContent>

                <TabsContent
                  value={WellboreTab.SURVEY}
                  className="h-[100%] w-full animate-fade-in data-[state=active]:animate-slide-up p-0 m-0"
                >
                  <div className="flex items-center justify-center h-[100%] w-full">
                    <div className="text-center space-y-4">
                      <Navigation className="h-16 w-16 text-system-blue mx-auto" />
                      <p className="text-title-3 font-semibold text-foreground">
                        TODO: Survey Tab
                      </p>
                      <p className="text-callout text-muted-foreground">
                        Componente de análisis de trayectoria del pozo
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Suspense>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
};
