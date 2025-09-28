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

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
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

      if (response.ok) {
        const data = await response.json();

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

        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      const apiError = handleAPIError(error, 'auth/login', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);

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

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
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

      if (response.ok) {
        const data = await response.json();

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

        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      const apiError = handleAPIError(error, 'auth/request-token', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);

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

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
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

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          return {
            success: true,

            data: data as ValidateTokenResponse,
          };
        } else {
          return {
            success: false,
            error: {
              error: data,
              status: response.status,
              endpoint: 'auth/validate-token',
              timestamp: new Date().toISOString(),
            },
            message: data.message,
          };
        }
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

        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      const apiError = handleAPIError(error, 'auth/validate-token', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);

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

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
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

      if (response.ok) {
        const data = await response.json();

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

        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      const apiError = handleAPIError(error, 'auth/admin/tokens', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
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

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
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

      if (response.ok) {
        const data = await response.json();

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

        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      const apiError = handleAPIError(
        error,
        'auth/admin/generate-token',
        attempt
      );

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);

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

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
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

      if (response.ok) {
        const data = await response.json();

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

        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      const apiError = handleAPIError(error, 'auth/allowed-domains', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);

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

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
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

      if (response.ok) {
        const data = await response.json();

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

        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      const apiError = handleAPIError(error, 'auth/allowed-domains', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);

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

  const url = `${
    REQUEST_CONFIG.BASE_URL
  }/auth/allowed-domains/${encodeURIComponent(domain)}`;
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

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
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

      if (response.ok) {
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

        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      const apiError = handleAPIError(error, 'auth/allowed-domains', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);

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

  for (let attempt = 1; attempt <= REQUEST_CONFIG.MAX_RETRIES; attempt++) {
    try {
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

      if (response.ok) {
        const data = await response.json();

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
        await RequestUtils.delay(delay);
        continue;
      }

      return {
        success: false,
        error: apiError,
      };
    } catch (error: any) {
      const apiError = handleAPIError(error, 'auth/me', attempt);

      if (attempt < REQUEST_CONFIG.MAX_RETRIES) {
        const delay = RequestUtils.getRetryDelay(attempt - 1);
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
