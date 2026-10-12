/** Plain login URLs are not callbacks; PKCE codes use the SDK's separate detection. */
export function isSupabaseImplicitCallback(url: URL, params: Record<string, string>): boolean {
  return (
    ['/auth/login', '/auth/update-password'].includes(url.pathname.replace(/\/$/, '')) &&
    Boolean(params['access_token'] || params['error'] || params['error_description'] || params['error_code'])
  );
}
