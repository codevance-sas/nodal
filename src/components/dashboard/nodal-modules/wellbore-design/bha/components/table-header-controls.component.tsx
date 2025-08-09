import { FC, useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NumberInput } from '@mantine/core';
import { MetricCard } from './metric-card.component';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/use-debounce';

interface TableHeaderControlsProps {
  averageTubingJoints: number;
  isAverageTubingJointsVisible?: boolean;
  nameTable: string;
  netLength: number;
  onAddRow: () => void;
  onAverageTubingJointsChange: (value: number) => void;
  onRemoveSelected: () => void;
  onCopyToClipboard: () => void;
  selectedCount: number;
}

export const TableHeaderControls: FC<TableHeaderControlsProps> = ({
  nameTable,
  netLength,
  selectedCount,
  isAverageTubingJointsVisible = false,
  averageTubingJoints,
  onAddRow,
  onRemoveSelected,
  onCopyToClipboard,
  onAverageTubingJointsChange,
}) => {
  const [localValue, setLocalValue] = useState<number>(averageTubingJoints);

  const debouncedValue = useDebounce(localValue, 500);

  const formatTableName = (name: string): string => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  useEffect(() => {
    setLocalValue(averageTubingJoints);
  }, [averageTubingJoints]);

  useEffect(() => {
    if (debouncedValue !== averageTubingJoints) {
      const validatedValue =
        isNaN(debouncedValue) || debouncedValue < 0 ? 0 : debouncedValue;
      onAverageTubingJointsChange(validatedValue);
    }
  }, [debouncedValue, averageTubingJoints, onAverageTubingJointsChange]);

  const handleNumberInputChange = (val: number | '') => {
    const numericValue = Number(val);
    setLocalValue(numericValue);
  };

  return (
    <Card
      className="bg-card/50 backdrop-blur-sm border-border/50 mb-4 transition-all duration-200"
      role="toolbar"
      aria-label="Table controls and statistics"
    >
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <MetricCard
              icon={Calculator}
              label={`Net ${formatTableName(nameTable)} Length [ft]`}
              value={netLength.toFixed(2)}
              aria-label={`Net ${formatTableName(
                nameTable
              )} length: ${netLength.toFixed(2)} feet`}
            />

            {isAverageTubingJointsVisible && (
              <Card
                className="bg-background/80 border-border/50 transition-all duration-200 hover:bg-background/90 hover:border-border/70"
                aria-label="Average tubing joints input"
              >
                <CardContent className="flex items-center space-x-2 p-3">
                  <Calculator
                    className="h-4 w-4 text-system-blue flex-shrink-0"
                    aria-hidden="true"
                  />
                  <Label className="text-xs text-muted-foreground leading-tight">
                    Average Tubing Joints
                  </Label>
                  <NumberInput
                    value={localValue}
                    onChange={handleNumberInputChange}
                    placeholder="Avg Joints"
                    hideControls
                    precision={1}
                    styles={{
                      input: {
                        width: '80px',
                        height: '32px',
                        fontSize: '14px',
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)',
                        fontFamily: 'inherit',
                        '&:focus': {
                          borderColor: 'var(--primary)',
                        },
                      },
                    }}
                    aria-label="Enter average tubing joints value"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <div
            className="flex items-center gap-2"
            role="group"
            aria-label="Table actions"
          >
            <Button
              onClick={onCopyToClipboard}
              size="sm"
              variant="outline"
              className="transition-all duration-200 hover:scale-105"
              aria-label="Copy table data to clipboard as CSV"
            >
              <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
              Copy CSV
            </Button>

            <Button
              onClick={onAddRow}
              size="sm"
              className="transition-all duration-200 hover:scale-105"
              aria-label="Add new row to table"
            >
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Add Row
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onRemoveSelected}
              disabled={selectedCount === 0}
              className="transition-all duration-200 hover:scale-105"
              aria-label={`Remove ${selectedCount} selected rows`}
            >
              <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
              Remove Selected ({selectedCount})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
