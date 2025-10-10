import { Octokit } from '@octokit/rest';

/**
 * NOTE: Replit GitHub connector provides WORKSPACE-LEVEL authentication, not per-user.
 * This means all users in the workspace share the same GitHub OAuth token.
 * This is the intended design of Replit connectors for collaborative workspaces.
 * 
 * For per-user GitHub access, a different approach would be needed:
 * - Implement custom OAuth flow per user
 * - Store per-user tokens in database
 * - Manage token refresh per user
 */

// Cache to prevent redundant connector API calls
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getAccessToken(userId: string) {
  // Check cache (keyed by userId to support future per-user implementation)
  const cached = tokenCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }

  // Cache token per user with expiry
  const expiresAt = connectionSettings.settings.expires_at 
    ? new Date(connectionSettings.settings.expires_at).getTime() 
    : Date.now() + 3600000; // 1 hour default
  
  tokenCache.set(userId, { token: accessToken, expiresAt });
  
  return accessToken;
}

export async function getGitHubClient(userId: string) {
  const accessToken = await getAccessToken(userId);
  return new Octokit({ auth: accessToken });
}

export async function isGitHubConnected(userId: string) {
  try {
    await getAccessToken(userId);
    return true;
  } catch {
    return false;
  }
}
