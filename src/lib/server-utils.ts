import type {
  GenericAPIError,
  GenericErrorResponse,
  GenericServiceResponse,
  GenericActionResult,
  LoggerConfig,
  FieldValidationResult,
  TypeValidationResult,
  RangeValidationResult,
  FieldType,
  NumericRange,
} from '@/types/util.types';

export type {
  GenericAPIError,
  GenericErrorResponse,
  GenericServiceResponse,
  GenericActionResult,
  LoggerConfig,
  FieldValidationResult,
  TypeValidationResult,
  RangeValidationResult,
  FieldType,
  NumericRange,
};

export class GenericLogger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    context: string,
    message: string,
    data?: any
  ) {
    if (!this.config.enableConsole) return;

    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) < levels.indexOf(this.config.logLevel)) return;

    const timestamp = new Date().toISOString();
    const logData = data ? { ...data } : {};
    const logMessage = `[${this.config.prefix}] ${timestamp} - ${context}: ${message}`;

    console[level === 'debug' ? 'log' : level](logMessage, logData);
  }

  debug(context: string, message: string, data?: any) {
    this.log('debug', context, message, data);
  }

  info(context: string, message: string, data?: any) {
    this.log('info', context, message, data);
  }

  warn(context: string, message: string, data?: any) {
    this.log('warn', context, message, data);
  }

  error(context: string, message: string, data?: any) {
    this.log('error', context, message, data);
  }
}

export class GenericErrorHandler {
  private logger: GenericLogger;
  private errorMessages: Record<string, string>;

  constructor(
    logger: GenericLogger,
    customErrorMessages?: Record<string, string>
  ) {
    this.logger = logger;
    this.errorMessages = {
      timeout_error:
        'La solicitud tardó demasiado tiempo. Por favor, inténtalo de nuevo.',
      network_error:
        'Error de conexión. Verifica tu conectividad e inténtalo de nuevo.',
      validation_error: 'Los datos proporcionados no son válidos.',
      http_error: 'Error del servidor. Por favor, inténtalo más tarde.',
      internal_error:
        'Error interno del sistema. Contacta al administrador si persiste.',
      unauthorized_error: 'No tienes autorización para realizar esta acción.',
      forbidden_error: 'Acceso denegado a este recurso.',
      not_found_error: 'El recurso solicitado no fue encontrado.',
      rate_limit_error: 'Demasiadas solicitudes. Inténtalo más tarde.',
      ...customErrorMessages,
    };
  }

  handleServiceError<T = never>(
    serviceError: GenericErrorResponse,
    context: string
  ): GenericActionResult<T> {
    this.logger.error(context, 'Error del servicio', {
      status: serviceError.status,
      endpoint: serviceError.endpoint,
      errorDetails: serviceError.error,
    });

    const firstError = serviceError.error.detail[0];
    const errorType = firstError?.type || 'unknown_error';
    const userMessage =
      this.errorMessages[errorType] ||
      'Error desconocido. Por favor, inténtalo de nuevo.';

    let detailedMessage = userMessage;
    if (errorType === 'validation_error') {
      detailedMessage = firstError.msg || userMessage;
    }

    return {
      success: false,
      error: {
        message: detailedMessage,
        code: errorType,
        details: {
          status: serviceError.status,
          endpoint: serviceError.endpoint,
          timestamp: serviceError.timestamp,
          originalError: serviceError.error.detail,
        },
      },
    };
  }

  handleUnexpectedError<T = never>(
    error: any,
    context: string
  ): GenericActionResult<T> {
    this.logger.error(context, 'Error inesperado', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });

    return {
      success: false,
      error: {
        message:
          'Error inesperado en el sistema. Por favor, inténtalo de nuevo.',
        code: 'unexpected_error',
        details: {
          originalError: error.message,
          timestamp: new Date().toISOString(),
        },
      },
    };
  }

  createValidationError<T = never>(
    message: string,
    context: string,
    details?: any
  ): GenericActionResult<T> {
    this.logger.warn(context, `Error de validación: ${message}`, details);

    return {
      success: false,
      error: {
        message,
        code: 'validation_error',
        details: {
          timestamp: new Date().toISOString(),
          context,
          ...details,
        },
      },
    };
  }

  mapHttpStatusToErrorType(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'validation_error',
      401: 'unauthorized_error',
      403: 'forbidden_error',
      404: 'not_found_error',
      408: 'timeout_error',
      429: 'rate_limit_error',
      500: 'internal_error',
      502: 'network_error',
      503: 'network_error',
      504: 'timeout_error',
    };

    return statusMap[status] || 'http_error';
  }
}

export class GenericValidator {
  private logger: GenericLogger;

  constructor(logger: GenericLogger) {
    this.logger = logger;
  }

  validateRequiredFields(
    input: any,
    requiredFields: string[],
    context: string
  ): FieldValidationResult {
    if (!input || typeof input !== 'object') {
      this.logger.warn(context, 'Input no es un objeto válido', {
        input: typeof input,
      });
      return { isValid: false, missingFields: ['input'] };
    }

    const missingFields = requiredFields.filter(
      field => input[field] === undefined || input[field] === null
    );

    if (missingFields.length > 0) {
      this.logger.warn(context, 'Campos requeridos faltantes', {
        missingFields,
        providedFields: Object.keys(input),
      });
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }

  validateTypes(
    input: any,
    fieldTypes: Record<string, FieldType>,
    context: string
  ): TypeValidationResult {
    const invalidFields: string[] = [];

    for (const [field, expectedType] of Object.entries(fieldTypes)) {
      if (input[field] !== undefined) {
        const actualType = Array.isArray(input[field])
          ? 'array'
          : typeof input[field];

        if (actualType !== expectedType) {
          invalidFields.push(field);
          this.logger.warn(context, `Tipo incorrecto para campo ${field}`, {
            field,
            expected: expectedType,
            actual: actualType,
            value: input[field],
          });
        }
      }
    }

    return {
      isValid: invalidFields.length === 0,
      invalidFields,
    };
  }

  validateNumericRanges(
    input: any,
    ranges: Record<string, NumericRange>,
    context: string
  ): RangeValidationResult {
    const outOfRangeFields: string[] = [];

    for (const [field, range] of Object.entries(ranges)) {
      if (typeof input[field] === 'number') {
        const value = input[field];
        const { min, max } = range;

        if (
          (min !== undefined && value < min) ||
          (max !== undefined && value > max)
        ) {
          outOfRangeFields.push(field);
          this.logger.warn(
            context,
            `Valor fuera de rango para campo ${field}`,
            {
              field,
              value,
              min,
              max,
            }
          );
        }
      }
    }

    return {
      isValid: outOfRangeFields.length === 0,
      outOfRangeFields,
    };
  }
}

export function createServiceLogger(serviceName: string): GenericLogger {
  return new GenericLogger({
    prefix: `${serviceName} Service`,
    enableConsole: true,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  });
}

export function createActionLogger(actionName: string): GenericLogger {
  return new GenericLogger({
    prefix: `${actionName} Action`,
    enableConsole: true,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  });
}

export function createErrorHandler(
  logger: GenericLogger,
  customMessages?: Record<string, string>
): GenericErrorHandler {
  return new GenericErrorHandler(logger, customMessages);
}

export function createValidator(logger: GenericLogger): GenericValidator {
  return new GenericValidator(logger);
}

export class TimeUtils {
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static getRetryDelay(
    attempt: number,
    baseDelay = 1000,
    maxDelay = 10000
  ): number {
    return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  }

  static createTimeout(ms: number, errorMessage?: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(errorMessage || `Timeout after ${ms}ms`)),
        ms
      );
    });
  }

  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage?: string
  ): Promise<T> {
    return Promise.race([
      promise,
      TimeUtils.createTimeout(timeoutMs, errorMessage),
    ]);
  }
}

export class RequestUtils {
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
