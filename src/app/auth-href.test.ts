import { describe, expect, it } from 'vitest';
import { authHref, authModeFrom, closeAuthHref, returnToFrom } from './auth-href';

describe('auth-href', () => {
  it('opens login on the current shop page', () => {
    const url = new URL('http://localhost/product/abc?category=tech');
    expect(authHref(url, 'login')).toBe('/product/abc?category=tech&auth=login&redirectTo=%2Fproduct%2Fabc%3Fcategory%3Dtech');
    expect(authModeFrom(new URL('http://localhost' + authHref(url, 'login')))).toBe('login');
  });

  it('sends admin and auth routes home', () => {
    expect(authHref(new URL('http://localhost/admin/login'), 'login')).toBe('/?auth=login&redirectTo=%2F');
    expect(closeAuthHref(new URL('http://localhost/account/login?redirectTo=/account'))).toBe('/');
  });

  it('closes without leaving catalog filters', () => {
    const open = new URL('http://localhost/?q=earbuds&auth=login&redirectTo=%2F%3Fq%3Dearbuds');
    expect(closeAuthHref(open)).toBe('/?q=earbuds');
    expect(returnToFrom(open)).toBe('/?q=earbuds');
  });
});
