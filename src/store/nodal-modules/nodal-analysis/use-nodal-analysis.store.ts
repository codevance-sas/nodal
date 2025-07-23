/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AnalysisPoint,
  SectionAnalysisKey,
} from '@/core/nodal-modules/nodal-analysis/types/nodal-analysis.types';
import {
  calculateHydraulicsAction,
  calculateHydraulicsRecommendAction,
  calculateIPRAction,
  calculatePVTAction,
  calculatePVTCurveAction,
} from '@/actions/nodal-analysis/nodal-analysis.action';
import { create } from 'zustand';
import { DEFAULT_PVT_CORRELATIONS } from '@/core/nodal-modules/nodal-analysis/constants/pvt.constant';
import { findOperatingPoint } from '@/core/nodal-modules/nodal-analysis/util/find-operating-point.util';
import { generateVlpCurve } from '@/core/nodal-modules/nodal-analysis/util/generate-vlp-curve.util';
import { Segments } from '@/core/nodal-modules/nodal-analysis/util/merge-bha-and-casing-rows.util';
import { selectBubblePoint } from '@/core/nodal-modules/nodal-analysis/util/select-bubble-point.util';
import { useSurveyDataStore } from '../use-survey-data.store';

export interface AnalysisState {
  activeSection: SectionAnalysisKey;
  setActiveSection: (section: SectionAnalysisKey) => void;

  iprInputs: Record<string, number>;
  setIprInputs: (inputs: Record<string, number>) => void;
  pvtInputs: Record<string, any> | null;
  setPvtInputs: (inputs: Record<string, any>) => void;
  pvtCurveData: Record<string, any> | null;
  pvtResults: Record<string, any> | null;
  setPvtResults: (results: Record<string, any>) => void;
  availableCorrelations: any[];
  setAvailableCorrelations: (items: any[]) => void;
  fluidProperties: Record<string, any> | null;
  setFluidProperties: (props: Record<string, any>) => void;

  hydraulicsInputs: {
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
  };
  setHydraulicsInputs: (data: {
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
  }) => void;

  computedGOR: number;

  iprCurve: AnalysisPoint[];
  vlpCurve: AnalysisPoint[];
  operatingPoint: AnalysisPoint | null;
  multiVlpCurves: Record<string, AnalysisPoint[]>;
  multiOperatingPoints: Record<string, AnalysisPoint>;
  hydraulicsResult: any;

  correlationMethod: string;
  setCorrelationMethod: (method: string) => void;

  completeness: Record<'ipr' | 'pvt' | 'hydraulics' | 'results', boolean>;
  errors: Partial<Record<'ipr' | 'pvt' | 'hydraulics' | 'sensitivity', string>>;
  loading: Record<'ipr' | 'pvt' | 'hydraulics' | 'sensitivity', boolean>;

  sensitivityData: any;

  calculateIPRCurve: (overridePb?: number) => Promise<void>;
  calculatePVTProperties: (inputs: Record<string, any>) => Promise<any>;
  calculateHydraulicsCurve: (
    inputs: Record<string, any>,
    segments: Segments[]
  ) => Promise<void>;
  runCorrelationAnalysis: (
    methods: string[],
    segments: Segments[],
    onProgress?: (progress: number) => void
  ) => Promise<void>;
  runSensitivityAnalysis: (param: string, values: number[]) => Promise<any>;
  recommendBestCorrelation: (inputs: any) => Promise<string>;

  inclination: number;
  setInclination: (inclination: number) => void;

