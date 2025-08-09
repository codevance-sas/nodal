import {
  Box,
  Button,
  Group,
  MantineProvider,
  NumberInput,
  TextInput,
} from '@mantine/core';
import {
  MantineReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_Cell,
} from 'mantine-react-table';
import { useTheme } from 'next-themes';
import { nanoid } from 'nanoid';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  useMemo,
  useState,
  useCallback,
  useRef,
  type FC,
  type KeyboardEvent,
  useEffect,
} from 'react';

import { Button as ShadcnButton } from '@/components/ui/button';
import { TableHeaderControls } from './table-header-controls.component';

import { BhaRowData } from '@/core/nodal-modules/wellbore-design/types/bha-builder.type';
import { recalcProps } from '@/core/nodal-modules/wellbore-design/util/bha-recalc.util';
import { useBhaStore } from '@/store/nodal-modules/wellbore-design/use-bha.store';
import { Input } from '@/components/ui/input';

interface BhaBuilderTableProps {
  addRow: (row: BhaRowData) => void;
  averageTubingJoints: number;
  initialTop: number;
  isAverageTubingJointsVisible?: boolean;
  nameTable: string;
  options: string[];
  recalcTopBtm: (data: recalcProps) => BhaRowData[];
  rows: BhaRowData[];
  setAverageTubingJoints: (joints: number) => void;
  setInitialTop: (top: number) => void;
  setRows: (rows: BhaRowData[]) => void;
  validate: (rows: BhaRowData[]) => string[];
}

interface ValidationState {
  fieldErrors: Map<string, Set<keyof BhaRowData>>;
  rowErrors: Set<string>;
}

