'use server';

import {
  createActionLogger,
  createErrorHandler,
  createValidator,
} from '@/lib/server-utils';
import {
  getUsers,
  getUserById,
  updateUser,
  activateUser,
  deactivateUser,
  setUserRole,
} from '@/services/users/users.service';
import type {
  ActionError,
  ActionResult,
} from '@/core/common/types/action.types';
import type {
  User,
  UsersListResponse,
  UpdateUserRequest,
  ServiceResponse,
} from '@/core/common/types/auth.types';

const logger = createActionLogger('Users');

function validateUpdateUserData(
  input: any,
  context: string
): input is UpdateUserRequest {
  const requiredFields = ['email', 'role', 'is_active'];

  for (const field of requiredFields) {
    if (!(field in input)) {
      logger.warn(context, `Missing field: ${field}`, { input: typeof input });
      return false;
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    logger.warn(context, 'Invalid email format', { email: input.email });
    return false;
  }

  // Validate role
  if (!['user', 'admin'].includes(input.role)) {
    logger.warn(context, 'Invalid role', { role: input.role });
    return false;
  }

  // Validate is_active
  if (typeof input.is_active !== 'boolean') {
    logger.warn(context, 'Invalid is_active value', {
      is_active: input.is_active,
    });
    return false;
  }

  return true;
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

export async function getUsersAction(
  skip?: number,
  limit?: number
): Promise<ActionResult<UsersListResponse>> {
  const actionName = 'getUsers';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      skip,
      limit,
    });

    const serviceResult = await getUsers(skip, limit);

    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        total: serviceResult.data.total,
        users: serviceResult.data.users.length,
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

export async function getUserByIdAction(
  userId: number
): Promise<ActionResult<User>> {
  const actionName = 'getUserById';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      userId,
    });

    const serviceResult = await getUserById(userId);

    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        user: serviceResult.data,
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

export async function updateUserAction(
  userId: number,
  userData: UpdateUserRequest
): Promise<ActionResult<User>> {
  const actionName = 'updateUser';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      userId,
      userData,
    });

    if (!validateUpdateUserData(userData, actionName)) {
      return createErrorResponse({
        message: 'Invalid user data provided',
        code: 'validation_error',
        details: { receivedInput: userData },
      });
    }

    const serviceResult = await updateUser(userId, userData);

    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        user: serviceResult.data,
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

export async function activateUserAction(
  userId: number
): Promise<ActionResult<User>> {
  const actionName = 'activateUser';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      userId,
    });

    const serviceResult = await activateUser(userId);

    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        user: serviceResult.data,
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

export async function deactivateUserAction(
  userId: number
): Promise<ActionResult<User>> {
  const actionName = 'deactivateUser';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      userId,
    });

    const serviceResult = await deactivateUser(userId);

    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        user: serviceResult.data,
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

export async function setUserRoleAction(
  userId: number,
  role: 'user' | 'admin'
): Promise<ActionResult<User>> {
  const actionName = 'setUserRole';

  try {
    logger.info(actionName, `Starting ${actionName} from client`, {
      userId,
      role,
    });

    if (!['user', 'admin'].includes(role)) {
      return createErrorResponse({
        message: 'Invalid role provided',
        code: 'validation_error',
        details: { receivedRole: role },
      });
    }

    const serviceResult = await setUserRole(userId, role);

    if (serviceResult.success) {
      logger.info(actionName, `${actionName} completed successfully`, {
        user: serviceResult.data,
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
