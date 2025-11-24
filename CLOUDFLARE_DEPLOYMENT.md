# Cloudflare Pages Deployment Configuration

## Build Settings

Configure these settings in your Cloudflare Pages dashboard:

### Framework preset
- **Framework**: None (or Node.js)

### Build settings
- **Build command**: `npm run build`
- **Build output directory**: `dist/public`
- **Root directory**: `/` (leave empty or set to repository root)

### Environment variables
Set the following environment variables in Cloudflare Pages dashboard:
- `NODE_VERSION`: `22` (or the version specified in package.json engines)
- Any other required environment variables for your application

## Important Notes

1. **package-lock.json**: This file MUST be committed to the repository. Cloudflare Pages uses `npm ci` which requires this file.

2. **Build directory**: Ensure the build output directory matches the vite.config.ts output directory (`dist/public`).

3. **Node version**: The project uses Node.js 22.x. Make sure this is set in Cloudflare Pages.

## Troubleshooting

### Error: "npm ci can only install with an existing package-lock.json"

**Cause**: The build is running in a directory that doesn't contain package-lock.json, or the file is not committed to git.

**Solutions**:
1. Verify package-lock.json is committed: `git ls-files package-lock.json`
2. Ensure "Root directory" in Cloudflare Pages is set to `/` (repository root)
3. Check that package-lock.json has lockfileVersion >= 1 (currently v3)

### Build fails after npm install

**Cause**: Dependencies might have vulnerabilities or compatibility issues.

**Solution**: Review npm audit output and update dependencies if needed.
