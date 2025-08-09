'use client';

import { Quote } from 'lucide-react';

interface InspirationalQuoteProps {
  className?: string;
}

export const InspirationalQuote = ({ className }: InspirationalQuoteProps) => {
  return (
    <blockquote 
      className={`relative px-4 py-3 mb-4 ${className}`}
      role="complementary"
      aria-label="Inspirational quote"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent rounded-lg" />
      
      {/* Quote icon */}
      <div className="relative flex items-start gap-3">
        <Quote 
          className="h-4 w-4 text-primary/60 mt-1 flex-shrink-0" 
          aria-hidden="true"
        />
        
        {/* Quote content */}
        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed text-sidebar-foreground/90 italic">
            Every well has a story - engineer one worth telling.
          </p>
          
          {/* Subtle accent line */}
          <div className="mt-2 h-px bg-gradient-to-r from-primary/20 via-primary/40 to-transparent" />
        </div>
      </div>
    </blockquote>
  );
};
