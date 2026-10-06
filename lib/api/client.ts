import axios, { isAxiosError } from 'axios';
import type { z } from 'zod';
import { SERVER_URI } from '@/constants/constant';
import { ApiError, toApiError } from '@/lib/api/errors';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Set when a 401 from this request does not mean the NestJS session is invalid (e.g. a wrong login code). */
    skipUnauthenticatedHandler?: boolean;
  }
}

type UnauthenticatedHandler = () => void;

const REQUEST_TIMEOUT_MS = 15_000;

let unauthenticatedHandler: UnauthenticatedHandler | null = null;

if (!SERVER_URI) {
  throw new Error('NEXT_PUBLIC_API_URL is not set.');
}

// Custom headers are not allowed by the API's CORS policy (Content-Type only),
// and the ditscf.session cookie is attached by the browser via withCredentials.
export const apiClient = axios.create({
  baseURL: SERVER_URI,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

apiClient.interceptors.response.use(undefined, (error: unknown) => {
  const apiError = toApiError(error);
  const isHandlerSkipped = isAxiosError(error) && error.config?.skipUnauthenticatedHandler === true;
  if (apiError.kind === 'unauthenticated' && !isHandlerSkipped) unauthenticatedHandler?.();
  return Promise.reject(apiError);
});

export function setUnauthenticatedHandler(handler: UnauthenticatedHandler | null): void {
  unauthenticatedHandler = handler;
}

export function parseResponse<Schema extends z.ZodType>(schema: Schema, data: unknown): z.infer<Schema> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError('unknown', null, ['Unexpected response from the server.'], parsed.error);
  }
  return parsed.data;
}
