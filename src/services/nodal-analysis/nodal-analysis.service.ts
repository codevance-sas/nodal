'use server';

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
  APIErrorResponse,
  NodalAnalysisEndpoint,
} from '@/core/nodal-modules/nodal-analysis/types/nodal-analysis.types';
import { createServiceLogger, TimeUtils } from '@/lib/server-utils';

// ====================== CONFIGURACIÓN ======================

const CONFIG = {
  BASE_URL: 'https://codevance.net/api',
  TIMEOUT: 30000, // 30 segundos
  MAX_RETRIES: 3,
  DEFAULT_VALUES: {
    stock_temp: 60,
    stock_pressure: 14.7,
    step_size: 25,
    water_gravity: 1,
    roughness: 0.0006,
    depth_steps: 100,
    ipr_steps: 25,
  },
} as const;

const logger = createServiceLogger('NodalAnalysis');

// ====================== UTILIDADES DE REQUEST ======================

/**
 * Utilidades para manejo de timeouts y requests con AbortController
 */
class RequestUtils {
  static async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  static delay = TimeUtils.delay;
  static getRetryDelay = TimeUtils.getRetryDelay;
}

/**
 * Maneja errores de la API y los convierte a formato estándar
 */
function handleAPIError(
  error: any,
  endpoint: NodalAnalysisEndpoint,
  attempt: number
): APIErrorResponse {
  const timestamp = new Date().toISOString();

  // Error de red o timeout
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      error: {
        detail: [
          {
            loc: ['network', 0],
            msg: 'Request timeout - La solicitud excedió el tiempo límite',
            type: 'timeout_error',
          },
        ],
      },
      status: 408,
      endpoint: `pvt/${endpoint}`,
      timestamp,
    };
  }

  // Error de red
  if (error.code === 'ENOTFOUND' || error.message?.includes('fetch')) {
    return {
      error: {
        detail: [
          {
            loc: ['network', 0],
            msg: 'Error de conexión - No se pudo conectar con el servidor',
            type: 'network_error',
          },
        ],
      },
      status: 503,
      endpoint: `pvt/${endpoint}`,
      timestamp,
    };
  }

  // Error genérico
  return {
    error: {
      detail: [
        {
          loc: ['unknown', attempt],
          msg: error.message || 'Error desconocido en el servidor',
          type: 'internal_error',
        },
      ],
    },
    status: 500,
    endpoint: `pvt/${endpoint}`,
    timestamp,
  };
}

// ====================== VALIDACIÓN Y PREPARACIÓN PVT ======================

/**
 * Prepara el input con valores por defecto
 */
function prepareInput(input: PVTCalculationInput): PVTCalculationInput {
  return {
    ...input,
    stock_temp: input.stock_temp ?? CONFIG.DEFAULT_VALUES.stock_temp,
    stock_pressure:
      input.stock_pressure ?? CONFIG.DEFAULT_VALUES.stock_pressure,
    step_size: input.step_size ?? CONFIG.DEFAULT_VALUES.step_size,
  };
}

/**
 * Valida el input antes de enviarlo a la API
 */
