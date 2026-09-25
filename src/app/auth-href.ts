export type AuthMode = 'login' | 'signup';

export function isAuthMode(value: string | null): value is AuthMode {
  return value === 'login' || value === 'signup';
}

function safePath(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('://')) return fallback;
  return value;
}

export function stripAuthParams(url: URL): URL {
  const next = new URL(url);
  next.searchParams.delete('auth');
  next.searchParams.delete('redirectTo');
  next.searchParams.delete('email');
  return next;
}

export function returnToFrom(url: URL): string {
  const stripped = stripAuthParams(url);
  const path = stripped.pathname + stripped.search;
  if (path.startsWith('/account/login') || path.startsWith('/account/signup') || path.startsWith('/admin')) {
    return '/';
  }
  return path || '/';
}

export function authHref(url: URL, mode: AuthMode, opts?: { redirectTo?: string; email?: string }): string {
  const source =
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/account/login') ||
    url.pathname.startsWith('/account/signup')
      ? new URL('/', url)
      : new URL(url);

  source.searchParams.set('auth', mode);
  source.searchParams.set('redirectTo', safePath(opts?.redirectTo ?? returnToFrom(url), '/'));
  if (opts?.email) source.searchParams.set('email', opts.email);
  else source.searchParams.delete('email');
  return source.pathname + source.search;
}

export function closeAuthHref(url: URL): string {
  if (url.pathname.startsWith('/account/login') || url.pathname.startsWith('/account/signup')) {
    return '/';
  }
  const next = stripAuthParams(url);
  return next.pathname + next.search || '/';
}

export function authModeFrom(url: URL): AuthMode | null {
  if (isAuthMode(url.searchParams.get('auth'))) return url.searchParams.get('auth') as AuthMode;
  if (url.pathname === '/account/signup') return 'signup';
  if (url.pathname === '/account/login') return 'login';
  return null;
}
