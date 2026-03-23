/**
 * Error Handling Utilities
 * 
 * Consistent error handling patterns across the application.
 */

import { ERROR_MESSAGES } from './constants';

/**
 * Extract a user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return ERROR_MESSAGES.unknownError;
}

/**
 * Error state type for UI display
 */
export interface ErrorState {
  title: string;
  message?: string;
  showRefresh?: boolean;
  showNewChat?: boolean;
}

/**
 * Create a connection error state
 */
export function createConnectionError(error?: unknown): ErrorState {
  return {
    title: "Connection Error",
    message: error ? getErrorMessage(error) : ERROR_MESSAGES.connectionError,
    showRefresh: true,
    showNewChat: true,
  };
}

/**
 * Create a load thread error state
 */
export function createLoadThreadError(error?: unknown): ErrorState {
  return {
    title: "Load Thread Failed",
    message: error ? getErrorMessage(error) : ERROR_MESSAGES.loadThreadFailed,
    showRefresh: false,
    showNewChat: true,
  };
}

/**
 * Log error with context and return user-friendly message
 */
export function handleError(
  context: string,
  error: unknown,
  logger: (msg: string, err: unknown) => void = console.error
): string {
  const message = getErrorMessage(error);
  logger(`[${context}] ${message}`, error);
  return message;
}
