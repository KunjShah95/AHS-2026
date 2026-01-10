# 🚀 Firebase Deployment + GitHub OAuth - Complete Setup

## 📋 What We're Doing

1. **Deploy your React app** to Firebase Hosting
2. **Configure GitHub OAuth** so users can sign in with GitHub
3. **Connect Firebase Authentication** to handle OAuth flow

---

## Part 1: Install Firebase CLI (if needed)

First, check if Firebase CLI is installed:

```bash
firebase --version
```

### If not installed:

```bash
npm install -g firebase-tools
```

---

## Part 2: Build Your Application

```bash
cd "c:\AHS 2026\ai-onboarding-engineer"
npm run build
```

**Expected**: Creates a `dist` folder with your production build.

---

## Part 3: Login to Firebase

```bash
firebase login
```

This will open your browser. Sign in with the Google account that has access to the `ahs-2026` Firebase project.

---

## Part 4: Deploy Firestore Rules (First Time)

```bash
cd "c:\AHS 2026"
firebase deploy --only firestore
```

This deploys your database security rules.

---

## Part 5: Deploy Hosting

```bash
firebase deploy --only hosting
```

**Expected Output**:
```
=== Deploying to 'ahs-2026'...

✔  hosting: finished running predeploy script.
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/ahs-2026/overview
Hosting URL: https://ahs-2026.web.app
```

**🎉 Your app is now live at**: `https://ahs-2026.web.app`

---

## Part 6: Setup GitHub OAuth App

### Step 1: Create OAuth App

1. Go to: <https://github.com/settings/developers>
2. Click: **"New OAuth App"**
3. Fill in:

| Field | Value |
|-------|-------|
| **Application name** | `AI Onboarding Engineer` |
| **Homepage URL** | `https://ahs-2026.web.app` |
| **Application description** | `AI-powered repository learning platform` |
| **Authorization callback URL** | `https://ahs-2026.firebaseapp.com/__/auth/handler` |

4. Click **"Register application"**

### Step 2: Get Credentials

