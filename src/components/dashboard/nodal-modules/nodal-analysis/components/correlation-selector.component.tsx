'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { 
  Search,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Settings,
  FlaskConical,
  CheckCircle
} from 'lucide-react';

interface Correlation {
  id: string;
  name: string;
  description: string;
  best_for?: string;
}

interface CorrelationSelectorProps {
  correlations: Correlation[];
  selectedCorrelation: string;
  onSelectCorrelation: (correlationId: string) => void;
}

interface SectionColors {
  border: string;
  text: string;
  bg: string;
  accent: string;
  hover: string;
}

interface CorrelationOptionProps {
  correlation: Correlation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  sectionColors: SectionColors;
}

const CorrelationOption: React.FC<CorrelationOptionProps> = ({
  correlation,
  isSelected,
  onSelect,
  sectionColors,
}) => {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 ease-apple',
        'hover:shadow-md hover:-translate-y-0.5',
        isSelected
          ? cn('border-2 shadow-lg', sectionColors.border, sectionColors.bg)
          : 'border border-border/50 hover:border-border/80 bg-background/50'
      )}
      onClick={() => onSelect(correlation.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'mt-1 h-4 w-4 rounded-full border-2 transition-all duration-200',
            isSelected 
              ? cn('border-2', sectionColors.accent) 
              : 'border-border/60'
          )}>
            {isSelected && (
              <CheckCircle className="h-3 w-3 text-white -m-0.5" />
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <Label className={cn(
              'text-sm font-semibold cursor-pointer',
              isSelected ? sectionColors.text : 'text-foreground'
            )}>
              {correlation.name}
            </Label>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              {correlation.description}
            </p>
            
            {correlation.best_for && (
              <Badge 
                variant="secondary" 
                className={cn(
                  'text-xs',
                  isSelected && cn(sectionColors.bg, sectionColors.text)
                )}
              >
                {correlation.best_for}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CorrelationSelector: React.FC<CorrelationSelectorProps> = ({
  correlations,
  selectedCorrelation,
  onSelectCorrelation,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<{
    vertical: boolean;
    deviated: boolean;
    specialized: boolean;
  }>({
    vertical: true, // Vertical open by default
    deviated: false,
    specialized: false,
  });

  const handleChange = (correlationId: string) => {
    onSelectCorrelation(correlationId);
  };

  const toggleSection = (section: 'vertical' | 'deviated' | 'specialized') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Filter correlations based on search term
  const filteredCorrelations = (correlations || []).filter(
    (correlation) =>
      correlation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      correlation.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group correlations by type - memoized to prevent unnecessary recalculations
  const groupedCorrelations = useMemo(
    () => ({
      vertical: filteredCorrelations.filter(
        (c) =>
          c.id === 'hagedorn-brown' ||
          c.id === 'duns-ross' ||
          c.id === 'orkiszewski' ||
          c.id === 'ansari'
      ),
      deviated: filteredCorrelations.filter(
        (c) => c.id === 'beggs-brill' || c.id === 'mukherjee-brill'
      ),
      specialized: filteredCorrelations.filter(
        (c) =>
          c.id === 'chokshi' ||
          c.id === 'gray' ||
          c.id === 'aziz' ||
          c.id === 'hasan-kabir'
      ),
    }),
    [filteredCorrelations]
  );

  // Auto-expand sections when searching or when selected correlation is in a closed section
  useEffect(() => {
    // If searching, expand all sections
    if (searchTerm) {
      setExpandedSections({
        vertical: true,
        deviated: true,
        specialized: true,
      });
      return;
    }

    // Calculate which section contains the selected correlation
    const verticalIds = ['hagedorn-brown', 'duns-ross', 'orkiszewski', 'ansari'];
    const deviatedIds = ['beggs-brill', 'mukherjee-brill'];
    const specializedIds = ['chokshi', 'gray', 'aziz', 'hasan-kabir'];

    const selectedInVertical = verticalIds.includes(selectedCorrelation);
    const selectedInDeviated = deviatedIds.includes(selectedCorrelation);
    const selectedInSpecialized = specializedIds.includes(selectedCorrelation);

    // Only auto-expand if the selected correlation is in a currently closed section
    setExpandedSections((prev) => ({
      vertical: selectedInVertical && !prev.vertical ? true : prev.vertical,
      deviated: selectedInDeviated && !prev.deviated ? true : prev.deviated,
      specialized:
        selectedInSpecialized && !prev.specialized ? true : prev.specialized,
    }));
  }, [searchTerm, selectedCorrelation]);

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'vertical':
        return <TrendingUp className="h-4 w-4" />;
      case 'deviated':
        return <Settings className="h-4 w-4" />;
      case 'specialized':
        return <FlaskConical className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSectionColor = (section: string) => {
    switch (section) {
      case 'vertical':
        return {
          border: 'border-blue-600 dark:border-blue-400',
          text: 'text-blue-700 dark:text-blue-300',
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          accent: 'bg-blue-600 dark:bg-blue-400',
          hover: 'hover:border-blue-500 dark:hover:border-blue-300'
        };
      case 'deviated':
        return {
          border: 'border-cyan-600 dark:border-cyan-400',
          text: 'text-cyan-700 dark:text-cyan-300',
          bg: 'bg-cyan-50 dark:bg-cyan-950/30',
          accent: 'bg-cyan-600 dark:bg-cyan-400',
          hover: 'hover:border-cyan-500 dark:hover:border-cyan-300'
        };
      case 'specialized':
        return {
          border: 'border-slate-600 dark:border-slate-400',
          text: 'text-slate-700 dark:text-slate-300',
          bg: 'bg-slate-50 dark:bg-slate-950/30',
          accent: 'bg-slate-600 dark:bg-slate-400',
          hover: 'hover:border-slate-500 dark:hover:border-slate-300'
        };
      default:
        return {
          border: 'border-gray-600 dark:border-gray-400',
          text: 'text-gray-700 dark:text-gray-300',
          bg: 'bg-gray-50 dark:bg-gray-950/30',
          accent: 'bg-gray-600 dark:bg-gray-400',
          hover: 'hover:border-gray-500 dark:hover:border-gray-300'
        };
    }
  };

  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'vertical':
        return 'Vertical Flow';
      case 'deviated':
        return 'Deviated Wells';
      case 'specialized':
        return 'Specialized';
      default:
        return '';
    }
  };

  // If correlations not loaded yet, show loading state
  if (!correlations || correlations.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[200px] text-muted-foreground">
        <div className="text-sm">Loading correlation methods...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Search box */}
      {correlations.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search correlations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'pl-10 h-12 bg-background/50 border-border/40',
              'hover:border-border/60 focus:border-system-blue',
              'transition-all duration-200 ease-apple'
            )}
          />
        </div>
      )}

      {/* Correlations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vertical flow correlations */}
        {groupedCorrelations.vertical.length > 0 && (
          <div>
            <Collapsible
              open={expandedSections.vertical}
              onOpenChange={() => toggleSection('vertical')}
            >
              <CollapsibleTrigger asChild>
                <Card className={cn(
                  'cursor-pointer transition-all duration-200 ease-apple',
                  'hover:shadow-md border-2',
                  expandedSections.vertical 
                    ? cn('shadow-lg', getSectionColor('vertical').border) 
                    : cn('border-border/30', getSectionColor('vertical').hover)
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', getSectionColor('vertical').bg)}>
                          <div className={getSectionColor('vertical').text}>
                            {getSectionIcon('vertical')}
                          </div>
                        </div>
                        <div>
                          <Label className={cn('text-sm font-semibold', getSectionColor('vertical').text)}>
                            {getSectionTitle('vertical')}
                          </Label>
                          <Badge 
                            variant="secondary" 
                            className={cn('ml-2 h-5 text-xs', getSectionColor('vertical').bg, getSectionColor('vertical').text)}
                          >
                            {groupedCorrelations.vertical.length}
                          </Badge>
                        </div>
                      </div>
                      {expandedSections.vertical ? (
                        <ChevronUp className={cn('h-4 w-4', getSectionColor('vertical').text)} />
                      ) : (
                        <ChevronDown className={cn('h-4 w-4', getSectionColor('vertical').text)} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-4">
                {groupedCorrelations.vertical.map((correlation) => (
                  <CorrelationOption
                    key={correlation.id}
                    correlation={correlation}
                    isSelected={selectedCorrelation === correlation.id}
                    onSelect={handleChange}
                    sectionColors={getSectionColor('vertical')}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Deviated well correlations */}
        {groupedCorrelations.deviated.length > 0 && (
          <div>
            <Collapsible
              open={expandedSections.deviated}
              onOpenChange={() => toggleSection('deviated')}
            >
              <CollapsibleTrigger asChild>
                <Card className={cn(
                  'cursor-pointer transition-all duration-200 ease-apple',
                  'hover:shadow-md border-2',
                  expandedSections.deviated 
                    ? cn('shadow-lg', getSectionColor('deviated').border) 
                    : cn('border-border/30', getSectionColor('deviated').hover)
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', getSectionColor('deviated').bg)}>
                          <div className={getSectionColor('deviated').text}>
                            {getSectionIcon('deviated')}
                          </div>
                        </div>
                        <div>
                          <Label className={cn('text-sm font-semibold', getSectionColor('deviated').text)}>
                            {getSectionTitle('deviated')}
                          </Label>
                          <Badge 
                            variant="secondary" 
                            className={cn('ml-2 h-5 text-xs', getSectionColor('deviated').bg, getSectionColor('deviated').text)}
                          >
                            {groupedCorrelations.deviated.length}
                          </Badge>
                        </div>
                      </div>
                      {expandedSections.deviated ? (
                        <ChevronUp className={cn('h-4 w-4', getSectionColor('deviated').text)} />
                      ) : (
                        <ChevronDown className={cn('h-4 w-4', getSectionColor('deviated').text)} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-4">
                {groupedCorrelations.deviated.map((correlation) => (
                  <CorrelationOption
                    key={correlation.id}
                    correlation={correlation}
                    isSelected={selectedCorrelation === correlation.id}
                    onSelect={handleChange}
                    sectionColors={getSectionColor('deviated')}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Specialized correlations */}
        {groupedCorrelations.specialized.length > 0 && (
          <div>
            <Collapsible
              open={expandedSections.specialized}
              onOpenChange={() => toggleSection('specialized')}
            >
              <CollapsibleTrigger asChild>
                <Card className={cn(
                  'cursor-pointer transition-all duration-200 ease-apple',
                  'hover:shadow-md border-2',
                  expandedSections.specialized 
                    ? cn('shadow-lg', getSectionColor('specialized').border) 
                    : cn('border-border/30', getSectionColor('specialized').hover)
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', getSectionColor('specialized').bg)}>
                          <div className={getSectionColor('specialized').text}>
                            {getSectionIcon('specialized')}
                          </div>
                        </div>
                        <div>
                          <Label className={cn('text-sm font-semibold', getSectionColor('specialized').text)}>
                            {getSectionTitle('specialized')}
                          </Label>
                          <Badge 
                            variant="secondary" 
                            className={cn('ml-2 h-5 text-xs', getSectionColor('specialized').bg, getSectionColor('specialized').text)}
                          >
                            {groupedCorrelations.specialized.length}
                          </Badge>
                        </div>
                      </div>
                      {expandedSections.specialized ? (
                        <ChevronUp className={cn('h-4 w-4', getSectionColor('specialized').text)} />
                      ) : (
                        <ChevronDown className={cn('h-4 w-4', getSectionColor('specialized').text)} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-4">
                {groupedCorrelations.specialized.map((correlation) => (
                  <CorrelationOption
                    key={correlation.id}
                    correlation={correlation}
                    isSelected={selectedCorrelation === correlation.id}
                    onSelect={handleChange}
                    sectionColors={getSectionColor('specialized')}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

      {/* Show message if no correlations match search */}
      {filteredCorrelations.length === 0 && (
        <div className="flex justify-center items-center min-h-[200px] text-muted-foreground">
          <div className="text-sm">No correlations match your search.</div>
        </div>
      )}
    </div>
  );
}; 