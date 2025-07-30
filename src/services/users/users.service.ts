'use server';

import { createServiceLogger, RequestUtils } from '@/lib/server-utils';
import {
  APIErrorResponse,
  ServiceResponse,
  User,
  UsersListResponse,
  UpdateUserRequest,
} from '@/core/common/types/auth.types';
import { REQUEST_CONFIG } from '@/config/request.config';
import { cookies } from 'next/headers';

const logger = createServiceLogger('Users');

function handleAPIError(
  error: any,
  endpoint: string,
  attempt: number
): APIErrorResponse {
  const timestamp = new Date().toISOString();

  // Network or timeout error
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      error: {
        detail: [
          {
            loc: ['network', `${0}`],
            msg: 'Request timeout - The request exceeded the time limit',
            type: 'timeout_error',
          },
        ],
      },
      status: 408,
      endpoint,
      timestamp,
    };
  }

  // Network error
  if (error.code === 'ENOTFOUND' || error.message?.includes('fetch')) {
    return {
      error: {
        detail: [
          {
            loc: ['network', `${0}`],
            msg: 'Connection error - Could not connect to server',
            type: 'network_error',
          },
        ],
      },
      status: 503,
      endpoint,
      timestamp,
    };
  }

  // Generic error
  return {
    error: {
      detail: [
        {
          loc: ['unknown', `${attempt}`],
          msg: error.message || 'Unknown server error',
          type: 'internal_error',
        },
      ],
    },
    status: 500,
    endpoint,
    timestamp,
  };
}

async function makeAuthenticatedRequest<T>(
  url: string,
  method: string,
  endpoint: string,
  body?: any
): Promise<ServiceResponse<T>> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return {
      success: false,
      error: {
        error: {
          detail: [
            {
              loc: ['auth', '0'],
              msg: 'No access token found',
              type: 'auth_error',
            },
          ],
        },
        status: 401,
        endpoint,
        timestamp: new Date().toISOString(),
      },
    };
  }

  logger.info(endpoint, `Starting ${endpoint} request`, { url });

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info(
        endpoint,
        `Attempt ${attempt}/${REQUEST_CONFIG.MAX_RETRIES}`,
        {
          attempt,
          url,
        }
      );

      const response = await RequestUtils.fetchWithTimeout(
        url,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          ...(body && { body: JSON.stringify(body) }),
          cache: 'no-store',
        },
        REQUEST_CONFIG.TIMEOUT
      );

      logger.info(endpoint, 'Response received', {
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        logger.info(endpoint, `${endpoint} successful`, {
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as T,
        };
      }

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
        endpoint,
        timestamp: new Date().toISOString(),
      };

      logger.error(endpoint, 'API Error', {
        attempt,
        status: response.status,
        error: errorData,
      });

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

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn(endpoint, `Retrying in ${delay}ms`, {
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
      logger.error(endpoint, `Error in attempt ${attempt}`, {
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, endpoint, attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn(endpoint, `Retrying after error in ${delay}ms`, {
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

  return {
    success: false,
    error: handleAPIError(
      new Error('Maximum number of retries exceeded'),
      endpoint,
      REQUEST_CONFIG.MAX_RETRIES
    ),
  };
}

export async function getUsers(
  skip?: number,
  limit?: number
): Promise<ServiceResponse<UsersListResponse>> {
  'use server';

  const queryParams = new URLSearchParams();
  if (typeof skip === 'number') queryParams.append('skip', skip.toString());
  if (typeof limit === 'number') queryParams.append('limit', limit.toString());

  const url = `${REQUEST_CONFIG.BASE_URL}/users/${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  return makeAuthenticatedRequest<UsersListResponse>(url, 'GET', 'users/list');
}

export async function getUserById(
  userId: number
): Promise<ServiceResponse<User>> {
  'use server';

  const url = `${REQUEST_CONFIG.BASE_URL}/users/${userId}`;
  return makeAuthenticatedRequest<User>(url, 'GET', 'users/get');
}

export async function updateUser(
  userId: number,
  userData: UpdateUserRequest
): Promise<ServiceResponse<User>> {
  'use server';

  const url = `${REQUEST_CONFIG.BASE_URL}/users/${userId}`;
  return makeAuthenticatedRequest<User>(url, 'PUT', 'users/update', userData);
}

export async function activateUser(
  userId: number
): Promise<ServiceResponse<User>> {
  'use server';

  const url = `${REQUEST_CONFIG.BASE_URL}/users/${userId}/activate`;
  return makeAuthenticatedRequest<User>(url, 'PATCH', 'users/activate');
}

export async function deactivateUser(
  userId: number
): Promise<ServiceResponse<User>> {
  'use server';

  const url = `${REQUEST_CONFIG.BASE_URL}/users/${userId}/deactivate`;
  return makeAuthenticatedRequest<User>(url, 'PATCH', 'users/deactivate');
}

export async function setUserRole(
  userId: number,
  role: 'user' | 'admin'
): Promise<ServiceResponse<User>> {
  'use server';

  const url = `${REQUEST_CONFIG.BASE_URL}/users/${userId}/role`;
  return makeAuthenticatedRequest<User>(url, 'PATCH', 'users/set-role', {
    role,
  });
}
