import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos para los datos del formulario
export interface IPRFormData {
  BOPD: number;
  BWPD: number;
  MCFD: number;
  Pr: number;
  PIP: number;
  steps: number;
}

export interface PVTFormData {
  api: number;
  gas_gravity: number;
  gor: number;
  stock_temp?: number;
  stock_pressure?: number;
  temperature: number;
  step_size?: number;
  pb: number;
  co2_frac: number;
  h2s_frac: number;
  n2_frac: number;
  correlations: Record<string, any>;
  ift: number;
}

export interface HydraulicsFormData {
  oil_rate: number;
  water_rate: number;
  gas_rate: number;
  reservoir_pressure: number;
  bubble_point: number;
  pump_intake_pressure: number;
  oil_gravity: number;
  gas_gravity: number;
  water_gravity: number;
  temperature: number;
  tubing_id: number;
  tubing_depth: number;
  casing_id: number;
  inclination: number;
  wellhead_pressure: number;
  temperature_gradient: number;
  roughness: number;
}

export interface SavedFormSet {
  id: string;
  name: string;
  description?: string;
  timestamp: number;
  iprData: IPRFormData;
  pvtData: PVTFormData | null;
  hydraulicsData: HydraulicsFormData;
  correlationMethod: string;
}

interface FormHydraulicsPersistenceState {
  // Saved form sets
  savedFormSets: SavedFormSet[];

  // Current working data
  currentFormSet: SavedFormSet | null;

  // Actions
  saveCurrentFormSet: (
    name: string,
    description: string,
    iprData: IPRFormData,
    pvtData: PVTFormData | null,
    hydraulicsData: HydraulicsFormData,
    correlationMethod: string
  ) => string;

  loadFormSet: (id: string) => SavedFormSet | null;

  deleteFormSet: (id: string) => void;

  updateFormSetName: (id: string, name: string, description?: string) => void;

  setCurrentFormSet: (formSet: SavedFormSet | null) => void;

  // Quick save/load current state
  quickSave: (
    iprData: IPRFormData,
    pvtData: PVTFormData | null,
    hydraulicsData: HydraulicsFormData,
    correlationMethod: string
  ) => void;

  getQuickSaveData: () => SavedFormSet | null;

  clearQuickSave: () => void;
}

export const useFormHydraulicsPersistenceStore =
  create<FormHydraulicsPersistenceState>()(
    persist(
      (set, get) => ({
        savedFormSets: [],
        currentFormSet: null,

        saveCurrentFormSet: (
          name,
          description,
          iprData,
          pvtData,
          hydraulicsData,
          correlationMethod
        ) => {
          const id = `form-set-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const newFormSet: SavedFormSet = {
            id,
            name,
            description,
            timestamp: Date.now(),
            iprData,
            pvtData,
            hydraulicsData,
            correlationMethod,
          };

          set(state => ({
            savedFormSets: [...state.savedFormSets, newFormSet],
            currentFormSet: newFormSet,
          }));

          return id;
        },

        loadFormSet: id => {
          const formSet = get().savedFormSets.find(fs => fs.id === id);
          if (formSet) {
            set({ currentFormSet: formSet });
            return formSet;
          }
          return null;
        },

        deleteFormSet: id => {
          set(state => ({
            savedFormSets: state.savedFormSets.filter(fs => fs.id !== id),
            currentFormSet:
              state.currentFormSet?.id === id ? null : state.currentFormSet,
          }));
        },

        updateFormSetName: (id, name, description) => {
          set(state => ({
            savedFormSets: state.savedFormSets.map(fs =>
              fs.id === id ? { ...fs, name, description } : fs
            ),
            currentFormSet:
              state.currentFormSet?.id === id
                ? { ...state.currentFormSet, name, description }
                : state.currentFormSet,
          }));
        },

        setCurrentFormSet: formSet => {
          set({ currentFormSet: formSet });
        },

        quickSave: (iprData, pvtData, hydraulicsData, correlationMethod) => {
          const quickSaveSet: SavedFormSet = {
            id: 'quick-save',
            name: 'Quick Save',
            description: 'Automatically saved current state',
            timestamp: Date.now(),
            iprData,
            pvtData,
            hydraulicsData,
            correlationMethod,
          };

          set({ currentFormSet: quickSaveSet });
        },

        getQuickSaveData: () => {
          const current = get().currentFormSet;
          return current?.id === 'quick-save' ? current : null;
        },

        clearQuickSave: () => {
          const current = get().currentFormSet;
          if (current?.id === 'quick-save') {
            set({ currentFormSet: null });
          }
        },
      }),
      {
        name: 'nodal-analysis-form-persistence',
        version: 1,
      }
    )
  );
