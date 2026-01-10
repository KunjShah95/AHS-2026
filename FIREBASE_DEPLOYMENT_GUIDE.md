# 🚀 Firebase Hosting Deployment with GitHub OAuth Setup

## Overview
This guide will walk you through deploying your AI Onboarding Engineer app to Firebase Hosting and configuring GitHub OAuth authentication.

---

## 📋 Prerequisites

- [x] Firebase project created (`ahs-2026`)
- [x] Firebase CLI installed
- [x] Code ready in `c:\AHS 2026\ai-onboarding-engineer`
- [ ] GitHub OAuth App configured
- [ ] Firebase Hosting configured

---

## Part 1: Configure Firebase Hosting

### Step 1: Update Firebase Configuration

Your current `firebase.json` only has Firestore configured. We need to add Hosting:

```bash
cd "c:\AHS 2026"
```

Update `.firebaserc` to include your project:

```json
{
  "projects": {
    "default": "ahs-2026"
  }
}
```

Update `firebase.json` to include hosting:

```json
{
  "firestore": {
    "database": "(default)",
    "location": "nam5",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "ai-onboarding-engineer/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Step 2: Build Your Application

```bash
cd "c:\AHS 2026\ai-onboarding-engineer"
npm run build
```

This creates a `dist` folder with your production build.

---

## Part 2: GitHub OAuth Configuration

### Step 1: Create GitHub OAuth App

1. **Go to GitHub Developer Settings**
   - Visit: https://github.com/settings/developers
   - Click **"New OAuth App"**

2. **Configure OAuth App**
   - **Application name**: `AI Onboarding Engineer`
   - **Homepage URL**: `https://ahs-2026.web.app` (or your custom domain)
   - **Application description**: `AI-powered repository learning platform`
   - **Authorization callback URL**: `https://ahs-2026.firebaseapp.com/__/auth/handler`
   
   > ⚠️ **Important**: The callback URL MUST be `https://<YOUR-PROJECT-ID>.firebaseapp.com/__/auth/handler`

3. **Save Credentials**
   - Copy **Client ID**
   - Generate and copy **Client Secret**
   - Keep these secure!

### Step 2: Add Development OAuth App (Optional but Recommended)

For local development, create a **separate** OAuth App:

1. **Create another OAuth App** with:
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5173/__/auth/handler`

2. Use these credentials for local testing

---

## Part 3: Configure Firebase Authentication

### Step 1: Enable GitHub Provider

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select project: `ahs-2026`

2. **Navigate to Authentication**
   - Click **"Authentication"** in left sidebar
   - Click **"Sign-in method"** tab

3. **Enable GitHub**
   - Click on **"GitHub"**
   - Toggle **"Enable"**
   - Enter your **Client ID** from GitHub
   - Enter your **Client Secret** from GitHub
   - Click **"Save"**

4. **Copy the Redirect URI**
   - Firebase will show you the redirect URI
   - It should be: `https://ahs-2026.firebaseapp.com/__/auth/handler`
   - Verify this matches what you entered in GitHub

### Step 2: Configure Authorized Domains

1. **In Firebase Console**
   - Go to **Authentication → Settings → Authorized domains**

2. **Add Your Domains**
   - `localhost` (should already be there)
   - `ahs-2026.web.app` (will be added automatically after first deploy)
   - `ahs-2026.firebaseapp.com` (will be added automatically)
   - Any custom domain you plan to use

---

## Part 4: Deploy to Firebase Hosting

### Step 1: Login to Firebase

```bash
firebase login
```

Your browser will open - sign in with your Google account that has access to the `ahs-2026` project.

### Step 2: Initialize Hosting (if not already done)

```bash
cd "c:\AHS 2026"
firebase init hosting
```

When prompted:
- **Project**: Select existing project `ahs-2026`
- **Public directory**: `ai-onboarding-engineer/dist`
- **Single-page app**: `Yes`
- **Set up automatic builds**: `No` (for now)
- **Overwrite index.html**: `No`

### Step 3: Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore
```

### Step 4: Deploy Your Application

```bash
# Build first
cd ai-onboarding-engineer
npm run build

# Deploy
cd ..
firebase deploy --only hosting
```

### Step 5: Get Your Live URL

After deployment completes, you'll see:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/ahs-2026/overview
Hosting URL: https://ahs-2026.web.app
```

---

## Part 5: Update GitHub OAuth Callback URLs

### Important: Update Production URLs

