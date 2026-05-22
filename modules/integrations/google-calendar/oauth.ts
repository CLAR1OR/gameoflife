/** Google Calendar OAuth 2.0 helpers — build the consent URL, exchange
 *  the auth code for tokens, refresh access tokens when they expire.
 *  All functions are server-only (they hold the client secret). */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

/** Full read+write so we can also create events from the panel. */
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function getClientConfig() {
  return {
    clientId: env("GOOGLE_CLIENT_ID"),
    clientSecret: env("GOOGLE_CLIENT_SECRET"),
    redirectUri: env("GOOGLE_CALENDAR_REDIRECT_URI"),
  };
}

/** Build the URL we redirect the user to so Google can show its
 *  consent screen. `state` is the CSRF token we'll verify on callback. */
export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = getClientConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPE,
    // offline + consent are what make Google issue a refresh token —
    // without them we'd lose access after the first hour.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export type TokenBundle = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

/** Exchange the one-shot `code` from the OAuth callback for an access
 *  token + refresh token bundle. */
export async function exchangeCode(code: string): Promise<TokenBundle> {
  const { clientId, clientSecret, redirectUri } = getClientConfig();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as TokenResponse;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: new Date(Date.now() + json.expires_in * 1000),
    scope: json.scope,
  };
}

/** Use the refresh token to get a fresh access token. Refresh tokens
 *  themselves don't change. */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date; scope: string }> {
  const { clientId, clientSecret } = getClientConfig();
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google token refresh failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as TokenResponse;
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + json.expires_in * 1000),
    scope: json.scope,
  };
}

/** Tell Google to invalidate the refresh token. Best-effort — we
 *  still delete the row locally even if this fails. */
export async function revokeToken(token: string): Promise<void> {
  const body = new URLSearchParams({ token });
  await fetch(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  }).catch(() => null);
}
