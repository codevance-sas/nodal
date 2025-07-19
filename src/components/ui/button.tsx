import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] active:transition-transform [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        filled:
          'bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:bg-primary/90 rounded-lg',
        tinted: 'bg-primary/10 text-primary hover:bg-primary/15 rounded-lg',
        plain: 'text-primary hover:bg-primary/8 rounded-lg',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:shadow-md hover:bg-destructive/90 rounded-lg',
        outline:
          'border border-border bg-card hover:bg-accent hover:text-accent-foreground rounded-lg',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto rounded-none',
        blue: 'bg-system-blue text-white shadow-sm hover:shadow-md hover:bg-system-blue/90 rounded-lg',
        green:
          'bg-system-green text-white shadow-sm hover:shadow-md hover:bg-system-green/90 rounded-lg',
        orange:
          'bg-system-orange text-white shadow-sm hover:shadow-md hover:bg-system-orange/90 rounded-lg',
        red: 'bg-system-red text-white shadow-sm hover:shadow-md hover:bg-system-red/90 rounded-lg',
      },
      size: {
        xs: 'h-7 px-3 text-caption-1 gap-1',
        sm: 'h-8 px-4 text-footnote gap-1.5',
        default: 'h-10 px-5 text-callout gap-2',
        lg: 'h-12 px-6 text-body gap-2.5',
        xl: 'h-14 px-8 text-headline gap-3',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
      roundness: {
        default: 'rounded-lg',
        sm: 'rounded-md',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'filled',
      size: 'default',
      roundness: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, roundness, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, roundness, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