1. **Go back to GitHub OAuth App Settings**
   - https://github.com/settings/developers

2. **Update your production OAuth App**
   - **Homepage URL**: Change to `https://ahs-2026.web.app`
   - **Authorization callback URL**: Ensure it's `https://ahs-2026.firebaseapp.com/__/auth/handler`
   - Click **"Update application"**

---

## Part 6: Testing Your Deployment

### Step 1: Test the Live Site

1. Visit: `https://ahs-2026.web.app`
2. Navigate to `/login` or `/register`
3. Click the **"GitHub"** button

### Step 2: Test OAuth Flow

1. You should see a GitHub authorization popup
2. Authorize the application
3. You should be redirected to `/dashboard`

### Step 3: Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| `auth/unauthorized-domain` | Add `ahs-2026.web.app` to Firebase authorized domains |
| `redirect_uri_mismatch` | Verify callback URL in GitHub matches Firebase exactly |
| Blank page after redirect | Check browser console for errors; may need to clear cache |
| GitHub auth popup blocked | Allow popups for `ahs-2026.web.app` |

---

## Part 7: Environment Variables (Optional for Backend)

If you have a backend API, update your environment variables:

### Option A: Build-time Environment Variables

Update `ai-onboarding-engineer/.env.production`:

```env
VITE_API_BASE_URL=https://your-backend-url.com
```

### Option B: Keep Using Current .env

Your current `.env` file will work, but create a production version:

```bash
cd ai-onboarding-engineer
cp .env .env.production
```

Edit `.env.production` and update `VITE_API_BASE_URL` to your production backend URL.

Then rebuild and redeploy:

```bash
npm run build
cd ..
firebase deploy --only hosting
```

---

## 🔄 Quick Redeploy Workflow

After making code changes:

```bash
# 1. Make your changes
cd "c:\AHS 2026\ai-onboarding-engineer"

# 2. Build
npm run build

# 3. Deploy
cd ..
firebase deploy --only hosting

# 4. Visit your site
# https://ahs-2026.web.app
```

---

## 📊 Monitoring and Analytics

### Firebase Console Monitoring

1. **Hosting Metrics**
   - https://console.firebase.google.com/project/ahs-2026/hosting

2. **Authentication Users**
   - https://console.firebase.google.com/project/ahs-2026/authentication/users

3. **Firestore Usage**
   - https://console.firebase.google.com/project/ahs-2026/firestore

---

## 🎯 GitHub OAuth Setup Summary

### What You Need

1. **GitHub OAuth App** with:
   - Homepage URL: `https://ahs-2026.web.app`
   - Callback URL: `https://ahs-2026.firebaseapp.com/__/auth/handler`

2. **Firebase Authentication** with:
   - GitHub provider enabled
   - Client ID and Secret from GitHub
   - Authorized domains configured

3. **Your Code** (already done! ✅):
   - `src/lib/firebase.ts` - Firebase initialization
   - `src/context/AuthContext.tsx` - OAuth implementation
   - `src/pages/Login.tsx` & `Register.tsx` - GitHub buttons

---

## ⚡ Quick Commands Reference

```bash
# Build production
cd "c:\AHS 2026\ai-onboarding-engineer"
npm run build

# Deploy hosting only
cd "c:\AHS 2026"
firebase deploy --only hosting

# Deploy everything (hosting + firestore)
firebase deploy

# View deployment log
firebase hosting:channel:open live
```

---

## 🔒 Security Checklist

- [x] Firebase API keys stored in environment variables
- [x] GitHub Client Secret stored in Firebase (not in code)
- [ ] Firestore security rules configured
- [ ] GitHub OAuth app restricted to necessary scopes
- [ ] HTTPS enforced on Firebase Hosting (automatic)

---

## 📝 Next Steps

1. ✅ Deploy to Firebase Hosting
2. ✅ Configure GitHub OAuth
3. ✅ Test authentication flow
4. 🔲 Deploy backend (if needed)
5. 🔲 Configure custom domain (optional)
6. 🔲 Set up CI/CD with GitHub Actions (optional)

---

## 🆘 Need Help?

- **Firebase Documentation**: https://firebase.google.com/docs/hosting
- **GitHub OAuth Docs**: https://docs.github.com/en/apps/oauth-apps
- **Your OAuth Quick Ref**: See `GITHUB_OAUTH_QUICK_REF.md`

---

**Deployment Time**: ~15 minutes ⏱️

**Your Live URL**: https://ahs-2026.web.app
