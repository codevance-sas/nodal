'use client';
import { FC, useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { casingStandardLibrary } from '@/core/nodal-modules/wellbore-design/constants/bha-type-options.constant';

interface CasingSizeDropdownProps {
  value: string;
  onChange: (od: number, idVal: number, size: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  hasError?: boolean;
}

export const CasingSizeDropdown: FC<CasingSizeDropdownProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  hasError = false,
}) => {
  // State for tracking expanded categories (accordion functionality)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Flatten all casing standards for value validation
  const allStandards = useMemo(() => {
    return casingStandardLibrary.flatMap(category =>
      category.options.map(option => ({
        ...option,
        categoryType: category.type,
      }))
    );
  }, []);

  const handleValueChange = (selectedSize: string) => {
    const selectedStandard = allStandards.find(
      standard => standard.type === selectedSize
    );
    if (selectedStandard) {
      onChange(
        selectedStandard.od,
        selectedStandard.idVal,
        selectedStandard.type
      );
    }
  };

  // Create array of valid size values for validation (same pattern as TYPE dropdown)
  const validSizeValues = useMemo(
    () => allStandards.map(option => option.type),
    [allStandards]
  );

  // Validate current value exists in options (same pattern as TYPE dropdown)
  const validValue = validSizeValues.includes(value) ? value : '';

  // Handle category toggle (accordion functionality)
  const handleCategoryToggle = (
    categoryType: string,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryType)) {
        newSet.delete(categoryType);
      } else {
        newSet.add(categoryType);
      }
      return newSet;
    });
  };

  return (
    <Select
      value={validValue}
      onValueChange={handleValueChange}
      onOpenChange={open => {
        if (open) onFocus();
        else onBlur();
      }}
    >
      <SelectTrigger
        className={`w-[120px] h-8 text-xs ${hasError ? 'border-red-500' : ''}`}
      >
        <SelectValue placeholder="Select size" />
      </SelectTrigger>
      <SelectContent className="z-[1300] max-h-48">
        {casingStandardLibrary.map(category => {
          const isExpanded = expandedCategories.has(category.type);

          return (
            <div key={category.type}>
              {/* Category Header (Accordion Toggle) */}
              <div
                className="px-3 py-2 cursor-pointer transition-colors duration-150 border-b border-border/50 hover:bg-muted/50"
                onClick={e => handleCategoryToggle(category.type, e)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronRight
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="font-medium text-foreground text-xs">
                      {category.type}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {category.options.length} options
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Category Options (Collapsible) */}
              {isExpanded &&
                category.options.map(option => (
                  <SelectItem
                    key={option.type}
                    value={option.type}
                    className="text-xs pl-8 pr-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        OD: {option.od}" • ID: {option.idVal}"
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </div>
          );
        })}
      </SelectContent>
    </Select>
  );
};
