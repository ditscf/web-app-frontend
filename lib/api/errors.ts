import { isAxiosError, isCancel } from 'axios';
import { z } from 'zod';

export type ApiErrorKind =
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'server'
  | 'network'
  | 'canceled'
  | 'unknown';

const NETWORK_ERROR_MESSAGE = "We couldn't reach the server. Check your connection and try again.";
const SERVER_ERROR_MESSAGE = 'Something went wrong on our side. Please try again.';
const UNKNOWN_ERROR_MESSAGE = 'Something went wrong. Please try again.';

const nestErrorBodySchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
});

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly messages: string[];

  constructor(kind: ApiErrorKind, status: number | null, messages: string[], cause?: unknown) {
    super(messages[0] ?? UNKNOWN_ERROR_MESSAGE, { cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.messages = messages;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getUserFacingMessage(error: unknown): string {
  const apiError = toApiError(error);
  if (apiError.kind === 'server') return SERVER_ERROR_MESSAGE;
  return apiError.message;
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;
  if (isCancel(error)) return new ApiError('canceled', null, ['The request was canceled.'], error);
  if (!isAxiosError(error)) return new ApiError('unknown', null, [UNKNOWN_ERROR_MESSAGE], error);
  if (!error.response) return new ApiError('network', null, [NETWORK_ERROR_MESSAGE], error);

  const { status, data } = error.response;
  const kind = classifyStatus(status);
  const messages = readNestMessages(data);
  if (messages.length > 0) return new ApiError(kind, status, messages, error);

  const fallback = kind === 'server' ? SERVER_ERROR_MESSAGE : UNKNOWN_ERROR_MESSAGE;
  return new ApiError(kind, status, [fallback], error);
}

function classifyStatus(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
}

function readNestMessages(data: unknown): string[] {
  const parsed = nestErrorBodySchema.safeParse(data);
  if (!parsed.success) return [];

  const { message } = parsed.data;
  return typeof message === 'string' ? [message] : message;
}
