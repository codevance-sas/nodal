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
