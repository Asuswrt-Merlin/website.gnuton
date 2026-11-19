/**
 * Helpers for deployments under a sub-path, such as GitHub Pages project
 * sites (https://owner.github.io/repo/). `BASE_URL` comes from astro.config.mjs
 * and is always `/` locally.
 */
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Prefix an internal absolute path with the deployment base path. */
export function withBase(path: string): string {
  if (!path.startsWith('/')) return path;

  const match = path.match(/^([^?#]*)(.*)$/);
  const pathname = match?.[1] ?? path;
  const suffix = match?.[2] ?? '';
  // Astro emits directory-style pages. Keep asset URLs as files, but give
  // page links a trailing slash so we never rely on a host redirect.
  const isFile = /\.[a-z0-9]+$/i.test(pathname);
  const normalized =
    pathname === '/' || pathname.endsWith('/') || isFile ? pathname : `${pathname}/`;

  return `${base}${normalized}${suffix}`;
}

/** Remove the deployment base path, e.g. for active-link checks. */
export function withoutBase(pathname: string): string {
  if (!base) return pathname;
  if (pathname === base) return '/';
  return pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : pathname;
}

/** Build an absolute URL using the configured site origin. */
export function absoluteUrl(path: string, origin: URL | undefined): string {
  return new URL(withBase(path), origin ?? 'https://example.com').href;
}
