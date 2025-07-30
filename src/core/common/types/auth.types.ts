export interface LoginInput {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  is_active: boolean;
}

export interface UsersListResponse {
  users: User[];
  total: number;
}

export interface UpdateUserRequest extends Omit<User, 'id'> {}

export interface GetUserResponse extends User {}

export interface LoginResponse {
  access_token: string;
}

export interface Token {
  email: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
  is_admin_generated: boolean;
}

export interface TokensListResponse {
  tokens: Token[];
  total: number;
}

export interface GenerateTokenRequest {
  email: string;
  is_admin: boolean;
}

export interface RequestTokenInput {
  email: string;
}

export interface RequestTokenResponse {
  message: string;
}

export interface ValidateTokenInput {
  token: string;
}

export interface ValidateTokenResponse {
  access_token: string;
}

export interface APIErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

export interface APIError {
  detail: APIErrorDetail[];
}

export interface APIErrorResponse {
  error: APIError;
  status: number;
  endpoint: string;
  timestamp: string;
}

export type ServiceResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: APIErrorResponse;
    };
