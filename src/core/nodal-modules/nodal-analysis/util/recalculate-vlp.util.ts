import { useAnalysisStore } from '@/store/nodal-modules/nodal-analysis/use-nodal-analysis.store';
import type { SavedFormSet } from '@/store/nodal-modules/nodal-analysis/use-form-hydraulics-persistence.store';
import type { Segments } from './merge-bha-and-casing-rows.util';

export const recalculateVLPFromSavedData = async (
  savedFormSet: SavedFormSet,
  segments: Segments[]
): Promise<void> => {
  const {
    setIprInputs,
    setPvtInputs,
    setHydraulicsInputs,
    setCorrelationMethod,
    setInclination,
    setRoughness,
    calculateIPRCurve,
    calculatePVTProperties,
    calculateHydraulicsCurve,
  } = useAnalysisStore.getState();

  try {
    setIprInputs(savedFormSet.iprData as any);

    if (savedFormSet.pvtData) {
      setPvtInputs(savedFormSet.pvtData);
      await calculatePVTProperties(savedFormSet.pvtData);
    }

    setCorrelationMethod(savedFormSet.correlationMethod);

    setHydraulicsInputs(savedFormSet.hydraulicsData);
    setInclination(savedFormSet.hydraulicsData.inclination);
    setRoughness(savedFormSet.hydraulicsData.roughness);

    await calculateIPRCurve(savedFormSet.hydraulicsData.bubble_point);

    await calculateHydraulicsCurve(savedFormSet.hydraulicsData, segments);

    console.log('VLP curve recalculated successfully using saved data');
  } catch (error) {
    console.error('Error recalculating VLP curve from saved data:', error);
    throw error;
  }
};

export const saveCurrentFormState = (
  name: string,
  description?: string
): string => {
  const { iprInputs, pvtInputs, hydraulicsInputs, correlationMethod } =
    useAnalysisStore.getState();

  const { saveCurrentFormSet } = useFormHydraulicsPersistenceStore.getState();

  return saveCurrentFormSet(
    name,
    description || 'Saved form state',
    iprInputs as any,
    pvtInputs as any,
    hydraulicsInputs,
    correlationMethod
  );
};

export const isValidForRecalculation = (
  savedFormSet: SavedFormSet
): boolean => {
  const hasValidIPR =
    savedFormSet.iprData &&
    savedFormSet.iprData.BOPD > 0 &&
    savedFormSet.iprData.Pr > 0;

  const hasValidHydraulics =
    savedFormSet.hydraulicsData &&
    savedFormSet.hydraulicsData.reservoir_pressure > 0 &&
    savedFormSet.hydraulicsData.tubing_depth > 0;

  return !!(hasValidIPR && hasValidHydraulics);
};

export const getSavedDataSummary = (savedFormSet: SavedFormSet) => {
  return {
    name: savedFormSet.name,
    description: savedFormSet.description,
    timestamp: new Date(savedFormSet.timestamp).toLocaleString('es-ES'),
    oilRate: savedFormSet.iprData.BOPD,
    waterRate: savedFormSet.iprData.BWPD,
    gasRate: savedFormSet.iprData.MCFD,
    reservoirPressure: savedFormSet.hydraulicsData.reservoir_pressure,
    correlationMethod: savedFormSet.correlationMethod,
    hasPVTData: !!savedFormSet.pvtData,
  };
};

import { useFormHydraulicsPersistenceStore } from '@/store/nodal-modules/nodal-analysis/use-form-hydraulics-persistence.store';
