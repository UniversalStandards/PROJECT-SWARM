import type { Request, Response, NextFunction } from "express";
import { getOctokitForUser, isGitHubTokenExpired } from "../auth/github-oauth";
import { storage } from "../storage";

export interface GitHubAuthRequest extends Request {
  octokit?: ReturnType<typeof getOctokitForUser>;
  user?: any;
}

/**
 * Middleware to inject user's GitHub Octokit instance into request
 * Requires the user to be authenticated first (use after isAuthenticated middleware)
 */
export async function withGitHubAuth(
  req: GitHubAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user || !req.user.claims || !req.user.claims.sub) {
      res.status(401).json({ 
        error: "Unauthorized",
        message: "User not authenticated" 
      });
      return;
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user) {
      res.status(404).json({ 
        error: "User not found" 
      });
      return;
    }

    // Check if user has GitHub token
    if (!user.githubAccessToken) {
      res.status(403).json({
        error: "GitHub not connected",
        message: "Please connect your GitHub account first",
        requiresAuth: true,
      });
      return;
    }

    // Check if token is expired
    if (isGitHubTokenExpired(user)) {
      res.status(403).json({
        error: "GitHub token expired",
        message: "Your GitHub token has expired. Please reconnect your account",
        requiresAuth: true,
      });
      return;
    }

    // Get Octokit instance for the user
    const octokit = getOctokitForUser(user);

    if (!octokit) {
      res.status(403).json({
        error: "GitHub authentication failed",
        message: "Unable to authenticate with GitHub. Please reconnect your account",
        requiresAuth: true,
      });
      return;
    }

    // Attach Octokit to request
    req.octokit = octokit;
    next();
  } catch (error) {
    console.error("GitHub auth middleware error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: "Failed to authenticate with GitHub" 
    });
  }
}
