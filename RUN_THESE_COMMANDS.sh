#!/bin/bash

# 🚀 Fakrny - Google Play Build Script
# Run this script to build your .aab file for Google Play Store

set -e  # Exit on error

echo "=========================================="
echo "🚀 Fakrny - Building for Google Play"
echo "=========================================="
echo ""

# Step 1: Install EAS CLI
echo "📦 Step 1/4: Installing EAS CLI..."
npm install -g eas-cli
echo "✅ EAS CLI installed"
echo ""

# Step 2: Login
echo "🔐 Step 2/4: Login to Expo"
echo "⚠️  You'll need to enter your Expo credentials"
echo "   Don't have an account? Create one at: https://expo.dev"
echo ""
eas login
echo "✅ Logged in successfully"
echo ""

# Step 3: Configure
echo "⚙️  Step 3/4: Configuring build"
eas build:configure
echo "✅ Build configured"
echo ""

# Step 4: Build
echo "🏗️  Step 4/4: Building production .aab"
echo "⏱️  This will take 15-20 minutes..."
echo "💡 You can press Ctrl+C to exit - build continues on Expo servers"
echo ""
eas build --platform android --profile production

echo ""
echo "=========================================="
echo "🎉 Build Complete!"
echo "=========================================="
echo ""
echo "📥 Download your .aab file from the link above"
echo ""
echo "Next steps:"
echo "1. Download the .aab file"
echo "2. Fix app icon (remove 'Fakrny' text)"
echo "3. Take screenshots (2-8 images)"
echo "4. Host privacy policy online"
echo "5. Upload to Google Play Console"
echo ""
echo "📖 See QUICK_BUILD_GUIDE.md for detailed instructions"
echo ""
