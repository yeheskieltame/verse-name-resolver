#!/bin/bash

# SmartVerse Vercel Deployment Script
echo "🚀 Deploying SmartVerse to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Check if vercel.json exists and is valid
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json found"
    # Validate JSON syntax
    if jq empty vercel.json 2>/dev/null; then
        echo "✅ vercel.json is valid JSON"
    else
        echo "❌ vercel.json has invalid JSON syntax"
        exit 1
    fi
else
    echo "❌ vercel.json not found"
    exit 1
fi

# Build the project locally first
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Live at: https://smartverse-id.vercel.app"
