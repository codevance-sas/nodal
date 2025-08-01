'use server';

import { cookies } from 'next/headers';
import {
  createActionLogger,
  createErrorHandler,
  createValidator,
} from '@/lib/server-utils';
import {
  login,
  requestToken,
  validateToken,
  getAllTokens,
  generateToken,
  getAllowedDomains,
  addAllowedDomain,
  removeAllowedDomain,
} from '@/services/auth/auth.service';
import {
  LoginInput,
  LoginResponse,
  RequestTokenInput,
  RequestTokenResponse,
  ValidateTokenInput,
  ValidateTokenResponse,
  ServiceResponse,
  Token,
  TokensListResponse,
  GenerateTokenRequest,
  AllowedDomainsResponse,
  CreateDomainRequest,
  AllowedDomain,
} from '@/core/common/types/auth.types';
import { redirect } from 'next/navigation';
import type {
  ActionError,
  ActionResult,
} from '@/core/common/types/action.types';

const logger = createActionLogger('Auth');

function validateLoginInput(input: any, context: string): input is LoginInput {
  const requiredFields = ['email', 'password'];

  for (const field of requiredFields) {
    if (!(field in input)) {
      logger.warn(context, `Missing field: ${field}`, { input: typeof input });
      return false;
    }
    if (typeof input[field] !== 'string') {
      logger.warn(context, `Field ${field} must be a string`, {
        field,
        type: typeof input[field],
      });
      return false;
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    logger.warn(context, 'Invalid email format', { email: input.email });
    return false;
  }

  return true;
}

async function handleSuccessfulLogin(
  serviceResult: Extract<ServiceResponse<LoginResponse>, { success: true }>,
  actionName: string
): Promise<void> {
  logger.info(actionName, `${actionName} completed successfully`, {
    dataKeys: Object.keys(serviceResult.data),
  });

  const cookieStore = await cookies();
  cookieStore.set('access_token', serviceResult.data.access_token);
}

function createErrorResponse<T>(error: ActionError): ActionResult<T> {
  return {
    success: false,
    error,
  };
}

function handleServiceError<T>(
  serviceResult: Extract<ServiceResponse<T>, { success: false }>,
  actionName: string
): ActionResult<T> {
  const error: ActionError = {
    message:
      serviceResult.error.error.detail[0]?.msg || 'Service error occurred',
    code: 'service_error',
    details: {
      status: serviceResult.error.status,
      endpoint: serviceResult.error.endpoint,
      timestamp: serviceResult.error.timestamp,
      errorDetail: serviceResult.error.error.detail,
    },
  };

  logger.error(actionName, 'Service error', {
    error: serviceResult.error,
  });

  return createErrorResponse(error);
}

export async function loginAction(
  input: LoginInput
): Promise<void | ActionResult<LoginResponse>> {
  const actionName = 'login';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      hasInput: !!input,
      inputKeys: input ? Object.keys(input) : [],
    });

    // Validation
    if (!validateLoginInput(input, actionName)) {
      return createErrorResponse({
        message: 'The provided credentials are not in the correct format.',
        code: 'validation_error',
        details: { receivedInput: typeof input },
      });
    }

    // Service call
    const serviceResult = await login(input);

    // Handle result
    if (serviceResult.success) {
      await handleSuccessfulLogin(serviceResult, actionName);
      return {
        success: true,
        data: serviceResult.data,
      };
    }

    return handleServiceError(serviceResult, actionName);
  } catch (error: any) {
    if (error?.error === 'NEXT_REDIRECT') {
      throw error;
    }

    logger.error(actionName, 'Unexpected error', {
      error: error.message,
      stack: error.stack,
    });

    return createErrorResponse({
      message: 'An unexpected error occurred',
      code: 'unexpected_error',
      details: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export async function requestTokenAction(
  input: RequestTokenInput
): Promise<ActionResult<RequestTokenResponse>> {
  const actionName = 'requestToken';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      hasInput: !!input,
      inputKeys: input ? Object.keys(input) : [],
    });

    // Validation
    if (!input.email || typeof input.email !== 'string') {
      return createErrorResponse({
        message: 'Please provide a valid email address.',
        code: 'validation_error',
        details: { receivedInput: typeof input },
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return createErrorResponse({
        message: 'Please provide a valid email format.',
        code: 'validation_error',
        details: { email: input.email },
      });
    }

    // Service call
    const serviceResult = await requestToken(input);

    // Handle result
    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        dataKeys: Object.keys(serviceResult.data),
      });

      return {
        success: true,
        data: serviceResult.data,
      };
    }

    return handleServiceError(serviceResult, actionName);
  } catch (error: any) {
    logger.error(actionName, 'Unexpected error', {
      error: error.message,
      stack: error.stack,
    });

    return createErrorResponse({
      message: 'An unexpected error occurred',
      code: 'unexpected_error',
      details: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export async function logoutAction(): Promise<void> {
  const actionName = 'logout';

  try {
    logger.info(actionName, `Starting ${actionName} from client`);

    const cookieStore = await cookies();
    cookieStore.delete('access_token');

    logger.info(actionName, `${actionName} completed successfully`);

    redirect('/log-in');
  } catch (error: any) {
    logger.error(actionName, 'Unexpected error', {
      error: error.message,
      stack: error.stack,
    });

    throw error;
  }
}

export async function getAllTokensAction(
  skip?: number,
  limit?: number
): Promise<ActionResult<TokensListResponse>> {
  const actionName = 'getAllTokens';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      skip,
      limit,
    });

    const serviceResult = await getAllTokens(skip, limit);

    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        total: serviceResult.data.total,
        tokens: serviceResult.data.tokens.length,
      });

      return {
        success: true,
        data: serviceResult.data,
      };
    }

    return handleServiceError(serviceResult, actionName);
  } catch (error: any) {
    logger.error(actionName, 'Unexpected error', {
      error: error.message,
      stack: error.stack,
    });

    return createErrorResponse({
      message: 'An unexpected error occurred',
      code: 'unexpected_error',
      details: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

function validateGenerateTokenInput(
  input: any,
  context: string
): input is GenerateTokenRequest {
  if (!input || typeof input !== 'object') {
    logger.warn(context, 'Invalid input type', { type: typeof input });
    return false;
  }

  // Validate email
  if (!input.email || typeof input.email !== 'string') {
    logger.warn(context, 'Invalid or missing email', { email: input.email });
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    logger.warn(context, 'Invalid email format', { email: input.email });
    return false;
  }

  // Validate is_admin
  if (typeof input.is_admin !== 'boolean') {
    logger.warn(context, 'Invalid or missing is_admin flag', {
      is_admin: input.is_admin,
    });
    return false;
  }

  return true;
}

export async function generateTokenAction(
  input: GenerateTokenRequest
): Promise<ActionResult<Token>> {
  const actionName = 'generateToken';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      hasInput: !!input,
      inputKeys: input ? Object.keys(input) : [],
    });

    // Validation
    if (!validateGenerateTokenInput(input, actionName)) {
      return createErrorResponse({
        message: 'Invalid token generation request',
        code: 'validation_error',
        details: { receivedInput: input },
      });
    }

    const serviceResult = await generateToken(input);

    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        email: serviceResult.data.email,
        is_admin_generated: serviceResult.data.is_admin_generated,
      });

      return {
        success: true,
        data: serviceResult.data,
      };
    }

    return handleServiceError(serviceResult, actionName);
  } catch (error: any) {
    logger.error(actionName, 'Unexpected error', {
      error: error.message,
      stack: error.stack,
    });

    return createErrorResponse({
      message: 'An unexpected error occurred',
      code: 'unexpected_error',
      details: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export async function validateTokenAction(
  input: ValidateTokenInput
): Promise<ActionResult<ValidateTokenResponse>> {
  const actionName = 'validateToken';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      hasInput: !!input,
      inputKeys: input ? Object.keys(input) : [],
    });

    const serviceResult = await validateToken(input);

    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        dataKeys: Object.keys(serviceResult.data),
      });

      const cookieStore = await cookies();

      cookieStore.set('access_token', serviceResult.data.access_token);

      return {
        success: true,
        data: serviceResult.data,
      };
    }

    return handleServiceError(serviceResult, actionName);
  } catch (error: any) {
    logger.error(actionName, 'Unexpected error', {
      error: error.message,
      stack: error.stack,
    });

    return createErrorResponse({
      message: 'An unexpected error occurred',
      code: 'unexpected_error',
      details: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export async function getAllowedDomainsAction(
  skip?: number,
  limit?: number
): Promise<ActionResult<AllowedDomainsResponse>> {
  const actionName = 'getAllowedDomains';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      skip,
      limit,
    });

    const serviceResult = await getAllowedDomains(skip, limit);

    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        total: serviceResult.data.total,
        domains: serviceResult.data.domains.length,
      });

      return {
        success: true,
        data: serviceResult.data,
      };
    }

    return handleServiceError(serviceResult, actionName);
  } catch (error: any) {
    logger.error(actionName, 'Unexpected error', {
      error: error.message,
      stack: error.stack,
    });

    return createErrorResponse({
      message: 'An unexpected error occurred',
      code: 'unexpected_error',
      details: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

function validateCreateDomainInput(
  input: any,
  context: string
): input is CreateDomainRequest {
  if (!input || typeof input !== 'object') {
    logger.warn(context, 'Invalid input type', { type: typeof input });
    return false;
  }

  // Validate domain
  if (!input.domain || typeof input.domain !== 'string') {
    logger.warn(context, 'Invalid or missing domain', { domain: input.domain });
    return false;
  }

  // Basic domain format validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(input.domain)) {
    logger.warn(context, 'Invalid domain format', { domain: input.domain });
    return false;
  }

  // Validate description
  if (!input.description || typeof input.description !== 'string') {
    logger.warn(context, 'Invalid or missing description', {
      description: input.description,
    });
    return false;
  }

  if (input.description.length < 1 || input.description.length > 500) {
    logger.warn(context, 'Description length out of range', {
      length: input.description.length,
    });
    return false;
  }

  return true;
}

export async function addAllowedDomainAction(
  input: CreateDomainRequest
): Promise<ActionResult<AllowedDomain>> {
  const actionName = 'addAllowedDomain';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      hasInput: !!input,
      inputKeys: input ? Object.keys(input) : [],
    });

    // Validation
    if (!validateCreateDomainInput(input, actionName)) {
      return createErrorResponse({
        message: 'Invalid domain creation request',
        code: 'validation_error',
        details: { receivedInput: input },
      });
    }

    const serviceResult = await addAllowedDomain(input);

    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        domain: serviceResult.data.domain,
        description: serviceResult.data.description,
      });

      return {
        success: true,
        data: serviceResult.data,
      };
    }

    return handleServiceError(serviceResult, actionName);
  } catch (error: any) {
    logger.error(actionName, 'Unexpected error', {
      error: error.message,
      stack: error.stack,
    });

    return createErrorResponse({
      message: 'An unexpected error occurred',
      code: 'unexpected_error',
      details: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

function validateRemoveDomainInput(domain: any, context: string): domain is string {
  if (!domain || typeof domain !== 'string') {
    logger.warn(context, 'Invalid domain parameter', { domain: typeof domain });
    return false;
  }

  if (domain.trim().length === 0) {
    logger.warn(context, 'Empty domain parameter', { domain });
    return false;
  }

  // Basic domain format validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(domain)) {
    logger.warn(context, 'Invalid domain format', { domain });
    return false;
  }

  return true;
}

export async function removeAllowedDomainAction(
  domain: string
): Promise<ActionResult<any>> {
  const actionName = 'removeAllowedDomain';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      domain,
    });

    // Validation
    if (!validateRemoveDomainInput(domain, actionName)) {
      return createErrorResponse({
        message: 'Invalid domain parameter',
        code: 'validation_error',
        details: { receivedDomain: domain },
      });
    }

    const serviceResult = await removeAllowedDomain(domain);

    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        domain,
      });

      return {
        success: true,
        data: serviceResult.data,
      };
    }

    return handleServiceError(serviceResult, actionName);
  } catch (error: any) {
    logger.error(actionName, 'Unexpected error', {
      error: error.message,
      stack: error.stack,
    });

    return createErrorResponse({
      message: 'An unexpected error occurred',
      code: 'unexpected_error',
      details: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
