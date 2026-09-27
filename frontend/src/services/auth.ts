/**
 * Authentication service — Google (Gmail) sign-in for parents.
 *
 * - On native (Capacitor/Android APK): uses @codetrix-studio/capacitor-google-auth
 * - On web: uses Google Identity Services, with a clearly-marked mock fallback
 *   for development (see TODO below).
 *
 * The signed-in parent profile is persisted in localStorage ('ala_user').
 * Client ID is never hardcoded — read from VITE_GOOGLE_CLIENT_ID.
 */

import { Capacitor } from '@capacitor/core';

// The plugin package may not ship its own types; declare the surface we use.
declare module '@codetrix-studio/capacitor-google-auth' {
  export interface GoogleAuthPluginUser {
    id: string;
    name: string;
    email: string;
    imageUrl?: string;
    familyName?: string;
    givenName?: string;
    authentication?: {
      idToken?: string;
      accessToken?: string;
    };
  }
  export class GoogleAuth {
    static initialize(options?: {
      clientId?: string;
      scopes?: string[];
      grantOfflineAccess?: boolean;
    }): Promise<void>;
    static signIn(): Promise<GoogleAuthPluginUser>;
    static signOut(): Promise<void>;
    static refresh(): Promise<void>;
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export const USER_STORAGE_KEY = 'ala_user';

type AuthChangeCallback = (user: User | null) => void;

const listeners = new Set<AuthChangeCallback>();

function getGoogleClientId(): string {
  // Never hardcode — read from env, fall back to empty (native plugin reads
  // its own config from capacitor.config / strings.xml on Android).
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function saveUser(user: User | null): void {
  try {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Storage unavailable
  }
}

function notify(user: User | null): void {
  listeners.forEach(cb => {
    try {
      cb(user);
    } catch {
      // A misbehaving listener must not break auth
    }
  });
}

// ─── Native (Capacitor) sign-in ───────────────────────────────────────────────

async function nativeSignIn(): Promise<User> {
  const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
  const clientId = getGoogleClientId();
  await GoogleAuth.initialize({
    clientId: clientId || undefined,
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
  const result = await GoogleAuth.signIn();
  const user: User = {
    id: result.id,
    name: result.name,
    email: result.email,
    photoUrl: result.imageUrl,
  };
  saveUser(user);
  notify(user);
  return user;
}

async function nativeSignOut(): Promise<void> {
  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    await GoogleAuth.signOut();
  } catch {
    // Plugin may not be installed on this platform — still clear local state
  }
  saveUser(null);
  notify(null);
}

// ─── Web sign-in (Google Identity Services) ───────────────────────────────────

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize(options: Record<string, unknown>): void;
          prompt(): void;
        };
      };
    };
  }
}

async function webSignIn(): Promise<User> {
  const clientId = getGoogleClientId();

  if (window.google?.accounts?.id && clientId) {
    // Real Google Identity Services flow.
    return new Promise<User>((resolve, reject) => {
      window.google!.accounts!.id!.initialize({
        client_id: clientId,
        // TODO: verify the returned credential (idToken) against Google's
        // tokeninfo endpoint / your backend before trusting it in production.
        callback: (response: { credential?: string }) => {
          try {
            if (!response?.credential) {
              reject(new Error('Google sign-in returned no credential'));
              return;
            }
            // Decode the JWT payload (client-side only; verify server-side in prod).
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const user: User = {
              id: String(payload.sub ?? ''),
              name: String(payload.name ?? 'Parent'),
              email: String(payload.email ?? ''),
              photoUrl: payload.picture as string | undefined,
            };
            saveUser(user);
            notify(user);
            resolve(user);
          } catch (err) {
            reject(err instanceof Error ? err : new Error('Failed to parse Google credential'));
          }
        },
      });
      window.google!.accounts!.id!.prompt();
    });
  }

  // TODO(mock): Wire up the real Google Identity Services script
  // (https://accounts.google.com/gsi/client) and set VITE_GOOGLE_CLIENT_ID.
  // This mock exists so the app remains testable on web without credentials.
  const mockUser: User = {
    id: 'demo-parent',
    name: 'Demo Parent',
    email: 'demo-parent@example.com',
  };
  saveUser(mockUser);
  notify(mockUser);
  return mockUser;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Sign in with Google. Uses the native plugin on device, GIS (or mock) on web. */
export async function signInWithGoogle(): Promise<User> {
  if (Capacitor.isNativePlatform()) {
    return nativeSignIn();
  }
  return webSignIn();
}

/** Sign out and clear the locally stored parent profile. */
export async function signOut(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await nativeSignOut();
    return;
  }
  saveUser(null);
  notify(null);
}

/** The currently signed-in parent, or null. */
export function getCurrentUser(): User | null {
  return loadUser();
}

/**
 * Subscribe to auth changes. Returns an unsubscribe function.
 * The callback fires immediately with the current user.
 */
export function onAuthChange(callback: AuthChangeCallback): () => void {
  listeners.add(callback);
  try {
    callback(loadUser());
  } catch {
    // ignore
  }
  return () => {
    listeners.delete(callback);
  };
}