  roughness: number;
  setRoughness: (roughness: number) => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  activeSection: 'ipr',
  iprInputs: {
    BOPD: 300,
    BWPD: 1000,
    MCFD: 500,
    Pr: 3000,
    PIP: 1800,
    steps: 20,
  },
  pvtInputs: null,
  pvtCurveData: null,
  pvtResults: null,
  fluidProperties: null,
  computedGOR: (500 * 1000) / 300,
  iprCurve: [],
  vlpCurve: [],
  operatingPoint: null,
  multiVlpCurves: {},
  multiOperatingPoints: {},
  hydraulicsResult: null,
  correlationMethod: 'beggs-brill',
  completeness: { ipr: false, pvt: false, hydraulics: false, results: false },
  errors: {},
  loading: { ipr: false, pvt: false, hydraulics: false, sensitivity: false },
  sensitivityData: {},
  availableCorrelations: [],
  setAvailableCorrelations: items => set({ availableCorrelations: items }),
  inclination: 90,
  setInclination: inclination => set({ inclination }),
  roughness: 0.0006,
  setRoughness: roughness => set({ roughness }),
  hydraulicsInputs: {
    oil_rate: 300,
    water_rate: 1200,
    gas_rate: 500,
    reservoir_pressure: 3000,
    bubble_point: 2500,
    pump_intake_pressure: 1800,
    oil_gravity: 35,
    gas_gravity: 0.7,
    water_gravity: 1.05,
    temperature: 160,
    tubing_id: 2.992,
    tubing_depth: 8000,
    casing_id: 5.5,
    inclination: 90,
    wellhead_pressure: 100,
    temperature_gradient: 0.015,
    roughness: 0.0006,
  },
  setHydraulicsInputs: data => set({ hydraulicsInputs: data }),

  setActiveSection: section => set({ activeSection: section }),
  setIprInputs: inputs => {
    const gor = inputs.BOPD > 0 ? (inputs.MCFD * 1000) / inputs.BOPD : 0;
    set({
      iprInputs: inputs,
      computedGOR: gor,
    });
  },
  setPvtInputs: inputs => set({ pvtInputs: inputs }),
  setPvtResults: inputs => set({ pvtInputs: inputs }),
  setFluidProperties: props => set({ fluidProperties: props }),
  setCorrelationMethod: method => set({ correlationMethod: method }),

  calculateIPRCurve: async overridePb => {
    set({
      loading: { ...get().loading, ipr: true },
      errors: { ...get().errors, ipr: undefined },
    });
    try {
      const inputs: any = {
        ...get().iprInputs,
        Pb: overridePb,
        steps: get().iprInputs.steps ?? 20,
      };
      const { data: curve } = await calculateIPRAction(inputs);
      set({
        iprCurve: curve.ipr_curve,
        completeness: { ...get().completeness, ipr: true },
      });
    } catch (err: any) {
      set({ errors: { ...get().errors, ipr: err.message } });
    } finally {
      set({ loading: { ...get().loading, ipr: false } });
    }
  },

  calculatePVTProperties: async inputs => {
    set(state => ({
      loading: { ...state.loading, pvt: true },
      errors: { ...state.errors, pvt: undefined },
    }));

    try {
      const { computedGOR, iprInputs } = get();
      const pvtInputsWithDefaults: any = {
        ...inputs,
        gor: inputs.gor ?? computedGOR,
        correlations: inputs.correlations ?? DEFAULT_PVT_CORRELATIONS,
      };

      const result = await calculatePVTAction(pvtInputsWithDefaults);

      let curvesData: any;
      try {
        curvesData = await calculatePVTCurveAction(pvtInputsWithDefaults);
        console.debug('Fetched PVT curves:', curvesData);
      } catch (err) {
        console.warn('Failed to fetch PVT curves:', err);
      }

      const bubblePointsMap = curvesData?.metadata?.bubble_points;
      const recommendedMethod =
        curvesData?.metadata?.recommended_correlations?.pb;
      const bubblePoint = selectBubblePoint(
        bubblePointsMap,
        recommendedMethod,
        result,
        computedGOR
      );

      const fluidProperties = {
        oil_rate: iprInputs.BOPD,
        water_rate: iprInputs.BWPD,
        gas_rate: iprInputs.MCFD,
        oil_gravity: pvtInputsWithDefaults.api,
        gas_gravity: pvtInputsWithDefaults.gas_gravity,
        water_gravity: pvtInputsWithDefaults.water_gravity,
        surface_temperature: pvtInputsWithDefaults.temperature,
        temperature_gradient:
          pvtInputsWithDefaults.temperature_gradient ?? 0.015,
        bubble_point: bubblePoint,
        gor: computedGOR,
      };

      await get().calculateIPRCurve(bubblePoint);

      set(state => ({
        pvtResults: result,
        pvtInputs: pvtInputsWithDefaults,
        fluidProperties,
        pvtCurveData: curvesData,
        completeness: { ...state.completeness, pvt: true },
      }));

      return result;
    } catch (error: any) {
      set(state => ({
        errors: { ...state.errors, pvt: error.message },
      }));
      throw error;
    } finally {
      set(state => ({
        loading: { ...state.loading, pvt: false },
      }));
    }
  },

