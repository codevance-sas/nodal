import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-system-gray5 dark:bg-system-gray4',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
