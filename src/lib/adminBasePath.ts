/** Must match `basePath` in next.config.ts */
export const ADMIN_BASE_PATH = "/admin";

export function pathnameWithoutBase(pathname: string): string {
  if (pathname === ADMIN_BASE_PATH) return "/";
  if (pathname.startsWith(`${ADMIN_BASE_PATH}/`)) {
    return pathname.slice(ADMIN_BASE_PATH.length) || "/";
  }
  return pathname;
}
