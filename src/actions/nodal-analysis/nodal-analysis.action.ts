'use server';

import {
  calculatePVT,
  calculatePVTCurve,
  calculateHydraulics,
  calculateHydraulicsRecommend,
  calculateIPR,
} from '@/services/nodal-analysis/nodal-analysis.service';
import {
  PVTCalculationInput,
  PVTCalculationResponse,
  PVTCurveResponse,
  HydraulicsCalculationInput,
  HydraulicsCalculationResponse,
  HydraulicsRecommendResponse,
  IPRCalculationInput,
  IPRCalculationResponse,
  ServiceResponse,
  ActionResult,
} from '@/core/nodal-modules/nodal-analysis/types/nodal-analysis.types';
import {
  createActionLogger,
  createErrorHandler,
  createValidator,
} from '@/lib/server-utils';
import type { GenericErrorResponse } from '@/types/util.types';

// ====================== CONFIGURATION AND UTILITIES ======================

const logger = createActionLogger('NodalAnalysis');
const errorHandler = createErrorHandler(logger);
const validator = createValidator(logger);

// ====================== INPUT VALIDATORS ======================

/**
 * Validate input for PVT calculations
 */
function validateActionInput(
  input: any,
  context: string
): input is PVTCalculationInput {
  const requiredFields = [
    'api',
    'gas_gravity',
    'gor',
    'temperature',
    'pb',
    'co2_frac',
    'h2s_frac',
    'n2_frac',
    'correlations',
    'ift',
  ];

  const validation = validator.validateRequiredFields(
    input,
    requiredFields,
    context
  );
  return validation.isValid;
}

/**
 * Validate input for Hydraulics calculations
 */
function validateHydraulicsActionInput(
  input: any,
  context: string
): input is HydraulicsCalculationInput {
  if (!input || typeof input !== 'object') {
    return false;
  }

  // Validate main fields
  const mainFields = [
    'fluid_properties',
    'wellbore_geometry',
    'method',
    'surface_pressure',
    'bhp_mode',
    'target_bhp',
    'survey_data',
  ];

  for (const field of mainFields) {
    if (!(field in input)) {
      logger.warn(context, `Campo faltante: ${field}`, { input: typeof input });
      return false;
    }
  }

  // Validate fluid_properties
  if (!input.fluid_properties || typeof input.fluid_properties !== 'object') {
    return false;
  }

  const fluidFields = [
    'oil_rate',
    'water_rate',
    'gas_rate',
    'oil_gravity',
    'gas_gravity',
    'bubble_point',
    'temperature_gradient',
    'surface_temperature',
    'wct',
    'gor',
    'glr',
  ];

  for (const field of fluidFields) {
    if (!(field in input.fluid_properties)) {
      logger.warn(context, `Campo faltante en fluid_properties: ${field}`, {
        input: typeof input.fluid_properties,
      });
      return false;
    }
  }

  // Validate wellbore_geometry
  if (!input.wellbore_geometry || typeof input.wellbore_geometry !== 'object') {
    return false;
  }

  if (!Array.isArray(input.wellbore_geometry.pipe_segments)) {
    logger.warn(context, 'pipe_segments debe ser un array', {
      input: typeof input.wellbore_geometry,
    });
    return false;
  }

  // Validate survey_data
  if (!Array.isArray(input.survey_data)) {
    logger.warn(context, 'survey_data debe ser un array', {
      input: typeof input.survey_data,
    });
    return false;
  }

  return true;
}

/**
 * Validate input for IPR calculations
 */
function validateIPRActionInput(
  input: any,
  context: string
): input is IPRCalculationInput {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const requiredFields = ['BOPD', 'BWPD', 'MCFD', 'Pr', 'Pb', 'PIP', 'steps'];

  // Validate existence of fields
  for (const field of requiredFields) {
    if (!(field in input)) {
      logger.warn(context, `Campo faltante: ${field}`, { input: typeof input });
      return false;
    }
  }

  // Validate that all fields are numbers
  for (const field of requiredFields) {
    if (typeof input[field] !== 'number') {
      logger.warn(context, `Campo ${field} debe ser un número`, {
        field,
        type: typeof input[field],
      });
      return false;
    }
  }

  return true;
}

// ====================== UTILIDADES COMUNES ======================

