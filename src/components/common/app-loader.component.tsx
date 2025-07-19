import { Loader2 } from 'lucide-react';

export const AppLoader = () => (
  <div className="flex items-center justify-center h-screen bg-system-gray6 dark:bg-system-gray6">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Loader2 className="h-12 w-12 animate-spin text-system-blue" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-system-blue/20 animate-pulse" />
      </div>
      <span className="text-callout text-system-blue font-medium">
        Loading...
      </span>
    </div>
  </div>
);
