# SmartVerse - Vercel Deployment Guide

## 🚀 Production Deployment

### Current Production URL
**Live App**: https://smartverse-id.vercel.app

### Vercel Configuration

This project is optimized for Vercel deployment with the following configurations:

#### 1. vercel.json
```json
{
  "routes": [
    {
      "src": "/[^.]+",
      "dest": "/",
      "status": 200
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

#### 2. _redirects (Backup)
```
/*    /index.html   200
```

#### 3. Vite Configuration
Optimized build settings for production:
- Code splitting for vendor and UI libraries
- Minification with Terser
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

If you encounter 404 errors:
1. Ensure `vercel.json` is in project root
2. Check that `_redirects` file is in `public/` folder
3. Verify React Router is using BrowserRouter (not HashRouter)
4. Clear Vercel cache and redeploy if needed

### Performance Monitoring

The deployment includes:
- Real-time error tracking
- Performance monitoring
- User analytics
- Uptime monitoring

For any deployment issues, check Vercel dashboard logs and ensure all environment variables are properly configured.