1. You'll see **Client ID** - **copy it**
2. Click **"Generate a new client secret"**
3. **Copy the client secret** (you won't see it again!)

---

## Part 7: Configure Firebase Authentication

### Step 1: Open Firebase Console

1. Go to: <https://console.firebase.google.com/>
2. Click on project: **ahs-2026**

### Step 2: Enable GitHub Provider

1. Click **"Authentication"** in left sidebar
2. Click **"Sign-in method"** tab
3. Find **"GitHub"** in provider list
4. Click on **GitHub** row
5. Toggle **"Enable"** to ON

### Step 3: Add GitHub Credentials

1. Paste **Client ID** from GitHub
2. Paste **Client Secret** from GitHub
3. Click **"Save"**

### Step 4: Verify Authorized Domains

1. Click **"Settings"** tab (in Authentication)
2. Scroll to **"Authorized domains"**
3. Verify these domains are listed:
   - `localhost` ✅
   - `ahs-2026.web.app` ✅
   - `ahs-2026.firebaseapp.com` ✅

If `ahs-2026.web.app` is missing:
- Click **"Add domain"**
- Enter: `ahs-2026.web.app`
- Click **"Add"**

---

## Part 8: Test Your Setup

### Test 1: Visit Live Site

Navigate to: `https://ahs-2026.web.app`

You should see your landing page.

### Test 2: Test GitHub Login

1. Click **"Login"** or navigate to: `https://ahs-2026.web.app/login`
2. Click the **GitHub** button
3. GitHub authorization popup should appear
4. Click **"Authorize [your username]"**
5. You should be redirected to `/dashboard`

### Test 3: Verify Authentication

1. Open browser devtools (F12)
2. Go to **Console** tab
3. Type: `firebase.auth().currentUser`
4. You should see user object with GitHub info

---

## 🎯 Complete Setup Checklist

- [ ] Firebase CLI installed
- [ ] Application built (`npm run build`)
- [ ] Logged into Firebase (`firebase login`)
- [ ] Firestore rules deployed
- [ ] Hosting deployed (app live at `https://ahs-2026.web.app`)
- [ ] GitHub OAuth app created
- [ ] GitHub Client ID and Secret obtained
- [ ] Firebase Authentication configured with GitHub
- [ ] Authorized domains verified
- [ ] OAuth flow tested successfully

---

## 🔄 Future Deployments

After making code changes:

```bash
# 1. Build
cd "c:\AHS 2026\ai-onboarding-engineer"
npm run build

# 2. Deploy
cd "c:\AHS 2026"
firebase deploy --only hosting
```

**Time per deployment**: ~2 minutes

---

## 🐛 Common Issues

### Issue 1: `auth/unauthorized-domain`

**Cause**: Domain not authorized in Firebase  
**Solution**:
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add `ahs-2026.web.app`

### Issue 2: `redirect_uri_mismatch`

**Cause**: Callback URL doesn't match between GitHub and Firebase  
**Solution**:
1. Verify GitHub OAuth app callback: `https://ahs-2026.firebaseapp.com/__/auth/handler`
2. This is provided by Firebase - copy it exactly

### Issue 3: Popup Blocked

**Cause**: Browser blocking OAuth popup  
**Solution**:
1. Click popup blocked icon in address bar
2. Allow popups for `ahs-2026.web.app`

### Issue 4: Firebase Deploy Fails

**Cause**: Not logged in or wrong project  
**Solution**:
```bash
firebase login
firebase use ahs-2026
firebase deploy --only hosting
```

### Issue 5: 404 on Routes

**Cause**: SPA routing not configured  
**Solution**: Already handled! Your `firebase.json` includes:
```json
"rewrites": [{
  "source": "**",
  "destination": "/index.html"
}]
```

---

## 📊 What's Configured in Your Firebase

### `firebase.json` (Already Updated)

```json
{
  "hosting": {
    "public": "ai-onboarding-engineer/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{
      "source": "**",
      "destination": "/index.html"
    }],
    "headers": [{
      "source": "**/*.@(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2)",
      "headers": [{
        "key": "Cache-Control",
        "value": "max-age=31536000"
      }]
    }]
  }
}
```

### `.firebaserc` (Already Updated)

```json
{
  "projects": {
    "default": "ahs-2026"
  }
}
```

---

## 🔐 Security Notes

### What's Secure ✅

- Firebase API keys in environment variables (`.env`)
- GitHub Client Secret stored in Firebase (not in code)
- OAuth flow handled by Firebase (tokens managed securely)
- HTTPS enforced on Firebase Hosting (automatic)
- Static asset caching configured

### Best Practices 🎯

1. **Never commit** `.env` to public repos
2. Keep GitHub Client Secret private
3. Use different OAuth apps for dev/production
4. Monitor Firebase Authentication usage
5. Review Firestore security rules periodically

---

## 📱 What Users Experience

### Login Flow

```
User visits https://ahs-2026.web.app/login
      ↓
Clicks "GitHub" button
      ↓
Firebase opens GitHub OAuth popup
      ↓
User authorizes app on GitHub
      ↓
GitHub redirects to Firebase callback
      ↓
Firebase creates user session
      ↓
User redirected to /dashboard (logged in)
```

### User sees:

- ✅ Seamless OAuth popup
- ✅ Auto-redirect to dashboard
- ✅ Persistent login session
- ✅ User profile from GitHub

---

## 🎨 Your OAuth Callback URLs

### Production (ahs-2026.web.app)

- **GitHub OAuth App Homepage**: `https://ahs-2026.web.app`
- **GitHub Callback URL**: `https://ahs-2026.firebaseapp.com/__/auth/handler`
- **Firebase Authorized Domain**: `ahs-2026.web.app`

### Development (localhost)

For local testing, you can:
1. Keep using the same OAuth app (works with localhost)
2. OR create a separate OAuth app with:
   - **Homepage**: `http://localhost:5173`
   - **Callback**: `http://localhost:5173/__/auth/handler`

Both approaches work! Localhost is already in Firebase authorized domains.

---

## 📖 Additional Resources

- **Firebase Hosting Docs**: <https://firebase.google.com/docs/hosting>
- **Firebase Auth Docs**: <https://firebase.google.com/docs/auth>
- **GitHub OAuth Docs**: <https://docs.github.com/en/apps/oauth-apps>

---

## ✨ Summary

### What You Have Now

✅ **Live Application**: `https://ahs-2026.web.app`  
✅ **SPA Routing**: All routes work correctly  
✅ **Static Asset Caching**: Fast load times  
✅ **Firebase Authentication**: Ready for GitHub OAuth  
✅ **Firestore Database**: Rules deployed  
✅ **Code Implementation**: OAuth already coded in React app  

### What You Need to Do

1. ⬜ Install Firebase CLI (if not installed)
2. ⬜ Build application
3. ⬜ Deploy to Firebase Hosting
4. ⬜ Create GitHub OAuth App
5. ⬜ Configure Firebase Authentication with GitHub credentials
6. ⬜ Test OAuth flow

**Total Time**: ~15-20 minutes

---

**Live URL After Deployment**: <https://ahs-2026.web.app>

**Firebase Console**: <https://console.firebase.google.com/project/ahs-2026>

**GitHub OAuth Apps**: <https://github.com/settings/developers>
