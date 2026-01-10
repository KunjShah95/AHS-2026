# Quick Deployment Steps for Firebase + GitHub OAuth

## 🎯 Your Mission: Deploy to Firebase Hosting with GitHub OAuth

Follow these steps **in order**:

---

## ✅ Step 1: Build Your Application

```bash
cd "c:\AHS 2026\ai-onboarding-engineer"
npm run build
```

This creates the `dist` folder that Firebase will serve.

---

## ✅ Step 2: Deploy to Firebase Hosting

```bash
cd "c:\AHS 2026"
firebase deploy --only hosting
```

**Expected Output**:

```bash
✔  Deploy complete!
Hosting URL: https://ahs-2026.web.app
```

**Save this URL!** You'll need it for GitHub OAuth.

---

## ✅ Step 3: Configure GitHub OAuth App

1. **Open GitHub Developer Settings**:
   - Go to: <https://github.com/settings/developers>
   - Click **"New OAuth App"**

2. **Fill in the form**:

   ```bash
   Application name: AI Onboarding Engineer
   Homepage URL: https://ahs-2026.web.app
   Authorization callback URL: https://ahs-2026.firebaseapp.com/__/auth/handler
   ```

3. **Click "Register application"**

4. **Copy your credentials**:
   - Copy **Client ID** (you'll need this)
   - Click **"Generate a new client secret"**
   - Copy **Client Secret** (you'll need this)

---

## ✅ Step 4: Configure Firebase Authentication

1. **Open Firebase Console**:
   - Go to: <https://console.firebase.google.com/>
   - Select project: **ahs-2026**

2. **Enable GitHub Authentication**:
   - Click **"Authentication"** (left sidebar)
   - Click **"Sign-in method"** tab
   - Find **"GitHub"** in the list
   - Click on **"GitHub"**
   - Toggle **"Enable"** to ON

3. **Enter GitHub Credentials**:
   - Paste your **Client ID** from GitHub
   - Paste your **Client Secret** from GitHub
   - Click **"Save"**

4. **Verify Authorized Domains**:
   - Go to: **Authentication → Settings → Authorized domains**
   - Ensure these domains are listed:
     - `localhost`
     - `ahs-2026.web.app`
     - `ahs-2026.firebaseapp.com`
   - (They should be auto-added after deployment)

---

## ✅ Step 5: Test Your Deployment

1. **Visit your live site**:

   ```bash
   https://ahs-2026.web.app
   ```

2. **Navigate to Login**:
   - Click login/register link
   - Or visit: `https://ahs-2026.web.app/login`

3. **Test GitHub OAuth**:
   - Click the **"GitHub"** button
   - Authorize the application in the popup
   - You should be redirected to `/dashboard`

---

## 🎉 You're Done

Your application is now live at: **<https://ahs-2026.web.app>**

---

## 🐛 Troubleshooting

### Issue: `auth/unauthorized-domain`

**Solution**: Add your domain to Firebase authorized domains

- Firebase Console → Authentication → Settings → Authorized domains
- Click **"Add domain"**
- Enter: `ahs-2026.web.app`

### Issue: `redirect_uri_mismatch`

**Solution**: Verify callback URLs match exactly

- GitHub OAuth App callback: `https://ahs-2026.firebaseapp.com/__/auth/handler`
- Firebase provides this URL - copy it exactly

### Issue: Popup Blocked

**Solution**: Allow popups for your site

- Click the blocked popup icon in browser address bar
- Allow popups for `ahs-2026.web.app`

### Issue: 404 on Routes

**Solution**: Already handled! Your `firebase.json` includes rewrites for SPA routing.

---

## 🔄 Future Deployments

After making code changes:

```bash
# 1. Navigate to frontend
cd "c:\AHS 2026\ai-onboarding-engineer"

# 2. Build
npm run build

# 3. Deploy
cd "c:\AHS 2026"
firebase deploy --only hosting
```

**Time**: ~2 minutes per deployment

---

## 📝 Important URLs

- **Live Site**: <https://ahs-2026.web.app>
- **Firebase Console**: <https://console.firebase.google.com/project/ahs-2026>
- **GitHub OAuth Settings**: <https://github.com/settings/developers>

---

## ✨ What's Already Configured

✅ Firebase Hosting setup  
✅ SPA routing (all routes work)  
✅ Static asset caching  
✅ GitHub OAuth code (in your app)  
✅ Firebase Authentication initialized  
✅ Firestore database ready  

**Just deploy and configure OAuth!**
