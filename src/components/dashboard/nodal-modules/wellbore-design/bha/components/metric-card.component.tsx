import { FC, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value?: string | number;
  children?: ReactNode;
  className?: string;
  'aria-label'?: string;
}

export const MetricCard: FC<MetricCardProps> = ({
  icon: Icon,
  label,
  value,
  children,
  className,
  'aria-label': ariaLabel,
}) => {
  return (
    <Card
      className={cn(
        'bg-background/80 border-border/50 transition-all duration-200 hover:bg-background/90 hover:border-border/70',
        className
      )}
      aria-label={ariaLabel || `${label} metric`}
    >
      <CardContent className="flex items-center space-x-2 p-3">
        <Icon 
          className="h-4 w-4 text-system-blue flex-shrink-0" 
          aria-hidden="true"
        />
        <div className="flex flex-col space-y-1 min-w-0 flex-1">
          <Label className="text-xs text-muted-foreground leading-tight">
            {label}
          </Label>
          {value !== undefined ? (
            <Badge 
              variant="secondary" 
              className="font-mono font-bold w-fit"
              role="status"
              aria-live="polite"
            >
              {value}
            </Badge>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
};