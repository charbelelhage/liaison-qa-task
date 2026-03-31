import { Page } from '@playwright/test';

export const countRequests = (
  page: Page,
  endpoint: string,
  method: string = 'POST'
) => {
  let count = 0;

  const handler = (req: any) => {
    if (req.url().includes(endpoint) && req.method() === method) {
      count++;
    }
  };

  page.on('request', handler);

  return {
    getCount: () => count,
    dispose: () => page.off('request', handler),
  };
};