/**
 * Índice de tipos para toda la aplicación
 */

// ==================== TIPOS UTILITARIOS GENÉRICOS ====================
export type {
  // Error Types
  GenericAPIError,
  GenericErrorResponse,

  // Response Types  
  GenericServiceResponse,
  GenericActionResult,

  // Config Types
  LoggerConfig,
  RetryConfig,
  TimeoutConfig,

  // Validation Types
  FieldValidationResult,
  TypeValidationResult,
  RangeValidationResult,
  FieldType,
  NumericRange,

  // HTTP Types
  HTTPMethod,
  HTTPStatus,
  CommonHeaders,

  // Context Types
  ExecutionContext,
  RequestMetadata,

  // Utility Types
  PartialExcept,
  RequiredExcept,
  ExtractData,
  ExtractError,

  // Environment Types
  Environment,
  EnvironmentConfig,

  // Cache Types
  CacheStrategy,
  CacheConfig,
} from './util.types';

// ==================== TIPOS ESPECÍFICOS DE MÓDULOS ====================

// Re-export tipos específicos de módulos aquí cuando sea necesario
// Ejemplo:
// export type { UserProfile, UserPermissions } from './user.types';
// export type { ProductCatalog, ProductFilter } from './product.types';

// ==================== ALIASES COMUNES ====================

/**
 * Alias comunes para uso frecuente
 */
export type {
  GenericServiceResponse as ServiceResponse,
  GenericActionResult as ActionResult,
  GenericErrorResponse as ErrorResponse,
  GenericAPIError as APIError,
} from './util.types'; 