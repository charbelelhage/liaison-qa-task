import { request, APIRequestContext } from '@playwright/test';
import { ENV } from '../../config/env';

export async function createApiContext(): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: ENV.API_URL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  });
}