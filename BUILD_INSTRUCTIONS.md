# Build Instructions for Fakrny - Google Play Store

This guide will walk you through building and publishing Fakrny to the Google Play Store.

## Prerequisites

1. **Expo Account** (Free)
   - Sign up at https://expo.dev
   - Verify your email

2. **Google Play Console Account** ($25 one-time fee)
   - Sign up at https://play.google.com/console
   - Complete payment

3. **Required Software**
   - Node.js (v18 or higher)
   - npm or yarn
   - EAS CLI: `npm install -g eas-cli`

4. **Required Files** (Already prepared)
   - Privacy Policy (PRIVACY_POLICY.md)
   - Store listing content (GOOGLE_PLAY_STORE_LISTING.md)
   - App configured (app.json)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Login to Expo

```bash
eas login
```

Enter your Expo credentials.

## Step 3: Configure EAS Build

```bash
eas build:configure
```

This will create an `eas.json` file. Use this configuration:

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Step 4: Build for Android (Production)

### First Build - Generate Keystore

```bash
eas build --platform android --profile production
```

EAS will ask:
- "Generate a new Android Keystore?" → Select **YES**
- This will automatically generate and store your keystore securely

The build will take 10-20 minutes.

### Download the AAB File

Once complete, download the `.aab` file from the Expo dashboard or via the provided URL.

## Step 5: Prepare for Google Play Console

### A. Create Screenshots

You need 2-8 screenshots. Use an Android emulator or real device:

1. Open the app in development mode: `npm run dev`
2. Take screenshots of:
   - Home screen with medicines
   - Prescription scanner
   - Medicine list
   - AI chatbot
   - Profile settings
   - Dose tracking

**Screenshot Requirements:**
- Format: PNG or JPG
- Dimensions:
  - Phone: 1080 x 1920 px (minimum)
  - Tablet: 1200 x 1920 px (optional)

### B. Create Feature Graphic

- Dimensions: 1024 x 500 px
- Format: JPG or PNG
- No transparency
- Showcase app name and key feature

### C. Host Privacy Policy

You have two options:

**Option 1: GitHub Pages (Free)**
1. Create a GitHub repository
2. Upload `PRIVACY_POLICY.md`
3. Enable GitHub Pages
4. URL will be: `https://yourusername.github.io/fakrny/PRIVACY_POLICY.html`

**Option 2: Custom Website**
1. Purchase domain (e.g., fakrny.app)
2. Host the privacy policy at: `https://fakrny.app/privacy-policy`

## Step 6: Google Play Console Setup

### A. Create Application

1. Go to https://play.google.com/console
2. Click "Create App"
3. Fill in:
   - App name: **Fakrny**
   - Default language: **English (United States)**
   - App or game: **App**
   - Free or paid: **Free**
4. Accept declarations and click "Create app"

### B. Store Presence

#### 1. Main Store Listing
- **App name**: Fakrny - Medicine Reminder
- **Short description**: (Copy from GOOGLE_PLAY_STORE_LISTING.md)
- **Full description**: (Copy from GOOGLE_PLAY_STORE_LISTING.md)
- **App icon**: Upload icon (512x512 PNG)
- **Feature graphic**: Upload feature graphic (1024x500)
- **Phone screenshots**: Upload 2-8 screenshots
- **Category**: Medical
- **Tags**: medicine, health, reminder, medication

#### 2. Privacy Policy
- **Privacy Policy URL**: Enter your hosted URL
- Example: `https://yourusername.github.io/fakrny/privacy-policy`

#### 3. App Access
- Select "All functionality is available without special access"

#### 4. Ads
- Select: "No, my app does not contain ads"

#### 5. Content Rating
Click "Start questionnaire"
- Select: Medical
- Answer questions honestly:
  - Violence: None
  - Sexual content: None
  - User-generated content: No
  - Location: No
- Submit and get rating

#### 6. Target Audience
- Target age groups: Adults (18+)
- Appeals to children: No

#### 7. Data Safety
Important section! Fill carefully:

**Data Collection:**
- ✅ Does your app collect or share user data? **Yes**

**Data Types Collected:**
- ✅ Personal Info: Email, Name, Phone number
- ✅ Health & Fitness: Health info, Fitness info
- ✅ Photos and videos: Photos

**Data Usage:**
- App functionality
- Personalization

**Data Sharing:**
- No data sold to third parties
- Shared with service providers for app functionality

**Security:**
- ✅ Data encrypted in transit
- ✅ Data encrypted at rest
- ✅ Users can request data deletion

### C. Production Release

#### 1. Select Countries
- Select all countries or specific ones
- Recommended: Start with your primary market

#### 2. Create Release

1. Go to "Production" → "Create new release"
2. Upload your `.aab` file
3. Release name: `1.0.0 - Initial Release`
4. Release notes:
```
🎉 Welcome to Fakrny v1.0.0!

✨ Features:
• AI-powered prescription scanning
• Smart medicine reminders
• Dose tracking and management
• AI medicine assistant
• Multi-language support
• Secure and private

Never miss your medicine again! 💊
```

#### 3. Review and Rollout

1. Review all sections (green checkmarks required)
2. Click "Review release"
3. Click "Start rollout to Production"

### D. Wait for Review

- Google typically reviews within 3-7 days
- You'll receive email notifications
- Check Console for status updates

## Step 7: Post-Submission

### Monitor
- Check Google Play Console daily
- Respond to user reviews
- Monitor crash reports

### Required After Approval
1. Test the published app from Play Store
2. Verify all features work correctly
3. Monitor user feedback

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
eas build:clear
eas build --platform android --profile production --clear-cache
```

### Keystore Issues
- Never lose your keystore! EAS stores it securely
- To download keystore: `eas credentials` → Select Android → Download

### App Rejected
Common reasons:
- Privacy policy not accessible
- Data safety form incomplete
- Misleading content
- Broken functionality

Fix issues and resubmit.

## Future Updates

### Version Updates

1. Update version in `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

2. Build new version:
```bash
eas build --platform android --profile production
```

3. Upload to Google Play Console under new release

### Increment Rules
- **versionCode**: Must increase by 1 for each release (1, 2, 3...)
- **version**: Semantic versioning (1.0.0 → 1.0.1 → 1.1.0)

## Important Notes

- **Never share keystore**: Keep it secure
- **Test thoroughly**: Before each release
- **Backup regularly**: Database and credentials
- **Monitor analytics**: Track downloads and usage
- **Respond to reviews**: Maintain good ratings
- **Update regularly**: Fix bugs and add features

## Support Resources

- Expo Documentation: https://docs.expo.dev
- Google Play Console Help: https://support.google.com/googleplay/android-developer
- Expo Forums: https://forums.expo.dev
- EAS Build Docs: https://docs.expo.dev/build/introduction/

## Costs Summary

- Expo Account: **Free**
- EAS Build: **Free tier available** (limited builds/month)
- Google Play Developer: **$25 one-time**
- Optional:
  - Domain for privacy policy: ~$10/year
  - Premium Expo subscription: $29/month (unlimited builds)

## Timeline Estimate

- Initial setup: 2-3 hours
- First build: 15-20 minutes
- Store listing setup: 1-2 hours
- Google review: 3-7 days

**Total: ~1 week from start to published**

Good luck with your app launch! 🚀
