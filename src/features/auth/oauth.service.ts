import { fetchAndStoreUser } from "./auth.service";

// OAuth provider types
export type OAuthProvider = "github";

// SessionStorage keys for OAuth state
const OAUTH_STATE_KEY = "oauth_state";
const OAUTH_REDIRECT_KEY = "oauth_redirect_to";

// Generate a cryptographically secure random state string for CSRF protection
function generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Store OAuth state in sessionStorage
function storeOAuthState(state: string, redirectTo?: string) {
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
    if (redirectTo) {
        sessionStorage.setItem(OAUTH_REDIRECT_KEY, redirectTo);
    }
}

// Retrieve and validate OAuth state from sessionStorage
function validateOAuthState(state: string): boolean {
    const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
    return storedState === state;
}

// Get and clear the redirect URL from sessionStorage
function getAndClearRedirectUrl(): string | null {
    const redirectTo = sessionStorage.getItem(OAUTH_REDIRECT_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
    return redirectTo;
}

/**
 * Initiate OAuth flow with a provider
 * @param provider - OAuth provider (github, google, etc.)
 * @param redirectTo - Optional URL to redirect to after successful auth
 */
export function initiateOAuth(provider: OAuthProvider, redirectTo?: string) {
    const state = generateState();
    storeOAuthState(state, redirectTo);

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
    const params = new URLSearchParams({ state });

    window.location.href = `${baseUrl}/auth/oauth/${provider}/authorize?${params}`;
}

/**
 * Handle OAuth callback after provider redirects back
 * Called by the /auth/callback route component
 * @param success - Whether the OAuth flow was successful
 * @param error - Error message if OAuth flow failed
 * @param state - CSRF state parameter
 * @returns The URL to redirect to after handling the callback
 */
export async function handleOAuthCallback(
    success: boolean,
    error?: string,
    state?: string,
): Promise<string> {
    const defaultRedirect = "/folders/root";

    if (state && !validateOAuthState(state)) {
        getAndClearRedirectUrl();
        throw new Error("Invalid OAuth state");
    }

    if (!success || error) {
        getAndClearRedirectUrl();
        throw new Error(error || "OAuth authentication failed");
    }

    await fetchAndStoreUser();

    const redirectTo = getAndClearRedirectUrl();
    return redirectTo || defaultRedirect;
}
