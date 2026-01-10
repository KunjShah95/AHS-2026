# OAuth Authentication Setup Guide

Complete guide for setting up Google and GitHub OAuth authentication for the AI Onboarding Engineer application.

## 🚀 Quick Setup (20 minutes)

### Step 1: Enable Google OAuth in Firebase (2 min)

1. Go to [Firebase Console Authentication](https://console.firebase.google.com/project/studio-9620568047-2d6e3/authentication/providers)
2. Click on **Google** provider
3. Toggle **Enable**
4. Set project support email
5. Click **Save**

### Step 2: Create GitHub OAuth App (10 min)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: `AI Onboarding Engineer`
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: 
     ```
     https://studio-9620568047-2d6e3.firebaseapp.com/__/auth/handler
     ```
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** → Copy it

### Step 3: Add GitHub to Firebase (2 min)

1. Firebase Console → **GitHub** provider
2. Toggle **Enable**
3. Paste **Client ID** and **Client secret**
4. Click **Save**

### Step 4: Test (5 min)

```bash
cd c:\AHS 2026\frontend\ai-onboarding-engineer
npm run dev
```

Visit http://localhost:5173/login and test:
- ✅ Google login
- ✅ GitHub login
- ✅ Email/Password

---

## 🎨 What Was Implemented

### Authentication Methods
1. **Google OAuth** - One-click sign-in with Google
2. **GitHub OAuth** - One-click sign-in with GitHub
3. **Email/Password** - Traditional signup

### Updated Components
- `src/context/AuthContext.tsx` - OAuth providers implementation
- `src/pages/Login.tsx` - Google & GitHub buttons
- `src/pages/Register.tsx` - Google & GitHub buttons
- `src/components/layout/Navbar.tsx` - Dynamic auth state (shows user email when logged in)

### UI Features
- Side-by-side Google & GitHub buttons
- Official brand colors for OAuth providers
- Responsive mobile layout
- User email displayed in navbar when logged in
- Logout functionality

---

## 🔧 Production Deployment

### Update GitHub OAuth App for Production
1. Create new OAuth App (or update existing)
2. Update URLs:
   - **Homepage URL**: `https://yourdomain.com`
   - **Callback URL**: Keep Firebase URL or use custom domain

### Add Production Domain to Firebase
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add your production domain

---

## 🐛 Troubleshooting

### Google OAuth Issues

**"Access blocked: This app's request is invalid"**
- Ensure support email is set in Firebase Google provider

**"redirect_uri_mismatch"**
- Check authorized domains in Firebase settings

### GitHub OAuth Issues

**"redirect_uri MUST match"**
- Verify callback URL in GitHub matches:
  ```
  https://studio-9620568047-2d6e3.firebaseapp.com/__/auth/handler
  ```

**Popup blocked**
- Allow popups for localhost in browser

**"unauthorized domain"**
- Add `localhost` to Firebase authorized domains

---

## 📚 Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [GitHub OAuth Apps Docs](https://docs.github.com/en/developers/apps/building-oauth-apps)
- See `oauth_flow_diagram.png` for visual authentication flow

---

## ✅ Verification Checklist

After setup:
- [ ] Google OAuth enabled in Firebase
- [ ] GitHub OAuth App created
- [ ] Client ID/Secret added to Firebase
- [ ] Tested Google login
- [ ] Tested GitHub login
- [ ] Logout works correctly
- [ ] User email shows in navbar