  calculateHydraulicsCurve: async (inputs, segments) => {
    set(state => ({
      loading: { ...state.loading, hydraulics: true },
      errors: { ...state.errors, hydraulics: undefined },
    }));
    try {
      const { surveyData } = useSurveyDataStore.getState();

      const { fluidProperties: fp, iprInputs, correlationMethod } = get();

      if (!fp) {
        throw new Error('Fluid properties are not available.');
      }

      if (!fp.bubble_point) {
        throw new Error(
          'Bubble point pressure is missing. Please complete PVT analysis first.'
        );
      }

      const mergedInputs: any = {
        ...inputs,
        oil_rate: fp.oil_rate ?? inputs.oil_rate,
        water_rate: fp.water_rate ?? inputs.water_rate,
        gas_rate: fp.gas_rate ?? inputs.gas_rate,
        oil_gravity: fp.oil_gravity ?? inputs.oil_gravity,
        water_gravity: fp.water_gravity ?? inputs.water_gravity,
        gas_gravity: fp.gas_gravity ?? inputs.gas_gravity,
        temperature: fp.surface_temperature ?? inputs.temperature,
        bubble_point: fp.bubble_point ?? inputs.bubble_point,
        reservoir_pressure: iprInputs?.Pr ?? inputs.reservoir_pressure,
        tubing_depth: inputs.tubing_depth,
        inclination: inputs.inclination,
        tubing_id: inputs.tubing_id,
        casing_id: inputs.casing_id,
        wellhead_pressure: inputs.wellhead_pressure,
        roughness: inputs.roughness,
      };

      const merged: any = {
        fluid_properties: {
          oil_rate: fp.oil_rate,
          water_rate: fp.water_rate,
          gas_rate: fp.gas_rate,
          oil_gravity: fp.oil_gravity,
          water_gravity: fp.water_gravity,
          gas_gravity: fp.gas_gravity,
          bubble_point: fp.bubble_point,
          temperature_gradient: fp.temperature_gradient,
          surface_temperature: fp.surface_temperature,
        },
        wellbore_geometry: {
          pipe_segments: segments,
          deviation: Math.max(mergedInputs.inclination ?? 0, 0),
          roughness: mergedInputs.roughness ?? 0.0006,
          depth_steps: 100,
        },
        method: correlationMethod,
        surface_pressure: mergedInputs.wellhead_pressure,
        bhp_mode: 'calculate',
        target_bhp: 0,
        survey_data: surveyData,
      };

      const { data: result } = await calculateHydraulicsAction(merged);
      const vlpCurve = generateVlpCurve(result, mergedInputs.oil_rate);

      const operatingPoint = findOperatingPoint(get().iprCurve, vlpCurve);

      set(state => ({
        vlpCurve,
        hydraulicsResult: result,
        operatingPoint,
        completeness: {
          ...state.completeness,
          hydraulics: true,
          results: true,
        },
      }));
    } catch (err: any) {
      console.error(err);
      set({ errors: { ...get().errors, hydraulics: err.message } });
    } finally {
      set({ loading: { ...get().loading, hydraulics: false } });
    }
  },