/**
 * Maneja el resultado exitoso de un service
 */
function handleSuccessfulResult<T>(
  serviceResult: ServiceResponse<T>,
  actionName: string
): ActionResult<T> {
  logger.info(actionName, `${actionName} completado exitosamente`, {
    dataKeys: serviceResult.data ? Object.keys(serviceResult.data) : [],
  });

  return {
    success: true,
    data: serviceResult.data,
  };
}

/**
 * Maneja errores de service o estados inconsistentes
 */
function handleServiceError<T>(
  serviceResult: ServiceResponse<T>,
  actionName: string
): ActionResult<T> {
  if (serviceResult.error) {
    return errorHandler.handleServiceError(
      serviceResult.error as GenericErrorResponse,
      actionName
    );
  }

  // Estado inconsistente: success=false sin error
  logger.error(
    actionName,
    'Service retornó success=false sin error',
    serviceResult
  );

  return {
    success: false,
    error: {
      message: 'Error inesperado en el procesamiento.',
      code: 'service_inconsistency',
      details: {
        serviceResult,
        timestamp: new Date().toISOString(),
      },
    },
  };
}

/**
 * Template genérico para actions
 */
async function executeAction<TInput, TOutput>(
  input: TInput,
  actionName: string,
  validator: (input: any, context: string) => input is TInput,
  serviceCall: (input: TInput) => Promise<ServiceResponse<TOutput>>,
  validationErrorMessage: string
): Promise<ActionResult<TOutput>> {
  try {
    logger.info(actionName, `Iniciando ${actionName} desde cliente`, {
      hasInput: !!input,
      inputKeys: input ? Object.keys(input as any) : [],
    });

    // Validación
    if (!validator(input, actionName)) {
      return errorHandler.createValidationError(
        validationErrorMessage,
        actionName,
        { receivedInput: typeof input }
      );
    }

    // Llamada al service
    const serviceResult = await serviceCall(input);

    // Manejo del resultado
    if (serviceResult.success && serviceResult.data) {
      return handleSuccessfulResult(serviceResult, actionName);
    }

    return handleServiceError(serviceResult, actionName);
  } catch (error: any) {
    return errorHandler.handleUnexpectedError(error, actionName);
  }
}

// ====================== ACTIONS PÚBLICAS ======================

/**
 * Action para cálculo PVT
 */
export async function calculatePVTAction(
  input: PVTCalculationInput
): Promise<ActionResult<PVTCalculationResponse>> {
  return executeAction(
    input,
    'calculatePVT',
    (_input: any, _context: string) => true,
    calculatePVT,
    'Los datos proporcionados no tienen el formato correcto.'
  );
}

/**
 * Action para cálculo de curva PVT
 */
export async function calculatePVTCurveAction(
  input: PVTCalculationInput
): Promise<ActionResult<PVTCurveResponse>> {
  return executeAction(
    input,
    'calculatePVTCurve',
    (_input: any, _context: string) => true,
    calculatePVTCurve,
    'Los datos proporcionados no tienen el formato correcto.'
  );
}

/**
 * Action para cálculo Hydraulics
 */
export async function calculateHydraulicsAction(
  input: HydraulicsCalculationInput
): Promise<ActionResult<HydraulicsCalculationResponse>> {
  return executeAction(
    input,
    'calculateHydraulics',
    (_input: any, _context: string) => true,
    calculateHydraulics,
    'Los datos proporcionados no tienen el formato correcto para hydraulics.'
  );
}

/**
 * Action para recomendaciones Hydraulics
 */
export async function calculateHydraulicsRecommendAction(
  input: HydraulicsCalculationInput
): Promise<ActionResult<HydraulicsRecommendResponse>> {
  return executeAction(
    input,
    'calculateHydraulicsRecommend',
    (_input: any, _context: string) => true,
    calculateHydraulicsRecommend,
    'Los datos proporcionados no tienen el formato correcto para hydraulics recommend.'
  );
}

/**
 * Action para cálculo IPR
 */
export async function calculateIPRAction(
  input: IPRCalculationInput
): Promise<ActionResult<IPRCalculationResponse>> {
  return executeAction(
    input,
    'calculateIPR',
    (_input: any, _context: string) => true,
    calculateIPR,
    'Los datos proporcionados no tienen el formato correcto para IPR.'
  );
}
