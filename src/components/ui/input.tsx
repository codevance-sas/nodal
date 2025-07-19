import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-lg border border-border bg-input px-4 py-3',
          'text-body placeholder:text-muted-foreground',
          'transition-all duration-200 ease-apple',
          'focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring focus:ring-opacity-60',
          'hover:border-border/80',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-system-gray5',
          'file:border-0 file:bg-transparent file:text-callout file:font-medium file:text-foreground',
          'dark:bg-system-gray4 dark:border-system-gray3',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