  runCorrelationAnalysis: async (
    methods,
    segments,
    onProgress?: (progress: number) => void
  ) => {
    const { fluidProperties: fp, iprCurve } = get();

    if (!fp) {
      throw new Error(
        'Fluid properties are not available. Please complete PVT analysis first.'
      );
    }

    set(state => ({
      loading: { ...state.loading, sensitivity: true },
      errors: { ...state.errors, sensitivity: undefined },
    }));

    try {
      const { surveyData } = useSurveyDataStore.getState();
      const mergedBase = {
        fluid_properties: {
          oil_rate: fp.oil_rate,
          water_rate: fp.water_rate,
          gas_rate: fp.gas_rate,
          oil_gravity: fp.oil_gravity,
          water_gravity: fp.water_gravity,
          gas_gravity: fp.gas_gravity,
          bubble_point: fp.bubble_point,
          temperature_gradient: fp.temperature_gradient,
          surface_temperature: fp.surface_temperature,
        },
        wellbore_geometry: {
          pipe_segments: segments,
          deviation: get().inclination ?? 90,
          roughness: get().roughness ?? 0.0006,
          depth_steps: 100,
        },
        surface_pressure: 100,
        bhp_mode: 'calculate' as const,
        survey_data: surveyData,
      };

      const newVlpCurves: Record<string, AnalysisPoint[]> = {};
      const newOperatingPoints: Record<string, AnalysisPoint> = {};

      onProgress?.(0);

      for (let i = 0; i < methods.length; i++) {
        const method = methods[i];
        try {
          const input: any = { ...mergedBase, method };
          const { data: result } = await calculateHydraulicsAction(input);
          const vlpCurve = generateVlpCurve(
            result,
            input.fluid_properties.oil_rate
          );
          if (vlpCurve) {
            newVlpCurves[method] = vlpCurve;
            const op = findOperatingPoint(iprCurve, vlpCurve);
            if (op) newOperatingPoints[method] = op;
          }
        } catch (err) {
          console.error(`Correlation ${method} failed:`, err);
        }

        const progress = Math.round(((i + 1) / methods.length) * 100);
        onProgress?.(progress);
      }
      set({
        multiVlpCurves: newVlpCurves,
        multiOperatingPoints: newOperatingPoints,
      });
    } finally {
      set(state => ({
        loading: { ...state.loading, sensitivity: false },
      }));
    }
  },

