'use client';

import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import { useAnalysisStore } from '@/store/nodal-modules/nodal-analysis/use-nodal-analysis.store';
import type { SectionAnalysisKey } from '@/core/nodal-modules/nodal-analysis/types/nodal-analysis.types';
import { cn } from '@/lib/utils';

const tabs = [
  { key: 'ipr', label: 'Inflow Performance', shortLabel: 'IPR' },
  { key: 'pvt', label: 'PVT Analysis', shortLabel: 'PVT' },
  { key: 'hydraulics', label: 'Wellbore Hydraulics', shortLabel: 'Hydraulics' },
  { key: 'results', label: 'Nodal Analysis', shortLabel: 'Results' },
  {
    key: 'correlations',
    label: 'Multi‑Correlation',
    shortLabel: 'Correlation',
  },
  { key: 'sensitivity', label: 'Sensitivity', shortLabel: 'Sensitivity' },
] as const;

interface TabData {
  key: SectionAnalysisKey;
  label: string;
  shortLabel: string;
}

interface ChevronTabProps {
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const ChevronTab: React.FC<ChevronTabProps> = ({
  isActive,
  isCompleted,
  isDisabled,
  isFirst,
  isLast,
  onClick,
  children,
}) => {
  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      onClick={!isDisabled ? onClick : undefined}
      onKeyDown={e => {
        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) onClick();
      }}
      className={cn(
        'relative flex-1 flex items-center justify-center h-16',
        'transition-all duration-700 ease-out transform-gpu will-change-transform',
        'group',
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',

        // Z-index hierarchy for proper layering
        isActive && 'z-30',
        isCompleted && !isActive && 'z-20',
        !isActive && !isCompleted && 'z-10',

        // Left margin for chevron overlap (except first)
        !isFirst && '-ml-5',

        // Subtle hover effects - Apple style
        !isDisabled && 'hover:scale-[1.02] hover:-translate-y-0.5',

        // Apple System Colors - Natural and Organic
        isActive && [
          'bg-gradient-to-b from-blue-400/90 to-blue-500/90',
          'shadow-lg shadow-blue-400/20',
          'dark:from-blue-500/90 dark:to-blue-600/90',
          'dark:shadow-blue-500/15',
        ],

        isCompleted &&
          !isActive && [
            'bg-gradient-to-b from-green-400/90 to-green-500/90',
            'shadow-md shadow-green-400/15',
            'dark:from-green-500/90 dark:to-green-600/90',
            'dark:shadow-green-500/10',
          ],

        !isActive &&
          !isCompleted &&
          !isDisabled && [
            'bg-gradient-to-b from-gray-50/90 to-gray-100/90',
            'shadow-sm shadow-gray-200/25 hover:shadow-md hover:shadow-gray-300/20',
            'dark:from-gray-600/90 dark:to-gray-700/90',
            'dark:shadow-gray-800/15 dark:hover:shadow-gray-700/20',
          ],

        isDisabled && [
          'bg-gradient-to-b from-gray-100/70 to-gray-200/70',
          'opacity-40 shadow-sm shadow-gray-300/10',
          'dark:from-gray-700/70 dark:to-gray-800/70',
          'dark:opacity-30 dark:shadow-gray-900/5',
        ]
      )}
      style={{
        // Forma como en el dibujo: rectángulo con esquina inferior derecha cortada
        clipPath: isFirst
          ? 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)'
          : isLast
          ? 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)'
          : 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
      }}
    >
      {/* Apple-style subtle inner light */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent',
          'dark:from-white/5 dark:via-transparent dark:to-transparent',
          isDisabled && 'opacity-0'
        )}
        style={{
          clipPath: isFirst
            ? 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)'
            : isLast
            ? 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)'
            : 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
        }}
      />

      {/* Content container with proper padding for chevron shape */}
      <div
        className={cn(
          'relative flex items-center justify-center gap-2 text-center z-10',
          'px-4 py-4',
          !isFirst && 'pl-7', // Extra padding left for non-first items
          !isLast && 'pr-7' // Extra padding right for non-last items
        )}
      >
        {children}
      </div>

      {/* Apple-style glow for active state */}
      {isActive && (
        <div
          className="absolute inset-0 bg-blue-400/15 blur-xl -z-10 scale-110"
          style={{
            clipPath: isFirst
              ? 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)'
              : isLast
              ? 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)'
              : 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
          }}
        />
      )}
    </div>
  );
};

interface TabLabelProps {
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  label: string;
  shortLabel: string;
}

const TabLabel: React.FC<TabLabelProps> = ({
  isActive,
  isCompleted,
  isDisabled,
  label,
  shortLabel,
}) => {
  const base = cn(
    'font-medium transition-all duration-500',
    'tracking-normal',
    isActive || isCompleted
      ? 'text-white dark:text-white'
      : isDisabled
      ? 'text-gray-400 dark:text-gray-600'
      : 'text-gray-700 dark:text-gray-300'
  );

  return (
    <>
      <span className={cn(base, 'hidden md:inline text-sm leading-snug')}>
        {label}
      </span>
      <span className={cn(base, 'inline md:hidden text-xs leading-snug')}>
        {shortLabel}
      </span>
    </>
  );
};

