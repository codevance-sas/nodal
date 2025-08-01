'use server';

import { createServiceLogger, RequestUtils } from '@/lib/server-utils';
import {
  APIErrorResponse,
  LoginInput,
  LoginResponse,
  ServiceResponse,
  RequestTokenInput,
  RequestTokenResponse,
  ValidateTokenInput,
  ValidateTokenResponse,
  GetUserResponse,
  Token,
  TokensListResponse,
  GenerateTokenRequest,
  AllowedDomainsResponse,
  CreateDomainRequest,
  AllowedDomain,
} from '@/core/common/types/auth.types';
import { REQUEST_CONFIG } from '@/config/request.config';
import { cookies } from 'next/headers';

const logger = createServiceLogger('Auth');

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

// ====================== LOGIN FUNCTION ======================

export async function login(
  input: LoginInput
): Promise<ServiceResponse<LoginResponse>> {
  'use server';

  const url = `${REQUEST_CONFIG.BASE_URL}/auth/login`;

  logger.info('login', 'Starting login request', {
    endpoint: 'auth/login',
    url,
  });

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info('login', `Attempt ${attempt}/${REQUEST_CONFIG.MAX_RETRIES}`, {
        endpoint: 'auth/login',
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
          body: JSON.stringify(input),
          cache: 'no-store',
        },
        REQUEST_CONFIG.TIMEOUT
      );

      logger.info('login', 'Response received', {
        endpoint: 'auth/login',
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('login', 'Login successful', {
          endpoint: 'auth/login',
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as LoginResponse,
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
        endpoint: 'auth/login',
        timestamp: new Date().toISOString(),
      };

      logger.error('login', 'API Error', {
        endpoint: 'auth/login',
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
        logger.warn('login', `Retrying in ${delay}ms`, {
          endpoint: 'auth/login',
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
      logger.error('login', `Error in attempt ${attempt}`, {
        endpoint: 'auth/login',
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, 'auth/login', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('login', `Retrying after error in ${delay}ms`, {
          endpoint: 'auth/login',
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
      'auth/login',
      REQUEST_CONFIG.MAX_RETRIES
    ),
  };
}

export async function requestToken(
  input: RequestTokenInput
): Promise<ServiceResponse<RequestTokenResponse>> {
  'use server';

  const url = `${REQUEST_CONFIG.BASE_URL}/auth/request-token`;

  logger.info('requestToken', 'Starting request token request', {
    endpoint: 'auth/request-token',
    url,
  });

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info(
        'requestToken',
        `Attempt ${attempt}/${REQUEST_CONFIG.MAX_RETRIES}`,
        {
          endpoint: 'auth/request-token',
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
          body: JSON.stringify(input),
          cache: 'no-store',
        },
        REQUEST_CONFIG.TIMEOUT
      );

      logger.info('requestToken', 'Response received', {
        endpoint: 'auth/request-token',
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('requestToken', 'Token request successful', {
          endpoint: 'auth/request-token',
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as RequestTokenResponse,
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
        endpoint: 'auth/request-token',
        timestamp: new Date().toISOString(),
      };

      logger.error('requestToken', 'API Error', {
        endpoint: 'auth/request-token',
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
        logger.warn('requestToken', `Retrying in ${delay}ms`, {
          endpoint: 'auth/request-token',
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
      logger.error('requestToken', `Error in attempt ${attempt}`, {
        endpoint: 'auth/request-token',
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, 'auth/request-token', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('requestToken', `Retrying after error in ${delay}ms`, {
          endpoint: 'auth/request-token',
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
      'auth/request-token',
      REQUEST_CONFIG.MAX_RETRIES
    ),
  };
}

export async function validateToken(
  input: ValidateTokenInput
): Promise<ServiceResponse<ValidateTokenResponse>> {
  'use server';

  const url = `${REQUEST_CONFIG.BASE_URL}/auth/validate-token`;

  logger.info('validateToken', 'Starting validate token request', {
    endpoint: 'auth/validate-token',
    url,
  });

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info(
        'validateToken',
        `Attempt ${attempt}/${REQUEST_CONFIG.MAX_RETRIES}`,
        {
          endpoint: 'auth/validate-token',
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
          body: JSON.stringify(input),
          cache: 'no-store',
        },
        REQUEST_CONFIG.TIMEOUT
      );

      logger.info('validateToken', 'Response received', {
        endpoint: 'auth/validate-token',
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('validateToken', 'Token validation successful', {
          endpoint: 'auth/validate-token',
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as ValidateTokenResponse,
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
        endpoint: 'auth/validate-token',
        timestamp: new Date().toISOString(),
      };

      logger.error('validateToken', 'API Error', {
        endpoint: 'auth/validate-token',
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
        logger.warn('validateToken', `Retrying in ${delay}ms`, {
          endpoint: 'auth/validate-token',
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
      logger.error('validateToken', `Error in attempt ${attempt}`, {
        endpoint: 'auth/validate-token',
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, 'auth/validate-token', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('validateToken', `Retrying after error in ${delay}ms`, {
          endpoint: 'auth/validate-token',
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
      'auth/validate-token',
      REQUEST_CONFIG.MAX_RETRIES
    ),
  };
}

export async function getAllTokens(
  skip?: number,
  limit?: number
): Promise<ServiceResponse<TokensListResponse>> {
  'use server';

  const queryParams = new URLSearchParams();
  if (typeof skip === 'number') queryParams.append('skip', skip.toString());
  if (typeof limit === 'number') queryParams.append('limit', limit.toString());

  const url = `${REQUEST_CONFIG.BASE_URL}/auth/admin/tokens${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

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
        endpoint: 'auth/admin/tokens',
        timestamp: new Date().toISOString(),
      },
    };
  }

  logger.info('getAllTokens', 'Starting get all tokens request', {
    endpoint: 'auth/admin/tokens',
    url,
  });

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info(
        'getAllTokens',
        `Attempt ${attempt}/${REQUEST_CONFIG.MAX_RETRIES}`,
        {
          endpoint: 'auth/admin/tokens',
          attempt,
          url,
        }
      );

      const response = await RequestUtils.fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        },
        REQUEST_CONFIG.TIMEOUT
      );

      logger.info('getAllTokens', 'Response received', {
        endpoint: 'auth/admin/tokens',
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('getAllTokens', 'Get tokens successful', {
          endpoint: 'auth/admin/tokens',
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as TokensListResponse,
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
        endpoint: 'auth/admin/tokens',
        timestamp: new Date().toISOString(),
      };

      logger.error('getAllTokens', 'API Error', {
        endpoint: 'auth/admin/tokens',
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
        logger.warn('getAllTokens', `Retrying in ${delay}ms`, {
          endpoint: 'auth/admin/tokens',
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
      logger.error('getAllTokens', `Error in attempt ${attempt}`, {
        endpoint: 'auth/admin/tokens',
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, 'auth/admin/tokens', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('getAllTokens', `Retrying after error in ${delay}ms`, {
          endpoint: 'auth/admin/tokens',
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
      'auth/admin/tokens',
      REQUEST_CONFIG.MAX_RETRIES
    ),
  };
}

export async function generateToken(
  data: GenerateTokenRequest
): Promise<ServiceResponse<Token>> {
  'use server';

  const url = `${REQUEST_CONFIG.BASE_URL}/auth/admin/generate-token`;
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
        endpoint: 'auth/admin/generate-token',
        timestamp: new Date().toISOString(),
      },
    };
  }

  logger.info('generateToken', 'Starting generate token request', {
    endpoint: 'auth/admin/generate-token',
    url,
    data,
  });

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info(
        'generateToken',
        `Attempt ${attempt}/${REQUEST_CONFIG.MAX_RETRIES}`,
        {
          endpoint: 'auth/admin/generate-token',
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
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(data),
          cache: 'no-store',
        },
        REQUEST_CONFIG.TIMEOUT
      );

      logger.info('generateToken', 'Response received', {
        endpoint: 'auth/admin/generate-token',
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('generateToken', 'Generate token successful', {
          endpoint: 'auth/admin/generate-token',
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as Token,
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
        endpoint: 'auth/admin/generate-token',
        timestamp: new Date().toISOString(),
      };

      logger.error('generateToken', 'API Error', {
        endpoint: 'auth/admin/generate-token',
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
        logger.warn('generateToken', `Retrying in ${delay}ms`, {
          endpoint: 'auth/admin/generate-token',
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
      logger.error('generateToken', `Error in attempt ${attempt}`, {
        endpoint: 'auth/admin/generate-token',
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, 'auth/admin/generate-token', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('generateToken', `Retrying after error in ${delay}ms`, {
          endpoint: 'auth/admin/generate-token',
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
      'auth/admin/generate-token',
      REQUEST_CONFIG.MAX_RETRIES
    ),
  };
}

export async function getAllowedDomains(
  skip?: number,
  limit?: number
): Promise<ServiceResponse<AllowedDomainsResponse>> {
  'use server';

  const queryParams = new URLSearchParams();
  if (typeof skip === 'number') queryParams.append('skip', skip.toString());
  if (typeof limit === 'number') queryParams.append('limit', limit.toString());

  const url = `${REQUEST_CONFIG.BASE_URL}/auth/allowed-domains${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

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
        endpoint: 'auth/allowed-domains',
        timestamp: new Date().toISOString(),
      },
    };
  }

  logger.info('getAllowedDomains', 'Starting get allowed domains request', {
    endpoint: 'auth/allowed-domains',
    url,
  });

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info(
        'getAllowedDomains',
        `Attempt ${attempt}/${REQUEST_CONFIG.MAX_RETRIES}`,
        {
          endpoint: 'auth/allowed-domains',
          attempt,
          url,
        }
      );

      const response = await RequestUtils.fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        },
        REQUEST_CONFIG.TIMEOUT
      );

      logger.info('getAllowedDomains', 'Response received', {
        endpoint: 'auth/allowed-domains',
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('getAllowedDomains', 'Get allowed domains successful', {
          endpoint: 'auth/allowed-domains',
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as AllowedDomainsResponse,
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
        endpoint: 'auth/allowed-domains',
        timestamp: new Date().toISOString(),
      };

      logger.error('getAllowedDomains', 'API Error', {
        endpoint: 'auth/allowed-domains',
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
        logger.warn('getAllowedDomains', `Retrying in ${delay}ms`, {
          endpoint: 'auth/allowed-domains',
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
      logger.error('getAllowedDomains', `Error in attempt ${attempt}`, {
        endpoint: 'auth/allowed-domains',
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, 'auth/allowed-domains', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('getAllowedDomains', `Retrying after error in ${delay}ms`, {
          endpoint: 'auth/allowed-domains',
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
      'auth/allowed-domains',
      REQUEST_CONFIG.MAX_RETRIES
    ),
  };
}

export async function addAllowedDomain(
  data: CreateDomainRequest
): Promise<ServiceResponse<AllowedDomain>> {
  'use server';

  const url = `${REQUEST_CONFIG.BASE_URL}/auth/allowed-domains`;
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
        endpoint: 'auth/allowed-domains',
        timestamp: new Date().toISOString(),
      },
    };
  }

  logger.info('addAllowedDomain', 'Starting add allowed domain request', {
    endpoint: 'auth/allowed-domains',
    url,
    data,
  });

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info(
        'addAllowedDomain',
        `Attempt ${attempt}/${REQUEST_CONFIG.MAX_RETRIES}`,
        {
          endpoint: 'auth/allowed-domains',
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
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(data),
          cache: 'no-store',
        },
        REQUEST_CONFIG.TIMEOUT
      );

      logger.info('addAllowedDomain', 'Response received', {
        endpoint: 'auth/allowed-domains',
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('addAllowedDomain', 'Add allowed domain successful', {
          endpoint: 'auth/allowed-domains',
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as AllowedDomain,
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
        endpoint: 'auth/allowed-domains',
        timestamp: new Date().toISOString(),
      };

      logger.error('addAllowedDomain', 'API Error', {
        endpoint: 'auth/allowed-domains',
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
        logger.warn('addAllowedDomain', `Retrying in ${delay}ms`, {
          endpoint: 'auth/allowed-domains',
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
      logger.error('addAllowedDomain', `Error in attempt ${attempt}`, {
        endpoint: 'auth/allowed-domains',
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, 'auth/allowed-domains', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('addAllowedDomain', `Retrying after error in ${delay}ms`, {
          endpoint: 'auth/allowed-domains',
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
      'auth/allowed-domains',
      REQUEST_CONFIG.MAX_RETRIES
    ),
  };
}

export async function removeAllowedDomain(
  domain: string
): Promise<ServiceResponse<any>> {
  'use server';

  const url = `${REQUEST_CONFIG.BASE_URL}/auth/allowed-domains/${encodeURIComponent(domain)}`;
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
        endpoint: 'auth/allowed-domains',
        timestamp: new Date().toISOString(),
      },
    };
  }

  logger.info('removeAllowedDomain', 'Starting remove allowed domain request', {
    endpoint: 'auth/allowed-domains',
    url,
    domain,
  });

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info(
        'removeAllowedDomain',
        `Attempt ${attempt}/${REQUEST_CONFIG.MAX_RETRIES}`,
        {
          endpoint: 'auth/allowed-domains',
          attempt,
          url,
        }
      );

      const response = await RequestUtils.fetchWithTimeout(
        url,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        },
        REQUEST_CONFIG.TIMEOUT
      );

      logger.info('removeAllowedDomain', 'Response received', {
        endpoint: 'auth/allowed-domains',
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        logger.info('removeAllowedDomain', 'Remove allowed domain successful', {
          endpoint: 'auth/allowed-domains',
          attempt,
          domain,
        });

        return {
          success: true,
          data: { message: 'Domain removed successfully' },
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
        endpoint: 'auth/allowed-domains',
        timestamp: new Date().toISOString(),
      };

      logger.error('removeAllowedDomain', 'API Error', {
        endpoint: 'auth/allowed-domains',
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
        logger.warn('removeAllowedDomain', `Retrying in ${delay}ms`, {
          endpoint: 'auth/allowed-domains',
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
      logger.error('removeAllowedDomain', `Error in attempt ${attempt}`, {
        endpoint: 'auth/allowed-domains',
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, 'auth/allowed-domains', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('removeAllowedDomain', `Retrying after error in ${delay}ms`, {
          endpoint: 'auth/allowed-domains',
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
      'auth/allowed-domains',
      REQUEST_CONFIG.MAX_RETRIES
    ),
  };
}

export async function getUser(): Promise<ServiceResponse<GetUserResponse>> {
  'use server';

  const url = `${REQUEST_CONFIG.BASE_URL}/auth/me`;
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
        endpoint: 'auth/me',
        timestamp: new Date().toISOString(),
      },
    };
  }

  logger.info('getUser', 'Starting get user request', {
    endpoint: 'auth/me',
    url,
  });

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
      logger.info(
        'getUser',
        `Attempt ${attempt}/${REQUEST_CONFIG.MAX_RETRIES}`,
        {
          endpoint: 'auth/me',
          attempt,
          url,
        }
      );

      const response = await RequestUtils.fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        },
        REQUEST_CONFIG.TIMEOUT
      );

      logger.info('getUser', 'Response received', {
        endpoint: 'auth/me',
        attempt,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('getUser', 'Get user successful', {
          endpoint: 'auth/me',
          attempt,
          dataKeys: data ? Object.keys(data) : [],
        });

        return {
          success: true,
          data: data as GetUserResponse,
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
        endpoint: 'auth/me',
        timestamp: new Date().toISOString(),
      };

      logger.error('getUser', 'API Error', {
        endpoint: 'auth/me',
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
        logger.warn('getUser', `Retrying in ${delay}ms`, {
          endpoint: 'auth/me',
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
      logger.error('getUser', `Error in attempt ${attempt}`, {
        endpoint: 'auth/me',
        attempt,
        error: error.message,
        stack: error.stack,
      });

      const apiError = handleAPIError(error, 'auth/me', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
        logger.warn('getUser', `Retrying after error in ${delay}ms`, {
          endpoint: 'auth/me',
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
      'auth/me',
      REQUEST_CONFIG.MAX_RETRIES
    ),
  };
}