export const BhaBuilderTable: FC<BhaBuilderTableProps> = ({
  addRow,
  initialTop,
  nameTable,
  options,
  recalcTopBtm,
  rows,
  setRows,
  validate,
  isAverageTubingJointsVisible,
}) => {
  const { theme } = useTheme();
  const [drafts, setDrafts] = useState<Map<string, Partial<BhaRowData>>>(
    new Map()
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>({
    fieldErrors: new Map(),
    rowErrors: new Set(),
  });
  const { averageTubingJoints, setAverageTubingJoints } = useBhaStore();

  // Track which fields are being actively edited
  const [activeFields, setActiveFields] = useState<Set<string>>(new Set());

  // Automatically recalculate rows when averageTubingJoints changes
  useEffect(() => {
    if (rows.length > 0 && averageTubingJoints > 0) {
      // Check if any rows are tubing type
      const hasTubingRows = rows.some(
        row => row.type.toLowerCase() === 'tubing'
      );

      if (hasTubingRows) {
        // Trigger recalculation for tubing rows
        const recalculated = recalcTopBtm({
          rows,
          initialTop,
          drafts: new Map(),
          averageTubingJoints,
        });

        // Validate the recalculated rows
        const errors = validate(recalculated);
        if (errors.length === 0) {
          setRows(recalculated);
          updateValidationState(recalculated);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [averageTubingJoints]);

  // Debounce timers for each field
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const DEBOUNCE_DELAY = 500;

  /**
   * Checks if a value is complete and ready to be applied
   */
  const isValueComplete = (
    field: keyof BhaRowData,
    value: string | number | null
  ): boolean => {
    // For numeric fields, check if the value is a valid number
    if (['top', 'count', 'length', 'od', 'idVal', 'bottom'].includes(field)) {
      if (value === null || value === undefined) return false;
      const strValue = value.toString();

      if (strValue.endsWith('.')) return false;
      if (strValue === '-') return false;
      if (strValue === '') return false;

      const numValue = parseFloat(strValue);
      return !isNaN(numValue);
    }

    // For string fields, any value is considered complete
    return true;
  };

  /**
   * Clears debounce timer for a specific field
   * @param fieldKey - Unique key for the field (rowId:fieldName)
   */
  const clearDebounceTimer = useCallback((fieldKey: string) => {
    const timer = debounceTimers.current.get(fieldKey);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.current.delete(fieldKey);
    }
  }, []);

  /**
   * Clear all timers on unmount
   */
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  /**
   * Show toast when error occurs
   */
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error de validación',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error]);

  /**
   * Validates a single row and returns field-specific errors
   * @param row - The row to validate
   * @param allRows - All rows for context validation
   * @returns Map of field names to error messages
   */
  const validateRow = useCallback(
    (row: BhaRowData, allRows: BhaRowData[]): Map<keyof BhaRowData, string> => {
      const errors = new Map<keyof BhaRowData, string>();

      // Basic field validations
      if (row.count < 0) {
        errors.set('count', 'Count must be non-negative');
      }
      if (row.length < 0) {
        errors.set('length', 'Length must be non-negative');
      }
      if (row.od < 0) {
        errors.set('od', 'Outer diameter must be non-negative');
      }
      if (row.idVal < 0) {
        errors.set('idVal', 'Inner diameter must be non-negative');
      }
      if (row.od > 0 && row.idVal > 0 && row.od <= row.idVal) {
        errors.set('od', 'Outer diameter must be greater than inner diameter');
        errors.set('idVal', 'Inner diameter must be less than outer diameter');
      }
      if (row.top < 0) {
        errors.set('top', 'Top depth must be non-negative');
      }
      if (row.bottom < row.top) {
        errors.set('bottom', 'Bottom depth must be greater than top depth');
      }

      // Check for overlaps with other rows
      const overlappingRows = allRows.filter(
        r =>
          r.id !== row.id &&
          ((r.top <= row.top && r.bottom > row.top) ||
            (r.top < row.bottom && r.bottom >= row.bottom) ||
            (r.top >= row.top && r.bottom <= row.bottom))
      );

      if (overlappingRows.length > 0) {
        errors.set('top', 'Depth range overlaps with other components');
        errors.set('bottom', 'Depth range overlaps with other components');
      }

      return errors;
    },
    []
  );

  /**
   * Updates validation state for all rows
   * @param rowsToValidate - Rows to validate
   */
  const updateValidationState = useCallback(
    (rowsToValidate: BhaRowData[]) => {
      const fieldErrors = new Map<string, Set<keyof BhaRowData>>();
      const rowErrors = new Set<string>();

      rowsToValidate.forEach(row => {
        const rowFieldErrors = validateRow(row, rowsToValidate);
        if (rowFieldErrors.size > 0) {
          const errorFields = new Set<keyof BhaRowData>();
          rowFieldErrors.forEach((_, field) => errorFields.add(field));
          fieldErrors.set(row.id, errorFields);
          rowErrors.add(row.id);
        }
      });

      setValidationState({ fieldErrors, rowErrors });
    },
    [validateRow]
  );

  /**
   * Applies draft changes to a row with validation
   * @param id - Row ID
   */
  const applyDraft = useCallback(
    (id: string, forceApply: boolean = false) => {
      const draft = drafts.get(id);
      if (!draft || Object.keys(draft).length === 0) return;

      // Don't apply if any field for this row is being actively edited (unless forced)
      if (!forceApply) {
        const isAnyFieldActive = Array.from(activeFields).some(fieldKey =>
          fieldKey.startsWith(`${id}:`)
        );
        if (isAnyFieldActive) return;
      }

      // Check if all draft values are complete
      const allValuesComplete = Object.entries(draft).every(([field, value]) =>
        isValueComplete(field as keyof BhaRowData, value)
      );

      // Don't apply if values are incomplete (unless forced)
      if (!allValuesComplete && !forceApply) return;

      // Create updated rows with draft values
      const updatedRows = rows.map(row => {
        if (row.id !== id) return row;

        // Merge draft values
        const updatedRow = { ...row };

        // Apply draft values
        if (draft.type !== undefined) updatedRow.type = draft.type;
        if (draft.top !== undefined) updatedRow.top = draft.top;
        if (draft.count !== undefined) updatedRow.count = draft.count;
        if (draft.length !== undefined) updatedRow.length = draft.length;
        if (draft.od !== undefined) updatedRow.od = draft.od;
        if (draft.idVal !== undefined) updatedRow.idVal = draft.idVal;
        if (draft.desc !== undefined) updatedRow.desc = draft.desc;

        // Handle bottom field specially
        if (draft.bottom !== undefined) {
          updatedRow.bottom = draft.bottom;
          // Recalculate length if count > 0
          if (updatedRow.count > 0) {
            updatedRow.length =
              (updatedRow.bottom - updatedRow.top) / updatedRow.count;
          }
        } else {
          // Calculate bottom based on count and length
          updatedRow.bottom =
            updatedRow.top + updatedRow.count * updatedRow.length;
        }

        return updatedRow;
      });

      // Apply recalculation
      const recalculated = recalcTopBtm({
        rows: updatedRows,
        initialTop,
        drafts: new Map(),
        averageTubingJoints,
      });

      // Validate
      const errors = validate(recalculated);

      if (errors.length > 0) {
        setError(errors.join('; '));
        updateValidationState(recalculated);
      } else {
        setRows(recalculated);
        // Clear draft for this row after successful application
        setDrafts(prev => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        setError(null);
        updateValidationState(recalculated);
      }
    },
    [
      activeFields,
      averageTubingJoints,
      drafts,
      initialTop,
      recalcTopBtm,
      rows,
      setRows,
      updateValidationState,
      validate,
    ]
  );

  /**
   * Handles focus events to track active fields
   */
  const handleFocus = useCallback((rowId: string, field: keyof BhaRowData) => {
    setActiveFields(prev => {
      const next = new Set(prev);
      next.add(`${rowId}:${field}`);
      return next;
    });
  }, []);

  /**
   * Handles blur events to untrack active fields
   */
  const handleBlur = useCallback(
    (rowId: string, field: keyof BhaRowData) => {
      setActiveFields(prev => {
        const next = new Set(prev);
        next.delete(`${rowId}:${field}`);
        return next;
      });

      // Apply draft immediately on blur if value is complete
      const draft = drafts.get(rowId);
      if (draft && draft[field] !== undefined) {
        if (isValueComplete(field, draft[field])) {
          // Small delay to ensure blur completes
          setTimeout(() => applyDraft(rowId, true), 50);
        }
      }
    },
    [drafts, applyDraft]
  );

  /**
   * Handles keyboard events for Tab and Enter
   * @param e - Keyboard event
   * @param id - Row ID
   * @param field - Field key
   */
  const handleKeyDown = useCallback(
    (
      e: KeyboardEvent<HTMLInputElement>,
      id: string,
      field: keyof BhaRowData
    ) => {
      if (e.key === 'Tab' || e.key === 'Enter') {
        const fieldKey = `${id}:${field}`;
        clearDebounceTimer(fieldKey);

        // Apply current draft immediately
        setTimeout(() => applyDraft(id), 0);

        // Don't prevent default for Tab to allow normal navigation
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      }
    },
    [clearDebounceTimer, applyDraft]
  );

  /**
   * Handles change of a specific field in a draft row with debouncing
   */
  const handleFieldChange = useCallback(
    (id: string, field: keyof BhaRowData, value: string | number | null) => {
      const fieldKey = `${id}:${field}`;

      // Clear existing timer for this field
      clearDebounceTimer(fieldKey);

      // Update draft immediately for UI responsiveness
      setDrafts(prev => {
        const next = new Map(prev);
        const existing = next.get(id) || {};
        next.set(id, { ...existing, [field]: value });
        return next;
      });

      // Only set debounce timer if value is complete
      if (isValueComplete(field, value)) {
        const timer = setTimeout(() => {
          applyDraft(id);
          debounceTimers.current.delete(fieldKey);
        }, DEBOUNCE_DELAY);

        debounceTimers.current.set(fieldKey, timer);
      }
    },
    [clearDebounceTimer, applyDraft]
  );

  /**
   * Adds a new row to the table
   */
  const addLocalRow = useCallback(() => {
    const top = rows.length > 0 ? rows[rows.length - 1].bottom : initialTop;
    const newRow: BhaRowData = {
      id: nanoid(),
      type: '',
      top,
      count: 1,
      length: 0,
      bottom: top,
      idVal: 0,
      od: 0,
      desc: '',
    };
    addRow(newRow);
  }, [rows, initialTop, addRow]);

  /**
   * Removes a row by ID
   */
  const removeRow = useCallback(
    (id: string) => {
      // Clear any pending timers for this row
      Array.from(debounceTimers.current.keys())
        .filter(key => key.startsWith(`${id}:`))
        .forEach(key => clearDebounceTimer(key));

      // Clear active fields for this row
      setActiveFields(prev => {
        const next = new Set(prev);
        Array.from(next)
          .filter(key => key.startsWith(`${id}:`))
          .forEach(key => next.delete(key));
        return next;
      });

      const newRows = rows.filter(row => row.id !== id);
      const recalc = recalcTopBtm({
        rows: newRows,
        initialTop,
        drafts: new Map(),
        averageTubingJoints,
      });

      setRows(recalc);
      setDrafts(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      updateValidationState(recalc);
    },
    [
      averageTubingJoints,
      rows,
      initialTop,
      recalcTopBtm,
      setRows,
      clearDebounceTimer,
      updateValidationState,
    ]
  );

  /**
   * Removes the selected rows by their IDs
   */
  const removeSelected = useCallback(() => {
    // Clear any pending timers for selected rows
    selected.forEach(id => {
      Array.from(debounceTimers.current.keys())
        .filter(key => key.startsWith(`${id}:`))
        .forEach(key => clearDebounceTimer(key));
    });

    // Clear active fields for selected rows
    setActiveFields(prev => {
      const next = new Set(prev);
      selected.forEach(id => {
        Array.from(next)
          .filter(key => key.startsWith(`${id}:`))
          .forEach(key => next.delete(key));
      });
      return next;
    });

    const filtered = rows.filter(r => !selected.has(r.id));
    const recalc = recalcTopBtm({
      rows: filtered,
      initialTop,
      drafts: new Map(),
      averageTubingJoints,
    });

    setRows(recalc);
    setSelected(new Set());
    updateValidationState(recalc);
  }, [
    averageTubingJoints,
    selected,
    rows,
    initialTop,
    recalcTopBtm,
    setRows,
    clearDebounceTimer,
    updateValidationState,
  ]);

  /**
   * Handles select all / deselect all functionality
   */
  const handleSelectAll = useCallback(() => {
    if (selected.size === rows.length) {
      // If all rows are selected, deselect all
      setSelected(new Set());
    } else {
      // Otherwise, select all rows
      setSelected(new Set(rows.map(row => row.id)));
    }
  }, [selected.size, rows]);

  /**
   * Determines if all rows are selected
   */
  const isAllSelected = useMemo(() => {
    return rows.length > 0 && selected.size === rows.length;
  }, [selected.size, rows.length]);

  /**
   * Determines if some (but not all) rows are selected
   */
  const isIndeterminate = useMemo(() => {
    return selected.size > 0 && selected.size < rows.length;
  }, [selected.size, rows.length]);

  /**
   * Computes net length of BHA accounting for overlaps
   */
  const calculateNetLength = useMemo(() => {
    if (rows.length === 0) return 0;
    const intervals = rows
      .map(row => [row.top, row.bottom] as [number, number])
      .sort((a, b) => a[0] - b[0]);

    let netLength = 0;
    let [currentStart, currentEnd] = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
      const [start, end] = intervals[i];
      if (start <= currentEnd) {
        currentEnd = Math.max(currentEnd, end);
      } else {
        netLength += currentEnd - currentStart;
        [currentStart, currentEnd] = [start, end];
      }
    }
    netLength += currentEnd - currentStart;
    return netLength;
  }, [rows]);

  /**
   * Checks if a field has validation errors
   * @param rowId - Row ID
   * @param field - Field name
   * @returns True if field has errors
   */
  const hasFieldError = useCallback(
    (rowId: string, field: keyof BhaRowData): boolean => {
      return validationState.fieldErrors.get(rowId)?.has(field) ?? false;
    },
    [validationState.fieldErrors]
  );

  /**
   * Gets error message for a specific field
   * @param rowId - Row ID
   * @param field - Field name
   * @returns Error message or empty string
   */
  const getFieldErrorMessage = useCallback(
    (rowId: string, field: keyof BhaRowData): string => {
      const row = rows.find(r => r.id === rowId);
      if (!row) return '';

      const rowErrors = validateRow(row, rows);
      return rowErrors.get(field) || '';
    },
    [rows, validateRow]
  );

  /**
   * Helper to get current value (draft or original)
   */
  const getCurrentValue = useCallback(
    (rowId: string, field: keyof BhaRowData) => {
      const draft = drafts.get(rowId);
      const row = rows.find(r => r.id === rowId);
      if (!row) return '';

      if (draft && draft[field] !== undefined) {
        return draft[field];
      }
      return row[field];
    },
    [drafts, rows]
  );

  // Memoized input styles based on theme
  const getInputStyles = useMemo(() => {
    const isLight = theme === 'light';

    return (hasError: boolean) => ({
      input: {
        backgroundColor: isLight ? '#ffffff' : 'var(--mantine-color-dark-7)',
        borderColor: hasError
          ? '#ef4444'
          : isLight
          ? 'var(--mantine-color-gray-3)'
          : 'var(--mantine-color-dark-4)',
        color: isLight
          ? 'var(--mantine-color-dark-9)'
          : 'var(--mantine-color-gray-0)',
        fontSize: '14px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '8px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:focus': {
          borderColor: '#3B82F6',
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
          backgroundColor: isLight ? '#f8f9fa' : 'var(--mantine-color-dark-6)',
        },
        '&:hover': {
          borderColor: isLight
            ? 'var(--mantine-color-gray-4)'
            : 'var(--mantine-color-dark-3)',
          backgroundColor: isLight ? '#f8f9fa' : 'var(--mantine-color-dark-6)',
        },
      },
    });
  }, [theme]);

  // Columns definition with enhanced validation feedback
  const columns: MRT_ColumnDef<BhaRowData>[] = [
    {
      id: 'select',
      header: 'Select',
      Header: () => (
         <div className="flex items-center justify-center w-full h-full">
           <Checkbox
             checked={isIndeterminate ? 'indeterminate' : isAllSelected}
             onCheckedChange={handleSelectAll}
           />
         </div>
       ),
      Cell: ({ row }: MRT_Cell<BhaRowData>) => {
        console.log('[BhaBuilderTable.select] row', row);
        return (
          <div className="flex items-center justify-center w-full h-full">
            <Checkbox
              checked={selected.has(row.original.id)}
              onCheckedChange={checked => {
                const next = new Set(selected);
                if (checked) next.add(row.original.id);
                else next.delete(row.original.id);
                setSelected(next);
              }}
            />
          </div>
        );
      },
      enableSorting: false,
      size: 25,
    },
    {
      accessorKey: 'type',
      header: 'TYPE',
      size: 50,
      Cell: ({ row }: MRT_Cell<BhaRowData>) => (
        <Select
          value={getCurrentValue(row.original.id, 'type') as string}
          onValueChange={value => {
            handleFieldChange(row.original.id, 'type', value || '');
          }}
          onOpenChange={open => {
            if (open) handleFocus(row.original.id, 'type');
            else handleBlur(row.original.id, 'type');
          }}
        >
          <SelectTrigger
            className={`w-[100px] h-8 ${
              hasFieldError(row.original.id, 'type') ? 'border-red-500' : ''
            }`}
          >
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="z-[1300]">
            {options.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'top',
      header: 'TOP [ft]',
      size: 50,
      Cell: ({ row }: MRT_Cell<BhaRowData>) => (
        <NumberInput
          disabled={row.index === 0}
          hideControls
          value={getCurrentValue(row.original.id, 'top') as number}
          onChange={val => handleFieldChange(row.original.id, 'top', val ?? 0)}
          onFocus={() => handleFocus(row.original.id, 'top')}
          onBlur={() => handleBlur(row.original.id, 'top')}
          onKeyDown={e => handleKeyDown(e, row.original.id, 'top')}
          precision={2}
          error={hasFieldError(row.original.id, 'top')}
          styles={getInputStyles(hasFieldError(row.original.id, 'top'))}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'count',
      header: 'COUNT',
      size: 50,
      Cell: ({ row }: MRT_Cell<BhaRowData>) => (
        <NumberInput
          hideControls
          value={getCurrentValue(row.original.id, 'count') as number}
          onChange={val =>
            handleFieldChange(row.original.id, 'count', val ?? 0)
          }
          onFocus={() => handleFocus(row.original.id, 'count')}
          onBlur={() => handleBlur(row.original.id, 'count')}
          onKeyDown={e => handleKeyDown(e, row.original.id, 'count')}
          precision={0}
          error={hasFieldError(row.original.id, 'count')}
          styles={getInputStyles(hasFieldError(row.original.id, 'count'))}
        />
      ),
    },
    {
      accessorKey: 'length',
      header: 'L [ft]',
      size: 50,
      Cell: ({ row }: MRT_Cell<BhaRowData>) => (
        <NumberInput
          hideControls
          value={getCurrentValue(row.original.id, 'length') as number}
          onChange={val =>
            handleFieldChange(row.original.id, 'length', val ?? 0)
          }
          onFocus={() => handleFocus(row.original.id, 'length')}
          onBlur={() => handleBlur(row.original.id, 'length')}
          onKeyDown={e => handleKeyDown(e, row.original.id, 'length')}
          precision={2}
          error={hasFieldError(row.original.id, 'length')}
          styles={getInputStyles(hasFieldError(row.original.id, 'length'))}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'od',
      header: 'OD [in]',
      size: 50,
      Cell: ({ row }: MRT_Cell<BhaRowData>) => (
        <NumberInput
          hideControls
          value={getCurrentValue(row.original.id, 'od') as number}
          onChange={val => handleFieldChange(row.original.id, 'od', val ?? 0)}
          onFocus={() => handleFocus(row.original.id, 'od')}
          onBlur={() => handleBlur(row.original.id, 'od')}
          onKeyDown={e => handleKeyDown(e, row.original.id, 'od')}
          precision={2}
          error={hasFieldError(row.original.id, 'od')}
          styles={getInputStyles(hasFieldError(row.original.id, 'od'))}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'idVal',
      header: 'ID [in]',
      size: 50,
      Cell: ({ row }: MRT_Cell<BhaRowData>) => (
        <NumberInput
          hideControls
          value={getCurrentValue(row.original.id, 'idVal') as number}
          onChange={val =>
            handleFieldChange(row.original.id, 'idVal', val ?? 0)
          }
          onFocus={() => handleFocus(row.original.id, 'idVal')}
          onBlur={() => handleBlur(row.original.id, 'idVal')}
          onKeyDown={e => handleKeyDown(e, row.original.id, 'idVal')}
          precision={2}
          error={hasFieldError(row.original.id, 'idVal')}
          styles={getInputStyles(hasFieldError(row.original.id, 'idVal'))}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'bottom',
      header: 'BTM [ft]',
      size: 50,
      Cell: ({ row }: MRT_Cell<BhaRowData>) => (
        <NumberInput
          hideControls
          value={getCurrentValue(row.original.id, 'bottom') as number}
          onChange={val =>
            handleFieldChange(row.original.id, 'bottom', val ?? 0)
          }
          onFocus={() => handleFocus(row.original.id, 'bottom')}
          onBlur={() => handleBlur(row.original.id, 'bottom')}
          onKeyDown={e => handleKeyDown(e, row.original.id, 'bottom')}
          precision={2}
          error={hasFieldError(row.original.id, 'bottom')}
          styles={getInputStyles(hasFieldError(row.original.id, 'bottom'))}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'desc',
      header: 'DESC',
      size: 50,
      Cell: ({ row }: MRT_Cell<BhaRowData>) => (
        <TextInput
          value={getCurrentValue(row.original.id, 'desc') as string}
          onChange={e =>
            handleFieldChange(row.original.id, 'desc', e.currentTarget.value)
          }
          onFocus={() => handleFocus(row.original.id, 'desc')}
          onBlur={() => handleBlur(row.original.id, 'desc')}
          onKeyDown={e => handleKeyDown(e, row.original.id, 'desc')}
          styles={getInputStyles(hasFieldError(row.original.id, 'desc'))}
        />
      ),
      enableSorting: false,
    },
    {
      header: 'Actions',
      size: 100,
      Cell: ({ row }: MRT_Cell<BhaRowData>) => (
        <Group>
          <Button
            compact
            color="red"
            onClick={() => removeRow(row.original.id)}
            styles={{
              root: {
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#ef4444',
                color: '#ef4444',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                borderRadius: '8px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: '#ef4444',
                  color: 'white',
                  transform: 'translateY(-1px)',
                  boxShadow:
                    theme === 'light'
                      ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                      : '0 4px 12px rgba(239, 68, 68, 0.3)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            Remove
          </Button>
        </Group>
      ),
      enableSorting: false,
    },
  ].map(
    (column: any) =>
      ({
        ...column,
        enableSorting: false,
        mantineTableHeadCellProps: {
          align: 'center',
        },
        ...(column.id === 'select' ? {} : { minSize: 120 }),
      } as MRT_ColumnDef<BhaRowData>)
  );

  return (
    <div className="w-full h-[100%] overflow-auto transition-colors duration-200 bg-background rounded-xl p-0">
      {/* Header Controls - Improved with reusable components */}
      <TableHeaderControls
        nameTable={nameTable}
        netLength={calculateNetLength}
        selectedCount={selected.size}
        isAverageTubingJointsVisible={isAverageTubingJointsVisible}
        averageTubingJoints={averageTubingJoints}
        onAddRow={addLocalRow}
        onRemoveSelected={removeSelected}
        onAverageTubingJointsChange={setAverageTubingJoints}
      />

      <div className="backdrop-blur-sm rounded-xl overflow-hidden shadow-xl transition-colors duration-200 bg-card border border-border">
        <MantineProvider
          theme={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
        >
          <MantineReactTable
            autoResetPageIndex={false}
            columns={columns}
            data={rows}
            enableRowOrdering
            enableTopToolbar={false}
            enableColumnActions={false}
            enablePagination={false}
            enableBottomToolbar={false}
            mantineRowDragHandleProps={({ table }) => ({
              onDragEnd: () => {
                const { draggingRow, hoveredRow } = table.getState();
                if (draggingRow && hoveredRow) {
                  setActiveFields(new Set());
                  debounceTimers.current.forEach(timer => clearTimeout(timer));
                  debounceTimers.current.clear();

                  const newData = [...rows];
                  newData.splice(
                    (hoveredRow as MRT_Row<BhaRowData>).index,
                    0,
                    newData.splice(draggingRow.index, 1)[0]
                  );
                  const recalc = recalcTopBtm({
                    rows: newData,
                    initialTop,
                    drafts: new Map(),
                    averageTubingJoints,
                  });
                  const errors = validate(recalc);
                  if (errors.length > 0) {
                    setError(errors.join('; '));
                  } else {
                    setRows(recalc);
                    setError(null);
                  }
                  updateValidationState(recalc);
                }
              },
            })}
            mantineTableProps={{
              highlightOnHover: true,
              withColumnBorders: true,
              striped: false,
            }}
          />
        </MantineProvider>
      </div>
    </div>
  );
};
