import { FC, useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Plus, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { casingStandardLibrary } from '@/core/nodal-modules/wellbore-design/constants/bha-type-options.constant';
import { BhaRowData } from '@/core/nodal-modules/wellbore-design/types/bha-builder.type';

interface SearchableDropdownProps {
  onSelect: (standard: BhaRowData) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableDropdown: FC<SearchableDropdownProps> = ({
  onSelect,
  placeholder = `Search casing standards (${casingStandardLibrary.length} categories available)`,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter categories based on search term and flatten options for display
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      // Return all categories when no search term
      return casingStandardLibrary.map(category => ({
        ...category,
        isCategory: true,
        displayOptions: expandedCategories.has(category.type) ? category.options : []
      }));
    }

    const term = searchTerm.toLowerCase();
    // Filter categories by type name
    return casingStandardLibrary
      .filter(category => category.type.toLowerCase().includes(term))
      .map(category => ({
        ...category,
        isCategory: true,
        displayOptions: category.options // Show all options when searching
      }));
  }, [searchTerm, expandedCategories]);

  // Create a flat list for keyboard navigation
  const flattenedItems = useMemo(() => {
    const items: Array<{ type: 'category' | 'option'; data: any; categoryType?: string }> = [];
    
    filteredData.forEach(category => {
      items.push({ type: 'category', data: category });
      if (category.displayOptions.length > 0) {
        category.displayOptions.forEach(option => {
          items.push({ type: 'option', data: option, categoryType: category.type });
        });
      }
    });
    
    return items;
  }, [filteredData]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < flattenedItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : flattenedItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && flattenedItems[selectedIndex]) {
            const selectedItem = flattenedItems[selectedIndex];
            if (selectedItem.type === 'category') {
              handleCategoryToggle(selectedItem.data.type);
            } else if (selectedItem.type === 'option') {
              handleSelect(selectedItem.data);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, flattenedItems]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: BhaRowData) => {
    onSelect(option);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    setExpandedCategories(new Set()); // Reset expanded categories after selection
    inputRef.current?.blur();
  };

  const handleCategoryToggle = (categoryType: string) => {
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

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setIsOpen(true);
    setSelectedIndex(-1);
    // Auto-expand all categories when searching
    if (value.trim()) {
      setExpandedCategories(new Set(casingStandardLibrary.map(cat => cat.type)));
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-10 pr-10 h-8"
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredData.length > 0 ? (
            <div className="py-1">
              {flattenedItems.map((item, index) => {
                if (item.type === 'category') {
                  const category = item.data;
                  const isExpanded = expandedCategories.has(category.type);
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <div
                      key={`category-${category.type}`}
                      className={`px-3 py-2 cursor-pointer transition-colors duration-150 border-b border-border/50 ${
                        isSelected
                          ? 'bg-system-blue/10 text-system-blue'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleCategoryToggle(category.type)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChevronRight 
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-90' : ''
                            }`} 
                          />
                          <span className="font-medium text-foreground text-sm">
                            {category.type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {category.options.length} options
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Option item
                  const option = item.data;
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <div
                      key={`option-${option.id}`}
                      className={`pl-8 pr-3 py-2 cursor-pointer transition-colors duration-150 border-b border-border/50 last:border-b-0 ${
                        isSelected
                          ? 'bg-system-blue/10 text-system-blue'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground text-sm">
                              {option.type}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              L: {option.length} [ft]
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            OD: {option.od}" • ID: {option.idVal}"
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground ml-2" />
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          ) : (
            <div className="px-3 py-3 text-center text-muted-foreground">
              <Search className="h-6 w-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No results found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