  runSensitivityAnalysis: async (parameter, values) => {
    const { fluidProperties: fp, correlationMethod, iprCurve } = get();

    if (!fp) {
      throw new Error(
        'Fluid properties are not available. Please complete PVT analysis first.'
      );
    }

    set(state => ({
      loading: { ...state.loading, sensitivity: true },
      errors: { ...state.errors, sensitivity: undefined },
    }));

    try {
      const mergedBase: any = {
        oil_rate: fp.oil_rate,
        water_rate: fp.water_rate,
        gas_rate: fp.gas_rate,
        oil_gravity: fp.oil_gravity,
        water_gravity: fp.water_gravity,
        gas_gravity: fp.gas_gravity,
        bubble_point: fp.bubble_point,
        temperature_gradient: fp.temperature_gradient,
        surface_temperature: fp.surface_temperature,
        depth: 8000,
        deviation: 90,
        tubing_id: 2.992,
        casing_id: 5.5,
        roughness: 0.0006,
        depth_steps: 100,
        method: correlationMethod,
        surface_pressure: 100,
        bhp_mode: 'calculate' as const,
      };

      const { data: baseResult } = await calculateHydraulicsAction(mergedBase);
      const vlpCurve = generateVlpCurve(
        baseResult,
        mergedBase.fluid_properties.oil_rate
      );

      const baseOp = findOperatingPoint(iprCurve, vlpCurve);

      const cases: Array<{
        parameter: string;
        value: number;
        vlpCurve: AnalysisPoint[];
        operatingPoint: AnalysisPoint | null;
        hydraulicsResults: any;
      }> = [];

      for (const value of values) {
        try {
          const modified = { ...mergedBase };

          switch (parameter) {
            case 'water_cut': {
              const total = fp.oil_rate + fp.water_rate;
              modified.oil_rate = total * (1 - value);
              modified.water_rate = total * value;
              break;
            }
            case 'gor': {
              modified.gas_rate = (value * modified.oil_rate) / 1000;
              break;
            }
            case 'reservoir_pressure': {
              modified.reservoir_pressure = value;
              break;
            }
            default: {
              (modified as any)[parameter] = value;
            }
          }

          const merged: any = {
            fluid_properties: {
              oil_rate: modified.oil_rate,
              water_rate: modified.water_rate,
              gas_rate: modified.gas_rate,
              oil_gravity: modified.oil_gravity,
              water_gravity: modified.water_gravity,
              gas_gravity: modified.gas_gravity,
              bubble_point: modified.bubble_point,
              temperature_gradient: modified.temperature_gradient,
              surface_temperature: modified.surface_temperature,
            },
            wellbore_geometry: {
              depth: modified.tubing_depth,
              deviation: modified.inclination ?? 0,
              tubing_id: modified.tubing_id,
              casing_id: modified.casing_id,
              roughness: modified.roughness ?? 0.0006,
              depth_steps: 100,
            },
            method: correlationMethod,
            surface_pressure: modified.wellhead_pressure,
            bhp_mode: 'calculate',
          };

          const { data: result } = await calculateHydraulicsAction(merged);
          const vlpCurve = generateVlpCurve(
            result,
            merged.fluid_properties.oil_rate
          );
          const op = findOperatingPoint(iprCurve, vlpCurve);
          cases.push({
            parameter,
            value,
            vlpCurve,
            operatingPoint: op,
            hydraulicsResults: result,
          });
        } catch (err) {
          console.error(`Case ${parameter}=${value} failed:`, err);
        }
      }

      const sensitivity = {
        parameter,
        values,
        baseCase: {
          vlpCurve,
          operatingPoint: baseOp,
          hydraulicsResults: baseResult,
        },
        cases,
      };

      set({ sensitivityData: sensitivity });
      return sensitivity;
    } catch (error: any) {
      set(state => ({
        errors: { ...state.errors, sensitivity: error.message },
      }));
      throw error;
    } finally {
      set(state => ({
        loading: { ...state.loading, sensitivity: false },
      }));
    }
  },

  recommendBestCorrelation: async inputs => {
    try {
      const requestData: any = {
        fluid_properties: {
          oil_rate: inputs.oil_rate,
          water_rate: inputs.water_rate,
          gas_rate: inputs.gas_rate,
          oil_gravity: inputs.oil_gravity,
          water_gravity: inputs.water_gravity || 1.05,
          gas_gravity: inputs.gas_gravity,
          bubble_point: inputs.bubble_point,
          temperature_gradient: inputs.temperature_gradient,
          surface_temperature: inputs.temperature,
        },
        wellbore_geometry: {
          depth: inputs.tubing_depth,
          deviation: inputs.inclination || 0,
          tubing_id: inputs.tubing_id,
          roughness: inputs.roughness || 0.0006,
        },
        surface_pressure: inputs.wellhead_pressure,
      };

      const { data: result } = await calculateHydraulicsRecommendAction(
        requestData
      );

      return Object.values(result ?? {})[0];
    } catch {
      if (inputs.inclination < 30) return 'beggs-brill';
      if (inputs.gas_rate > 1000) return 'gray';
      return 'hagedorn-brown';
    }
  },
}));
