import { Octokit } from "@octokit/rest";
import { encrypt, decrypt } from "./encryption";
import { storage } from "../storage";
import type { User } from "@shared/schema";

/**
 * GitHub OAuth configuration
 */
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:5000/api/auth/github/callback';

/**
 * Generate GitHub OAuth authorization URL
 * @param state CSRF protection state token
 * @returns Authorization URL
 */
export function getGitHubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID || '',
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: 'repo,user:email,read:org',
    state,
  });
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param code Authorization code from GitHub
 * @returns Access token and metadata
 */
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_REDIRECT_URI,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }

  // GitHub tokens don't expire by default, but we track when they were issued
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Set expiry to 1 year for tracking

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
  };
}

/**
 * Store GitHub tokens for a user (encrypted)
 * @param userId User ID
 * @param accessToken GitHub access token
 * @param refreshToken Optional refresh token
 * @param expiresAt Token expiry date
 */
export async function storeGitHubTokens(
  userId: string,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: Date
): Promise<void> {
  const encryptedAccessToken = encrypt(accessToken);
  const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

  await storage.updateUser(userId, {
    githubAccessToken: encryptedAccessToken,
    githubRefreshToken: encryptedRefreshToken,
    githubTokenExpiry: expiresAt || null,
  });
}

/**
 * Get decrypted GitHub token for a user
 * @param user User object
 * @returns Decrypted access token or null
 */
export function getGitHubToken(user: User): string | null {
  if (!user.githubAccessToken) {
    return null;
  }

  try {
    return decrypt(user.githubAccessToken);
  } catch (error) {
    console.error('Error decrypting GitHub token:', error);
    return null;
  }
}

/**
 * Check if user's GitHub token is expired
 * @param user User object
 * @returns true if expired or no token
 */
export function isGitHubTokenExpired(user: User): boolean {
  if (!user.githubAccessToken || !user.githubTokenExpiry) {
    return true;
  }

  return new Date(user.githubTokenExpiry) <= new Date();
}

/**
 * Revoke GitHub token
 * @param userId User ID
 */
export async function revokeGitHubToken(userId: string): Promise<void> {
  await storage.updateUser(userId, {
    githubAccessToken: null,
    githubRefreshToken: null,
    githubTokenExpiry: null,
  });
}

/**
 * Get Octokit instance for a user
 * @param user User object
 * @returns Octokit instance or null if no valid token
 */
export function getOctokitForUser(user: User): Octokit | null {
  const token = getGitHubToken(user);
  
  if (!token || isGitHubTokenExpired(user)) {
    return null;
  }

  return new Octokit({
    auth: token,
  });
}

/**
 * Verify GitHub token is valid by making a test API call
 * @param token GitHub access token
 * @returns true if token is valid
 */
export async function verifyGitHubToken(token: string): Promise<boolean> {
  try {
    const octokit = new Octokit({ auth: token });
    await octokit.users.getAuthenticated();
    return true;
  } catch (error) {
    return false;
  }
}
