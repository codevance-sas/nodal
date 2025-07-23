'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface WellboreDesignRequiredModalProps {
  open: boolean;
  onRedirect?: () => void;
}

export const WellboreDesignRequiredModal: React.FC<
  WellboreDesignRequiredModalProps
> = ({ open, onRedirect }) => {
  if (!open) return null;

  const handleRedirect = () => {
    if (onRedirect) {
      onRedirect();
    } else {
      // TODO: Implement navigation - currently shows alert
      alert('Navigating to Wellbore Design...');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={cn(
          'w-full max-w-md mx-auto',
          'bg-background border-2 border-system-blue/30',
          'rounded-2xl shadow-2xl backdrop-blur-xl',
          'animate-in zoom-in-95 duration-300'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'bg-gradient-to-r from-system-red to-system-red/90',
            'text-white p-6 rounded-t-2xl',
            'flex items-center gap-3'
          )}
        >
          <div className="p-2 bg-white/20 rounded-full">
            <Activity className="h-5 w-5" />
          </div>
          <h2 className="text-title-2 font-semibold">
            Wellbore Design Required
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-system-blue/10 rounded-full flex items-center justify-center">
              <Activity className="h-8 w-8 text-system-blue" />
            </div>

            <div className="space-y-3">
              <h3 className="text-title-3 font-semibold text-foreground">
                Complete Wellbore Design First
              </h3>

              <p className="text-body text-muted-foreground leading-relaxed">
                Before proceeding with Nodal Analysis, you need to complete the
                Wellbore Design module and create both BHA and Casing
                configurations.
              </p>

              <p className="text-footnote text-muted-foreground/80 italic">
                This step is essential to ensure accurate analysis results based
                on your well configuration.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/dashboard/nodal-modules/wellbore-design"
              className={cn(
                'w-full px-6 py-3 rounded-xl font-medium text-callout',
                'bg-gradient-to-r from-system-blue to-system-blue/90',
                'text-white shadow-lg',
                'hover:shadow-xl hover:shadow-system-blue/25',
                'hover:-translate-y-0.5 hover:from-system-blue/90 hover:to-system-blue',
                'active:scale-[0.98] transition-all duration-200 ease-apple',
                'focus:outline-none focus:ring-2 focus:ring-system-blue focus:ring-offset-2',
                'flex items-center justify-center gap-2'
              )}
            >
              <Activity className="h-4 w-4" />
              Go to Wellbore Design
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