function validateInput(input: PVTCalculationInput): void {
  const requiredFields: (keyof PVTCalculationInput)[] = [
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

  for (const field of requiredFields) {
    if (input[field] === undefined || input[field] === null) {
      throw new Error(`Campo requerido faltante: ${field}`);
    }
  }

  // Validaciones específicas
  if (typeof input.api !== 'number' || input.api <= 0) {
    throw new Error('API debe ser un número positivo');
  }

  if (typeof input.temperature !== 'number' || input.temperature <= 0) {
    throw new Error('Temperature debe ser un número positivo');
  }
}

/**
 * Realiza la petición HTTP con retry logic para PVT
 */
async function makeRequest<T>(
  endpoint: NodalAnalysisEndpoint,
  input: PVTCalculationInput
): Promise<ServiceResponse<T>> {
  const url = `${CONFIG.BASE_URL}/pvt/${endpoint}`;
  const preparedInput = prepareInput(input);

  logger.info('makeRequest', `Iniciando petición a ${endpoint}`, {
    endpoint,
    url,
    inputKeys: Object.keys(preparedInput),
  });

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info('makeRequest', `Intento ${attempt}/${CONFIG.MAX_RETRIES}`, {
        endpoint,
        attempt,
        url,
      });

      const response = await RequestUtils.fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(preparedInput),
          cache: 'no-store',
        },
        CONFIG.TIMEOUT
      );

      logger.info('makeRequest', `Respuesta recibida`, {
        endpoint,
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      // Manejar respuesta exitosa
      if (response.ok) {
        const data = await response.json();
        logger.info('makeRequest', `Petición exitosa`, {
          endpoint,
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as T,
        };
      }

      // Manejar error de la API
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          detail: [
            {
              loc: ['response', 0],
              msg: response.statusText,
              type: 'http_error',
            },
          ],
        };
      }

      const apiError: APIErrorResponse = {
        error: errorData,
        status: response.status,
        endpoint: `pvt/${endpoint}`,
        timestamp: new Date().toISOString(),
      };

      logger.error('makeRequest', `Error de API`, {
        endpoint,
        attempt,
        status: response.status,
        error: errorData,
      });

      // No reintentar para errores 4xx (excepto 408, 429)
      if (
        response.status >= 400 &&
        response.status < 500 &&
        ![408, 429].includes(response.status)
      ) {
        return {
          success: false,
          error: apiError,
        };
      }

      // Reintentar para errores 5xx y algunos 4xx
      if (attempt < CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('makeRequest', `Reintentando en ${delay}ms`, {
          endpoint,
          attempt,
          nextAttempt: attempt + 1,
          delay,
        });
        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      logger.error('makeRequest', `Error en intento ${attempt}`, {
        endpoint,
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, endpoint, attempt);

      // Reintentar en el último intento
      if (attempt < CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('makeRequest', `Reintentando tras error en ${delay}ms`, {
          endpoint,
          attempt,
          nextAttempt: attempt + 1,
          delay,
          errorType: error.name,
        });
        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    }
  }

  // Nunca debería llegar aquí, pero por seguridad
  return {
    success: false,
    error: handleAPIError(
      new Error('Máximo número de reintentos excedido'),
      endpoint,
      CONFIG.MAX_RETRIES
    ),
  };
}

// ====================== VALIDACIÓN Y PREPARACIÓN HYDRAULICS ======================

/**
 * Prepara el input hydraulics con valores por defecto
 */
function prepareHydraulicsInput(
  input: HydraulicsCalculationInput
): HydraulicsCalculationInput {
  return {
    ...input,
    fluid_properties: {
      ...input.fluid_properties,
      water_gravity:
        input.fluid_properties.water_gravity ??
        CONFIG.DEFAULT_VALUES.water_gravity,
    },
    wellbore_geometry: {
      ...input.wellbore_geometry,
      roughness:
        input.wellbore_geometry.roughness ?? CONFIG.DEFAULT_VALUES.roughness,
      depth_steps:
        input.wellbore_geometry.depth_steps ??
        CONFIG.DEFAULT_VALUES.depth_steps,
    },
  };
}

/**
 * Valida el input hydraulics antes de enviarlo a la API
 */
function validateHydraulicsInput(input: HydraulicsCalculationInput): void {
  // Validar fluid_properties
  const fluidRequiredFields: (keyof typeof input.fluid_properties)[] = [
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

  for (const field of fluidRequiredFields) {
    if (
      input.fluid_properties[field] === undefined ||
      input.fluid_properties[field] === null
    ) {
      throw new Error(`Campo requerido faltante en fluid_properties: ${field}`);
    }
  }

  // Validar wellbore_geometry
  if (
    !input.wellbore_geometry.pipe_segments ||
    input.wellbore_geometry.pipe_segments.length === 0
  ) {
    throw new Error(
      'pipe_segments es requerido y debe tener al menos un elemento'
    );
  }

  if (typeof input.wellbore_geometry.deviation !== 'number') {
    throw new Error('deviation debe ser un número');
  }

  // Validar pipe_segments
  for (let i = 0; i < input.wellbore_geometry.pipe_segments.length; i++) {
    const segment = input.wellbore_geometry.pipe_segments[i];
    if (
      typeof segment.start_depth !== 'number' ||
      typeof segment.end_depth !== 'number' ||
      typeof segment.diameter !== 'number'
    ) {
      throw new Error(
        `pipe_segments[${i}] debe tener start_depth, end_depth y diameter como números`
      );
    }
  }

  // Validar campos principales
  const mainRequiredFields: (keyof HydraulicsCalculationInput)[] = [
    'method',
    'surface_pressure',
    'bhp_mode',
    'target_bhp',
  ];

  for (const field of mainRequiredFields) {
    if (input[field] === undefined || input[field] === null) {
      throw new Error(`Campo requerido faltante: ${field}`);
    }
  }

  // Validar survey_data
  if (!input.survey_data || input.survey_data.length === 0) {
    throw new Error(
      'survey_data es requerido y debe tener al menos un elemento'
    );
  }

  for (let i = 0; i < input.survey_data.length; i++) {
    const survey = input.survey_data[i];
    if (
      typeof survey.md !== 'number' ||
      typeof survey.tvd !== 'number' ||
      typeof survey.inclination !== 'number'
    ) {
      throw new Error(
        `survey_data[${i}] debe tener md, tvd e inclination como números`
      );
    }
  }
}

/**
 * Realiza la petición HTTP con retry logic para hydraulics
 */
async function makeHydraulicsRequest<T>(
  input: HydraulicsCalculationInput
): Promise<ServiceResponse<T>> {
  const url = `${CONFIG.BASE_URL}/hydraulics/calculate`;
  const preparedInput = prepareHydraulicsInput(input);

  logger.info(
    'makeHydraulicsRequest',
    `Iniciando petición a hydraulics/calculate`,
    {
      endpoint: 'hydraulics',
      url,
      inputKeys: Object.keys(preparedInput),
    }
  );

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info(
        'makeHydraulicsRequest',
        `Intento ${attempt}/${CONFIG.MAX_RETRIES}`,
        {
          endpoint: 'hydraulics',
          attempt,
          url,
        }
      );

      const response = await RequestUtils.fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(preparedInput),
          cache: 'no-store',
        },
        CONFIG.TIMEOUT
      );

      logger.info('makeHydraulicsRequest', `Respuesta recibida`, {
        endpoint: 'hydraulics',
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      // Manejar respuesta exitosa
      if (response.ok) {
        const data = await response.json();
        logger.info('makeHydraulicsRequest', `Petición exitosa`, {
          endpoint: 'hydraulics',
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as T,
        };
      }

      // Manejar error de la API
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          detail: [
            {
              loc: ['response', 0],
              msg: response.statusText,
              type: 'http_error',
            },
          ],
        };
      }

      const apiError: APIErrorResponse = {
        error: errorData,
        status: response.status,
        endpoint: 'hydraulics/calculate',
        timestamp: new Date().toISOString(),
      };

      logger.error('makeHydraulicsRequest', `Error de API`, {
        endpoint: 'hydraulics',
        attempt,
        status: response.status,
        error: errorData,
      });

      // No reintentar para errores 4xx (excepto 408, 429)
      if (
        response.status >= 400 &&
        response.status < 500 &&
        ![408, 429].includes(response.status)
      ) {
        return {
          success: false,
          error: apiError,
        };
      }

      // Reintentar para errores 5xx y algunos 4xx
      if (attempt < CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('makeHydraulicsRequest', `Reintentando en ${delay}ms`, {
          endpoint: 'hydraulics',
          attempt,
          nextAttempt: attempt + 1,
          delay,
        });
        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      logger.error('makeHydraulicsRequest', `Error en intento ${attempt}`, {
        endpoint: 'hydraulics',
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, 'hydraulics', attempt);

      // Reintentar en el último intento
      if (attempt < CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn(
          'makeHydraulicsRequest',
          `Reintentando tras error en ${delay}ms`,
          {
            endpoint: 'hydraulics',
            attempt,
            nextAttempt: attempt + 1,
            delay,
            errorType: error.name,
          }
        );
        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    }
  }

  // Nunca debería llegar aquí, pero por seguridad
  return {
    success: false,
    error: handleAPIError(
      new Error('Máximo número de reintentos excedido'),
      'hydraulics',
      CONFIG.MAX_RETRIES
    ),
  };
}

/**
 * Realiza la petición HTTP con retry logic para hydraulics recommend
 */
async function makeHydraulicsRecommendRequest<T>(
  input: HydraulicsCalculationInput
): Promise<ServiceResponse<T>> {
  const url = `${CONFIG.BASE_URL}/hydraulics/recommend`;
  const preparedInput = prepareHydraulicsInput(input);

  logger.info(
    'makeHydraulicsRecommendRequest',
    `Iniciando petición a hydraulics/recommend`,
    {
      endpoint: 'recommend',
      url,
      inputKeys: Object.keys(preparedInput),
    }
  );

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info(
        'makeHydraulicsRecommendRequest',
        `Intento ${attempt}/${CONFIG.MAX_RETRIES}`,
        {
          endpoint: 'recommend',
          attempt,
          url,
        }
      );

      const response = await RequestUtils.fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(preparedInput),
          cache: 'no-store',
        },
        CONFIG.TIMEOUT
      );

      logger.info('makeHydraulicsRecommendRequest', `Respuesta recibida`, {
        endpoint: 'recommend',
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      // Manejar respuesta exitosa
      if (response.ok) {
        const data = await response.json();
        logger.info('makeHydraulicsRecommendRequest', `Petición exitosa`, {
          endpoint: 'recommend',
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as T,
        };
      }

      // Manejar error de la API
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          detail: [
            {
              loc: ['response', 0],
              msg: response.statusText,
              type: 'http_error',
            },
          ],
        };
      }

      const apiError: APIErrorResponse = {
        error: errorData,
        status: response.status,
        endpoint: 'hydraulics/recommend',
        timestamp: new Date().toISOString(),
      };

      logger.error('makeHydraulicsRecommendRequest', `Error de API`, {
        endpoint: 'recommend',
        attempt,
        status: response.status,
        error: errorData,
      });

      // No reintentar para errores 4xx (excepto 408, 429)
      if (
        response.status >= 400 &&
        response.status < 500 &&
        ![408, 429].includes(response.status)
      ) {
        return {
          success: false,
          error: apiError,
        };
      }

      // Reintentar para errores 5xx y algunos 4xx
      if (attempt < CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn(
          'makeHydraulicsRecommendRequest',
          `Reintentando en ${delay}ms`,
          {
            endpoint: 'recommend',
            attempt,
            nextAttempt: attempt + 1,
            delay,
          }
        );
        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      logger.error(
        'makeHydraulicsRecommendRequest',
        `Error en intento ${attempt}`,
        {
          endpoint: 'recommend',
          attempt,
          error: error.message,
          stack: error.stack,
        }
      );

      const apiError = handleAPIError(error, 'recommend', attempt);

      // Reintentar en el último intento
      if (attempt < CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn(
          'makeHydraulicsRecommendRequest',
          `Reintentando tras error en ${delay}ms`,
          {
            endpoint: 'recommend',
            attempt,
            nextAttempt: attempt + 1,
            delay,
            errorType: error.name,
          }
        );
        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    }
  }

  // Nunca debería llegar aquí, pero por seguridad
  return {
    success: false,
    error: handleAPIError(
      new Error('Máximo número de reintentos excedido'),
      'recommend',
      CONFIG.MAX_RETRIES
    ),
  };
}

// ====================== VALIDACIÓN Y PREPARACIÓN IPR ======================

/**
 * Prepara el input IPR con valores por defecto
 */
function prepareIPRInput(input: IPRCalculationInput): IPRCalculationInput {
  return {
    ...input,
    steps: input.steps ?? CONFIG.DEFAULT_VALUES.ipr_steps,
  };
}

/**
 * Valida el input IPR antes de enviarlo a la API
 */
function validateIPRInput(input: IPRCalculationInput): void {
  const requiredFields: (keyof IPRCalculationInput)[] = [
    'BOPD',
    'BWPD',
    'MCFD',
    'Pr',
    'Pb',
    'PIP',
    'steps',
  ];

  for (const field of requiredFields) {
    if (input[field] === undefined || input[field] === null) {
      throw new Error(`Campo requerido faltante: ${field}`);
    }
  }

  // Validaciones específicas
  const numericFields: (keyof IPRCalculationInput)[] = [
    'BOPD',
    'BWPD',
    'MCFD',
    'Pr',
    'Pb',
    'PIP',
    'steps',
  ];

  for (const field of numericFields) {
    if (typeof input[field] !== 'number') {
      throw new Error(`${field} debe ser un número`);
    }
  }

  if (input.steps <= 0) {
    throw new Error('steps debe ser un número positivo');
  }
}

/**
 * Realiza la petición HTTP con retry logic para IPR
 */
async function makeIPRRequest<T>(
  input: IPRCalculationInput
): Promise<ServiceResponse<T>> {
  const url = `${CONFIG.BASE_URL}/ipr/calculate`;
  const preparedInput = prepareIPRInput(input);

  logger.info('makeIPRRequest', `Iniciando petición a ipr/calculate`, {
    endpoint: 'ipr',
    url,
    inputKeys: Object.keys(preparedInput),
  });

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info(
        'makeIPRRequest',
        `Intento ${attempt}/${CONFIG.MAX_RETRIES}`,
        {
          endpoint: 'ipr',
          attempt,
          url,
        }
      );

      const response = await RequestUtils.fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(preparedInput),
          cache: 'no-store',
        },
        CONFIG.TIMEOUT
      );

      logger.info('makeIPRRequest', `Respuesta recibida`, {
        endpoint: 'ipr',
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      // Manejar respuesta exitosa
      if (response.ok) {
        const data = await response.json();
        logger.info('makeIPRRequest', `Petición exitosa`, {
          endpoint: 'ipr',
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as T,
        };
      }

      // Manejar error de la API
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          detail: [
            {
              loc: ['response', 0],
              msg: response.statusText,
              type: 'http_error',
            },
          ],
        };
      }

      const apiError: APIErrorResponse = {
        error: errorData,
        status: response.status,
        endpoint: 'ipr/calculate',
        timestamp: new Date().toISOString(),
      };

      logger.error('makeIPRRequest', `Error de API`, {
        endpoint: 'ipr',
        attempt,
        status: response.status,
        error: errorData,
      });

      // No reintentar para errores 4xx (excepto 408, 429)
      if (
        response.status >= 400 &&
        response.status < 500 &&
        ![408, 429].includes(response.status)
      ) {
        return {
          success: false,
          error: apiError,
        };
      }

      // Reintentar para errores 5xx y algunos 4xx
      if (attempt < CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('makeIPRRequest', `Reintentando en ${delay}ms`, {
          endpoint: 'ipr',
          attempt,
          nextAttempt: attempt + 1,
          delay,
        });
        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      logger.error('makeIPRRequest', `Error en intento ${attempt}`, {
        endpoint: 'ipr',
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, 'ipr', attempt);

      // Reintentar en el último intento
      if (attempt < CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('makeIPRRequest', `Reintentando tras error en ${delay}ms`, {
          endpoint: 'ipr',
          attempt,
          nextAttempt: attempt + 1,
          delay,
          errorType: error.name,
        });
        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    }
  }

  // Nunca debería llegar aquí, pero por seguridad
  return {
    success: false,
    error: handleAPIError(
      new Error('Máximo número de reintentos excedido'),
      'ipr',
      CONFIG.MAX_RETRIES
    ),
  };
}

// ====================== FUNCIONES PÚBLICAS (SERVER ACTIONS) ======================

/**
 * Server Function para cálculo PVT
 * Compatible con cookies() y otras Next.js Server Functions
 */
export async function calculatePVT(
  input: PVTCalculationInput
): Promise<ServiceResponse<PVTCalculationResponse>> {
  'use server';

  try {
    //validateInput(input);
    return await makeRequest<PVTCalculationResponse>('calculate', input);
  } catch (error: any) {
    logger.error(
      'calculatePVT',
      'Error en validación de input para calculate',
      {
        error: error.message,
        input: Object.keys(input),
      }
    );

    return {
      success: false,
      error: {
        error: {
          detail: [
            {
              loc: ['input', 0],
              msg: error.message,
              type: 'validation_error',
            },
          ],
        },
        status: 400,
        endpoint: 'pvt/calculate',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Server Function para cálculo de curva PVT
 * Compatible con cookies() y otras Next.js Server Functions
 */
export async function calculatePVTCurve(
  input: PVTCalculationInput
): Promise<ServiceResponse<PVTCurveResponse>> {
  'use server';

  try {
    //validateInput(input);
    return await makeRequest<PVTCurveResponse>('curve', input);
  } catch (error: any) {
    logger.error(
      'calculatePVTCurve',
      'Error en validación de input para curve',
      {
        error: error.message,
        input: Object.keys(input),
      }
    );

    return {
      success: false,
      error: {
        error: {
          detail: [
            {
              loc: ['input', 0],
              msg: error.message,
              type: 'validation_error',
            },
          ],
        },
        status: 400,
        endpoint: 'pvt/curve',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Server Function para cálculo hydraulics
 * Compatible con cookies() y otras Next.js Server Functions
 */
export async function calculateHydraulics(
  input: HydraulicsCalculationInput
): Promise<ServiceResponse<HydraulicsCalculationResponse>> {
  'use server';

  try {
    //validateHydraulicsInput(input);
    return await makeHydraulicsRequest<HydraulicsCalculationResponse>(input);
  } catch (error: any) {
    logger.error(
      'calculateHydraulics',
      'Error en validación de input para hydraulics',
      {
        error: error.message,
        input: Object.keys(input),
      }
    );

    return {
      success: false,
      error: {
        error: {
          detail: [
            {
              loc: ['input', 0],
              msg: error.message,
              type: 'validation_error',
            },
          ],
        },
        status: 400,
        endpoint: 'hydraulics/calculate',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Server Function para recomendaciones hydraulics
 * Compatible con cookies() y otras Next.js Server Functions
 */
export async function calculateHydraulicsRecommend(
  input: HydraulicsCalculationInput
): Promise<ServiceResponse<HydraulicsRecommendResponse>> {
  'use server';

  try {
    //validateHydraulicsInput(input);
    return await makeHydraulicsRecommendRequest<HydraulicsRecommendResponse>(
      input
    );
  } catch (error: any) {
    logger.error(
      'calculateHydraulicsRecommend',
      'Error en validación de input para hydraulics recommend',
      {
        error: error.message,
        input: Object.keys(input),
      }
    );

    return {
      success: false,
      error: {
        error: {
          detail: [
            {
              loc: ['input', 0],
              msg: error.message,
              type: 'validation_error',
            },
          ],
        },
        status: 400,
        endpoint: 'hydraulics/recommend',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Server Function para cálculo IPR
 * Compatible con cookies() y otras Next.js Server Functions
 */
export async function calculateIPR(
  input: IPRCalculationInput
): Promise<ServiceResponse<IPRCalculationResponse>> {
  'use server';

  try {
    //validateIPRInput(input);
    return await makeIPRRequest<IPRCalculationResponse>(input);
  } catch (error: any) {
    logger.error('calculateIPR', 'Error en validación de input para IPR', {
      error: error.message,
      input: Object.keys(input),
    });

    return {
      success: false,
      error: {
        error: {
          detail: [
            {
              loc: ['input', 0],
              msg: error.message,
              type: 'validation_error',
            },
          ],
        },
        status: 400,
        endpoint: 'ipr/calculate',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
