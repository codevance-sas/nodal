import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface SurveyDataPoint {
  id: string;
  md: number; // Measured Depth
  tvd: number; // True Vertical Depth
  inclination: number; // Inclination in degrees
}

export interface SurveyValidationError {
  row: number;
  field: string;
  message: string;
}

export interface SurveyFileInfo {
  name: string;
  size: number;
  lastModified: Date;
  type: string;
}

export interface SurveyDataState {
  // Data state
  surveyData: SurveyDataPoint[];
  originalData: SurveyDataPoint[];

  // File management
  fileInfo: SurveyFileInfo | null;
  isFileLoaded: boolean;

  // UI state
  isLoading: boolean;
  isProcessing: boolean;
  showUploadModal: boolean;
  useDefaultValues: boolean;

  // Validation
  validationErrors: SurveyValidationError[];
  isValid: boolean;

  // Upload progress
  uploadProgress: number;

  // Actions
  setSurveyData: (data: SurveyDataPoint[]) => void;
  setFileInfo: (info: SurveyFileInfo) => void;
  setLoading: (loading: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setShowUploadModal: (show: boolean) => void;
  setUseDefaultValues: (useDefault: boolean) => void;
  setValidationErrors: (errors: SurveyValidationError[]) => void;
  setUploadProgress: (progress: number) => void;

  // Data manipulation
  addSurveyPoint: (point: Omit<SurveyDataPoint, 'id'>) => void;
  updateSurveyPoint: (id: string, updates: Partial<SurveyDataPoint>) => void;
  deleteSurveyPoint: (id: string) => void;
  clearSurveyData: () => void;

  // Validation
  validateSurveyData: () => boolean;

  // Default values
  loadDefaultValues: () => void;

  // File processing
  processExcelFile: (file: File) => Promise<void>;

  // Export
  exportToExcel: () => Promise<void>;

  // Reset
  reset: () => void;

  // Helper function to check if survey data is valid for Beggs-Brill
  isValidForBeggsrill: () => boolean;
}

// No default data - when useDefaultValues is true, we just skip file requirement

export const useSurveyDataStore = create<SurveyDataState>()(
  devtools(
    (set, get) => ({
      // Initial state
      surveyData: [],
      originalData: [],
      fileInfo: null,
      isFileLoaded: false,
      isLoading: false,
      isProcessing: false,
      showUploadModal: false,
      useDefaultValues: false,
      validationErrors: [],
      isValid: false,
      uploadProgress: 0,

      // Basic setters
      setSurveyData: data => {
        set({
          surveyData: data,
          originalData: [...data],
          isFileLoaded: data.length > 0,
        });
        get().validateSurveyData();
      },

      setFileInfo: info => set({ fileInfo: info }),
      setLoading: loading => set({ isLoading: loading }),
      setProcessing: processing => set({ isProcessing: processing }),
      setShowUploadModal: show => set({ showUploadModal: show }),
      setUseDefaultValues: useDefault =>
        set({ useDefaultValues: useDefault, surveyData: [] }),
      setValidationErrors: errors => set({ validationErrors: errors }),
      setUploadProgress: progress => set({ uploadProgress: progress }),

      // Data manipulation
      addSurveyPoint: point => {
        const newPoint: SurveyDataPoint = {
          ...point,
          id: Date.now().toString(),
        };
        const currentData = get().surveyData;
        set({ surveyData: [...currentData, newPoint] });
        get().validateSurveyData();
      },

      updateSurveyPoint: (id, updates) => {
        const currentData = get().surveyData;
        const updatedData = currentData.map(point =>
          point.id === id ? { ...point, ...updates } : point
        );
        set({ surveyData: updatedData });
        get().validateSurveyData();
      },

      deleteSurveyPoint: id => {
        const currentData = get().surveyData;
        const filteredData = currentData.filter(point => point.id !== id);
        set({ surveyData: filteredData });
        get().validateSurveyData();
      },

      clearSurveyData: () => {
        set({
          surveyData: [],
          originalData: [],
          fileInfo: null,
          isFileLoaded: false,
          validationErrors: [],
          isValid: false,
        });
      },

      // Validation
      validateSurveyData: () => {
        const { surveyData, useDefaultValues } = get();
        const errors: SurveyValidationError[] = [];

        // If using default values, skip file requirement
        if (useDefaultValues) {
          set({ validationErrors: [], isValid: true });
          return true;
        }

        if (surveyData.length === 0) {
          errors.push({
            row: 0,
            field: 'general',
            message: 'At least one survey point is required',
          });
        }

        if (surveyData.length < 2) {
          errors.push({
            row: 0,
            field: 'general',
            message:
              'At least 2 survey points are required for proper analysis',
          });
        }

        surveyData.forEach((point, index) => {
          // Validate MD
          if (point.md < 0) {
            errors.push({
              row: index + 1,
              field: 'md',
              message: 'MD must be a positive value',
            });
          }

          // Validate TVD
          if (point.tvd < 0) {
            errors.push({
              row: index + 1,
              field: 'tvd',
              message: 'TVD must be a positive value',
            });
          }

          // Validate inclination (0 < θ < 90)
          if (point.inclination <= 0 || point.inclination >= 90) {
            errors.push({
              row: index + 1,
              field: 'inclination',
              message: 'Inclination must be greater than 0° and less than 90°',
            });
          }

          // Validate logical relationship: TVD <= MD
          if (point.tvd > point.md) {
            errors.push({
              row: index + 1,
              field: 'tvd',
              message: 'TVD cannot be greater than MD',
            });
          }
        });

        // Validate sequential MD values
        for (let i = 1; i < surveyData.length; i++) {
          if (surveyData[i].md <= surveyData[i - 1].md) {
            errors.push({
              row: i + 1,
              field: 'md',
              message: 'MD must be increasing',
            });
          }
        }

        const isValid = errors.length === 0;
        set({ validationErrors: errors, isValid });
        return isValid;
      },

      // Load default values - just mark as not needing file
      loadDefaultValues: () => {
        set({
          surveyData: [],
          originalData: [],
          isFileLoaded: false,
          useDefaultValues: true,
          validationErrors: [],
          isValid: true, // Mark as valid since we don't need file
          fileInfo: null,
        });
      },

      // Process Excel file
      processExcelFile: async file => {
        set({ isProcessing: true, uploadProgress: 0 });

        try {
          // Simulate file processing progress
          const progressSteps = [10, 30, 50, 70, 90, 100];
          for (const step of progressSteps) {
            await new Promise(resolve => setTimeout(resolve, 100));
            set({ uploadProgress: step });
          }

          const XLSX = await import('xlsx');

          const workbook = XLSX.read(await file.arrayBuffer(), {
            type: 'array',
          });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            throw new Error('Excel file is empty or has no data rows');
          }

          // Check if required columns exist (case-insensitive)
          const firstRow = jsonData[0] as Record<string, string | number>;
          const columnNames = Object.keys(firstRow).map(key =>
            key.toLowerCase()
          );

          const requiredColumns = ['md', 'tvd', 'inclination'];
          const missingColumns = requiredColumns.filter(
            col => !columnNames.some(name => name === col)
          );

          if (missingColumns.length > 0) {
            throw new Error(
              `Missing required columns: ${missingColumns.join(
                ', '
              )}. Found columns: ${Object.keys(firstRow).join(', ')}`
            );
          }

          interface ExcelRow {
            [key: string]: string | number | undefined;
          }

          const surveyPoints: SurveyDataPoint[] = (jsonData as ExcelRow[]).map(
            (row: ExcelRow, index: number) => {
              // Find column values case-insensitively
              const findColumnValue = (possibleNames: string[]) => {
                for (const name of possibleNames) {
                  const key = Object.keys(row).find(
                    k => k.toLowerCase() === name.toLowerCase()
                  );
                  if (
                    key &&
                    row[key] !== undefined &&
                    row[key] !== null &&
                    row[key] !== ''
                  ) {
                    return row[key];
                  }
                }
                return null;
              };

              const mdValue = findColumnValue(['MD', 'md']);
              const tvdValue = findColumnValue(['TVD', 'tvd']);
              const inclinationValue = findColumnValue([
                'Inclination',
                'inclination',
                'INCLINATION',
              ]);

              // Validate that all required values are present
              if (
                mdValue === null ||
                tvdValue === null ||
                inclinationValue === null
              ) {
                throw new Error(
                  `Row ${
                    index + 2
                  }: Missing required data in MD, TVD, or Inclination columns`
                );
              }

              const parsedMd =
                typeof mdValue === 'number'
                  ? mdValue
                  : parseFloat(mdValue.toString());
              const parsedTvd =
                typeof tvdValue === 'number'
                  ? tvdValue
                  : parseFloat(tvdValue.toString());
              const parsedInclination =
                typeof inclinationValue === 'number'
                  ? inclinationValue
                  : parseFloat(inclinationValue.toString());

              // Validate parsed values
              if (
                isNaN(parsedMd) ||
                isNaN(parsedTvd) ||
                isNaN(parsedInclination)
              ) {
                throw new Error(
                  `Row ${
                    index + 2
                  }: Invalid numeric values in MD, TVD, or Inclination`
                );
              }

              return {
                id: (index + 1).toString(),
                md: parsedMd,
                tvd: parsedTvd,
                inclination: parsedInclination,
              };
            }
          );

          if (surveyPoints.length < 2) {
            throw new Error('Excel file must contain at least 2 data points');
          }

          set({
            surveyData: surveyPoints,
            originalData: [...surveyPoints],
            isFileLoaded: true,
            useDefaultValues: false,
            fileInfo: {
              name: file.name,
              size: file.size,
              lastModified: new Date(file.lastModified),
              type: file.type,
            },
          });

          get().validateSurveyData();
        } catch (error) {
          console.error('Error processing Excel file:', error);
          set({
            validationErrors: [
              {
                row: 0,
                field: 'file',
                message:
                  error instanceof Error
                    ? error.message
                    : 'Error processing Excel file. Please check the format.',
              },
            ],
          });
        } finally {
          set({ isProcessing: false, uploadProgress: 0 });
        }
      },

      // Export to Excel
      exportToExcel: async () => {
        try {
          const XLSX = await import('xlsx');
          const { surveyData } = get();

          const exportData = surveyData.map(point => ({
            MD: point.md,
            TVD: point.tvd,
            Inclination: point.inclination,
          }));

          const worksheet = XLSX.utils.json_to_sheet(exportData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Survey Data');

          XLSX.writeFile(workbook, 'survey_data.xlsx');
        } catch (error) {
          console.error('Error exporting to Excel:', error);
        }
      },

      // Reset all state
      reset: () => {
        set({
          surveyData: [],
          originalData: [],
          fileInfo: null,
          isFileLoaded: false,
          isLoading: false,
          isProcessing: false,
          showUploadModal: false,
          useDefaultValues: false,
          validationErrors: [],
          isValid: false,
          uploadProgress: 0,
        });
      },

      // Helper function to check if survey data is valid for Beggs-Brill
      isValidForBeggsrill: () => {
        const { surveyData, useDefaultValues } = get();

        // If using default values, always valid
        if (useDefaultValues) {
          return true;
        }

        // Need at least 2 points for proper survey data
        if (surveyData.length < 2) {
          return false;
        }

        // Check if MD and TVD are positive
        for (const point of surveyData) {
          if (point.md <= 0 || point.tvd <= 0) {
            return false;
          }
        }

        // Check if MD is increasing
        for (let i = 1; i < surveyData.length; i++) {
          if (surveyData[i].md <= surveyData[i - 1].md) {
            return false;
          }
        }

        // Check if inclination is between 0 and 90 (exclusive)
        for (const point of surveyData) {
          if (point.inclination <= 0 || point.inclination >= 90) {
            return false;
          }
        }

        // Check logical relationship: TVD <= MD
        for (const point of surveyData) {
          if (point.tvd > point.md) {
            return false;
          }
        }

        return true;
      },
    }),
    {
      name: 'survey-data-store',
    }
  )
);