const CompletionIcon = () => (
  <div className="ml-2 flex items-center justify-center">
    <div
      className={cn(
        'h-5 w-5 rounded-full bg-white/20 backdrop-blur-sm',
        'flex items-center justify-center',
        'animate-in zoom-in-50 duration-500'
      )}
    >
      <Check className="h-3 w-3 text-white font-bold stroke-2" />
    </div>
  </div>
);

const InfoBox: React.FC<{ activeSection: SectionAnalysisKey }> = ({
  activeSection,
}) => {
  if (activeSection !== 'correlations' && activeSection !== 'sensitivity')
    return null;

  const message =
    activeSection === 'correlations'
      ? 'Compare different correlation methods to evaluate their impact on your production forecast.'
      : "Analyze how changes in key parameters affect the well's production rate and operating point.";

  return (
    <div
      className={cn(
        'mt-6 p-5 rounded-2xl',
        'bg-gradient-to-br from-blue-50/60 via-blue-50/40 to-blue-100/60',
        'dark:from-blue-950/30 dark:via-blue-900/20 dark:to-blue-800/30',
        'border border-blue-100/60 dark:border-blue-800/30',
        'backdrop-blur-sm shadow-sm shadow-blue-100/30 dark:shadow-blue-900/10',
        'animate-in slide-in-from-top-1 fade-in-0 duration-700'
      )}
    >
      <p
        className={cn(
          'text-sm leading-relaxed',
          'text-blue-800/90 dark:text-blue-200/90',
          'font-normal'
        )}
      >
        {message}
      </p>
    </div>
  );
};

export const NodalAnalysisStepper: React.FC = () => {
  const { activeSection, setActiveSection, completeness, iprInputs } =
    useAnalysisStore();

  const isIprReady = (iprInputs?.BOPD ?? 0) > 0 && (iprInputs?.Pr ?? 0) > 0;

  const tabStates = useMemo(() => {
    return tabs.map(tab => {
      const isActive = activeSection === tab.key;
      let isCompleted = false;
      let isDisabled = false;

      switch (tab.key) {
        case 'ipr':
          isCompleted = completeness.ipr || completeness.pvt;
          break;
        case 'pvt':
          isCompleted = completeness.pvt;
          isDisabled = !isIprReady;
          break;
        case 'hydraulics':
          isCompleted = completeness.hydraulics;
          isDisabled = !completeness.pvt;
          break;
        case 'results':
          isCompleted = completeness.results;
          isDisabled = !completeness.hydraulics;
          break;
        case 'correlations':
        case 'sensitivity':
          isDisabled = !completeness.hydraulics;
          break;
      }

      return { ...tab, isActive, isCompleted, isDisabled };
    });
  }, [activeSection, completeness, isIprReady]);

  return (
    <div
      className={cn(
        'w-full max-w-7xl mx-auto p-6 space-y-6',
        'bg-gradient-to-br from-gray-50/70 via-white/80 to-gray-100/70',
        'dark:from-gray-900/70 dark:via-gray-850/80 dark:to-gray-900/70',
        'rounded-3xl border border-gray-200/50 dark:border-gray-700/40',
        'shadow-lg shadow-gray-200/30 dark:shadow-gray-900/20',
        'backdrop-blur-sm'
      )}
    >
      {/* Main chevron container with Apple styling */}
      <div
        className={cn(
          'flex items-stretch w-full h-16',
          'bg-gradient-to-b from-gray-50/80 via-gray-100/60 to-gray-150/80',
          'dark:from-gray-800/60 dark:via-gray-750/80 dark:to-gray-800/60',
          'rounded-2xl border border-gray-200/30 dark:border-gray-700/30',
          'shadow-inner shadow-gray-100/40 dark:shadow-gray-800/40',
          'backdrop-blur-sm overflow-visible',
          'relative'
        )}
      >
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/10 to-transparent dark:via-gray-700/10 rounded-2xl" />

        {tabStates.map((tab, index) => (
          <ChevronTab
            key={tab.key}
            isActive={tab.isActive}
            isCompleted={tab.isCompleted}
            isDisabled={tab.isDisabled}
            isFirst={index === 0}
            isLast={index === tabStates.length - 1}
            onClick={() => !tab.isDisabled && setActiveSection(tab.key)}
          >
            <TabLabel
              isActive={tab.isActive}
              isCompleted={tab.isCompleted}
              isDisabled={tab.isDisabled}
              label={tab.label}
              shortLabel={tab.shortLabel}
            />
            {tab.isCompleted && <CompletionIcon />}
          </ChevronTab>
        ))}
      </div>

      <InfoBox activeSection={activeSection} />
    </div>
  );
};
