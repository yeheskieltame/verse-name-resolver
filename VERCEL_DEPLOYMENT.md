# SmartVerse - Vercel Deployment Guide

## 🚀 Production Deployment

### Current Production URL
**Live App**: https://smartverse-id.vercel.app

### Vercel Configuration

This project is optimized for Vercel deployment with the following configurations:

#### 1. vercel.json (Fixed for Vercel v2)
```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

**Why this format?**
- Uses `rewrites` instead of `routes` (Vercel v2 compatible)
- Excludes API routes with negative lookahead `(?!api/)`
- Simpler and more reliable than mixed routing properties
- Fixes "Mixed Routing Properties" deployment error

#### 2. _redirects (Backup)
```
/*    /index.html   200
```

#### 3. Vite Configuration (Updated)
Optimized build settings for production:
- Code splitting for vendor and UI libraries
- esbuild minification (faster than Terser)
- ESNext target for modern browsers
- Increased chunk size warning limit
- No source maps in production
- Proper global definitions for Web3 libraries

### Deployment Features

✅ **SPA Routing Fix**: No 404 errors on page refresh
✅ **Security Headers**: XSS protection, content type sniffing prevention
✅ **Performance**: Code splitting and optimized bundles
✅ **PWA Ready**: Service worker support
✅ **SEO Optimized**: Proper meta tags and Open Graph

### Environment Variables

Make sure to set these in Vercel dashboard:
- `VITE_ALCHEMY_API_KEY`: Alchemy API key for blockchain RPC
- `VITE_WALLETCONNECT_PROJECT_ID`: WalletConnect project ID
- Any other environment-specific variables

### Build Commands

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Troubleshooting

#### Common Deployment Errors:

**1. Mixed Routing Properties Error**
```
Error: Mixed routing properties
```
- **Cause**: Using `routes` and `headers` together in vercel.json
- **Solution**: Use `rewrites` instead of `routes` (fixed in current config)

**2. 404 Errors on Page Refresh**
```
Error: 404 - Page Not Found
```
- **Cause**: SPA routing not configured properly
- **Solution**: 
  1. Ensure `vercel.json` is in project root
  2. Check that `_redirects` file is in `public/` folder
  3. Verify React Router is using BrowserRouter (not HashRouter)
  4. Clear Vercel cache and redeploy if needed

**3. Build Failures**
```
Error: Build exceeded maximum duration
```
- **Cause**: Large bundle size or slow build process
- **Solution**:
  1. Check vite.config.ts for optimization settings
  2. Ensure code splitting is working
  3. Use esbuild instead of Terser for faster builds
  4. Increase Vercel build timeout if needed

### Performance Monitoring

The deployment includes:
- Real-time error tracking
- Performance monitoring
- User analytics
- Uptime monitoring

For any deployment issues, check Vercel dashboard logs and ensure all environment variables are properly configured.
