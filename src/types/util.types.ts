// ====================== TIPOS DE ERROR GENÉRICOS ======================

export interface GenericAPIError {
  detail: Array<{
    loc: [string, number];
    msg: string;
    type: string;
  }>;
}

export interface GenericErrorResponse {
  error: GenericAPIError;
  status: number;
  endpoint: string;
  timestamp: string;
}

// ====================== TIPOS DE RESPUESTA GENÉRICOS ======================

export interface GenericServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: GenericErrorResponse;
}

export interface GenericActionResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

// ====================== TIPOS DE CONFIGURACIÓN ======================

export interface LoggerConfig {
  prefix: string;
  enableConsole: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface TimeoutConfig {
  requestTimeout: number;
  connectionTimeout: number;
}

// ====================== TIPOS DE VALIDACIÓN ======================

export interface FieldValidationResult {
  isValid: boolean;
  missingFields: string[];
}

export interface TypeValidationResult {
  isValid: boolean;
  invalidFields: string[];
}

export interface RangeValidationResult {
  isValid: boolean;
  outOfRangeFields: string[];
}

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface NumericRange {
  min?: number;
  max?: number;
}

// ====================== TIPOS DE HTTP ======================

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HTTPStatus =
  | 200
  | 201
  | 202
  | 204
  | 400
  | 401
  | 403
  | 404
  | 408
  | 429
  | 500
  | 502
  | 503
  | 504;

export interface CommonHeaders {
  'Content-Type'?: string;
  Accept?: string;
  Authorization?: string;
  'User-Agent'?: string;
  'X-API-Key'?: string;
}

// ====================== TIPOS DE CONTEXTO ======================

export interface ExecutionContext {
  module: string;
  function: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
}

export interface RequestMetadata {
  startTime: number;
  endTime?: number;
  duration?: number;
  attempt: number;
  maxAttempts: number;
}

// ====================== TIPOS UTILITARIOS ======================

export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type RequiredExcept<T, K extends keyof T> = Required<T> &
  Partial<Pick<T, K>>;

export type ExtractData<T> = T extends GenericServiceResponse<infer U>
  ? U
  : never;

export type ExtractError<T> = T extends GenericActionResult<any>
  ? NonNullable<T['error']>
  : never;

// ====================== TIPOS DE ENTORNO ======================

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface EnvironmentConfig {
  apiUrl: string;
  logLevel: LoggerConfig['logLevel'];
  enableDebug: boolean;
  timeout: TimeoutConfig;
  retry: RetryConfig;
}

// ====================== TIPOS DE CACHE ======================

export type CacheStrategy =
  | 'no-cache'
  | 'no-store'
  | 'reload'
  | 'force-cache'
  | 'only-if-cached';

export interface CacheConfig {
  strategy: CacheStrategy;
  maxAge?: number;
  staleWhileRevalidate?: number;
}
