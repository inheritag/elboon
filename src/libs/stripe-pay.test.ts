import { describe, expect, it } from 'vitest';
import { checkoutOrigin } from './stripe-pay';

describe('checkoutOrigin', () => {
  it('uses an https site address ahead of the request', () => {
    expect(checkoutOrigin('https://elboon.com', 'https://elboon.com/')).toBe('https://elboon.com');
  });

  it('uses the live request when the configured address is localhost', () => {
    expect(checkoutOrigin('https://elboon.com', 'http://localhost:5173')).toBe('https://elboon.com');
  });

  it('keeps localhost for a local http request', () => {
    expect(checkoutOrigin('http://localhost:5173', 'http://localhost:5173')).toBe('http://localhost:5173');
  });
});
