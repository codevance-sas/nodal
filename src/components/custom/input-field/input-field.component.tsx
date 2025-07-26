import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface InputFieldProps {
  name: string;
  label: string;
  value: number;
  unit?: string;
  onChange: (name: string, value: number) => void;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  value,
  unit,
  onChange,
  error,
  disabled = false,
  readOnly = false,
}) => {
  const [focused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const num = parseFloat(newValue);
    onChange(name, isNaN(num) ? 0 : num);
  };

  const hasValue = value > 0;
  const shouldShowFloatingLabel = focused || hasValue || inputValue !== '';

  return (
    <div className="space-y-2">
      <div className="relative group">
        <Label
          htmlFor={name}
          className={cn(
            'absolute left-3 transition-all duration-300 ease-apple pointer-events-none',
            'text-muted-foreground font-medium',
            shouldShowFloatingLabel
              ? 'top-2 text-xs text-system-blue dark:text-system-blue scale-90 origin-left'
              : 'top-1/2 -translate-y-1/2 text-sm'
          )}
        >
          {label}
          {unit && shouldShowFloatingLabel && (
            <span className="text-muted-foreground/70 ml-1">({unit})</span>
          )}
        </Label>

        <Input
          id={name}
          name={name}
          type="number"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            'h-12 pt-6 pb-2 px-3 transition-all duration-300 ease-apple',
            'bg-background border border-border/60 shadow-sm',
            'hover:border-border/80 hover:bg-muted/30 hover:shadow-md hover:shadow-black/5',
            'focus:border-system-blue focus:bg-background focus:shadow-lg focus:shadow-system-blue/10',
            'focus:ring-2 focus:ring-system-blue/30',
            'placeholder:text-transparent',
            error &&
              'border-system-red focus:border-system-red focus:ring-system-red/30',
            hasValue && !error && 'border-system-green/60 bg-system-green/5',
            (disabled || readOnly) &&
              'opacity-60 cursor-not-allowed bg-muted/30',
            'dark:bg-background/80 dark:border-border/40',
            'dark:hover:border-border/60 dark:hover:bg-background/90',
            'dark:focus:border-system-blue dark:focus:bg-background dark:focus:ring-system-blue/20'
          )}
          placeholder={label}
        />

        {unit && !shouldShowFloatingLabel && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">
            {unit}
          </span>
        )}

        {hasValue && !error && !disabled && (
          <div className="absolute right-3 top-2">
            <CheckCircle className="h-3 w-3 text-system-green" />
          </div>
        )}

        {error && (
          <div className="absolute right-3 top-2">
            <AlertTriangle className="h-3 w-3 text-system-red" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-system-red font-medium animate-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
};
