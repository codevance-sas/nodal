export interface ActionError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

export type ActionResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: ActionError;
}; 