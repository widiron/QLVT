import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Scopes required for Google Drive & Google Sheets
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));
// Prompt user to select account if needed
provider.setCustomParameters({
  prompt: 'select_account'
});

// In-memory access token cache (NEVER stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize auth listener on app load.
 * Cleans up cached access token whenever user signs out.
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token not yet retrieved or expired in memory
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger Google Sign In with popup to obtain access token with Google Sheets & Drive scopes.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không nhận được mã truy cập (access token) từ Google Workspace.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Lỗi đăng nhập Google Workspace:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Returns current in-memory access token or null
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sets access token in memory (e.g. from sign in callback)
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Sign out from Google Workspace and clear in-memory token
 */
export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
