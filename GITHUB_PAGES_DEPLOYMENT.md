# GitHub Pages Deployment Configuration

## Overview

GitHub Pages deployment is configured to automatically deploy the **frontend only** (static files) from the `main` branch. The backend API server will need to be deployed separately to Cloudflare or your own servers.

## Automatic Deployment

A GitHub Actions workflow (`.github/workflows/deploy-github-pages.yml`) is configured to:
1. Build the frontend on every push to `main` branch
2. Deploy static files to GitHub Pages
3. Make the site available at `https://<username>.github.io/<repository>/`

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The site will be available at `https://UniversalStandards.github.io/PROJECT-SWARM/`

### 2. Configure Base URL (If needed)

If your site is served from a subdirectory (e.g., `/PROJECT-SWARM/`), you may need to configure the base path. 

**Note**: The current `vite.config.ts` uses root path `/` by default. If deploying to a subdirectory, add the base configuration:

```typescript
// In vite.config.ts, add to the config object:
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/PROJECT-SWARM/' : '/',
  plugins: [...],
  // ... rest of existing config
});
```

And set the environment variable in the GitHub Actions workflow:

```yaml
- name: Build frontend
  run: npm run build
  env:
    NODE_ENV: production
    GITHUB_PAGES: true
```

### 3. Backend API Configuration

Since GitHub Pages only serves static files, you need to:

1. **Deploy backend separately** to Cloudflare Workers or your own server
2. **Update API endpoints** in your frontend to point to the backend URL

Option A: Use environment variables during build:
```typescript
// In your frontend code
const API_URL = import.meta.env.VITE_API_URL || 'https://api.yourserver.com';
```

Then set in `.github/workflows/deploy-github-pages.yml`:
```yaml
- name: Build frontend
  run: npm run build
  env:
    VITE_API_URL: https://your-backend-api.workers.dev
```

Option B: Use relative paths if backend is on same domain with reverse proxy

## Manual Deployment

You can also manually deploy:

```bash
# Build the frontend
npm run build

# The static files will be in dist/public
# Upload these files to any static hosting service
```

## Important Notes

1. **GitHub Pages serves static files only** - no Node.js backend execution
2. **HTTPS is enforced** - Your site will be served over HTTPS automatically
3. **Custom domain** - You can configure a custom domain in Settings → Pages
4. **Build time** - The workflow takes ~2-5 minutes to complete
5. **API calls** - All API calls must go to an external backend (Cloudflare, AWS, etc.)

## Limitations

- No server-side rendering (SSR)
- No API routes hosted on GitHub Pages
- File size limit: 1 GB per repository
- Bandwidth limit: 100 GB/month soft limit

## Testing Locally

To test the production build locally:

```bash
npm run build
npx serve dist/public
```

Visit `http://localhost:3000` to see the production build.

## Troubleshooting

### Issue: 404 on refresh or direct navigation

GitHub Pages doesn't support client-side routing by default. Add a `404.html` that redirects:

```html
<!-- dist/public/404.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/'">
  </head>
</html>
```

### Issue: Assets not loading

Check that your `base` path in `vite.config.ts` matches your repository name.

### Issue: API calls failing

Ensure your frontend is configured to call the correct backend URL where your API is deployed.
