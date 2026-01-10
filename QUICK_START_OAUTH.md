# 🚀 Quick Start Guide - OAuth Authentication

## What Was Implemented

Your AI Onboarding Engineer app now has **3 authentication methods**:

1. ✅ **Google OAuth** - Sign in with Google account
2. ✅ **GitHub OAuth** - Sign in with GitHub account  
3. ✅ **Email/Password** - Traditional email signup

## 🎯 What You Need to Do Next

### Step 1: Configure Firebase Console (5 minutes)

#### Enable Google Sign-In

1. Visit: <https://console.firebase.google.com/project/studio-9620568047-2d6e3/authentication/providers>
2. Click on **Google** provider
3. Toggle **Enable**
4. Enter your support email
5. Click **Save**

#### Enable GitHub Sign-In

1. On the same page, click **GitHub** provider
2. Toggle **Enable**
3. **Leave it for now** - you'll add credentials in Step 2
4. Note the callback URL shown (you'll need it)

### Step 2: Create GitHub OAuth App (10 minutes)

1. Go to: <https://github.com/settings/developers>
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:

   ```
   Application name: AI Onboarding Engineer
   Homepage URL: http://localhost:5173
   Callback URL: https://studio-9620568047-2d6e3.firebaseapp.com/__/auth/handler
   ```

4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** → Copy it

### Step 3: Add GitHub Credentials to Firebase (2 minutes)

1. Return to Firebase Console → GitHub provider settings
2. Paste **Client ID** and **Client secret**
3. Click **Save**

### Step 4: Test Everything (5 minutes)

1. Open terminal in `c:\AHS 2026\frontend\ai-onboarding-engineer`
2. Run: `npm run dev`
3. Visit: <http://localhost:5173>
4. Try logging in with:
   - ✅ Google button
   - ✅ GitHub button
   - ✅ Email/Password

## 📱 User Experience

### Login Page (`/login`)

```
┌─────────────────────────────────┐
│      Welcome back              │
│                                 │
│  ┌─────────┐  ┌─────────┐     │
│  │ GitHub  │  │ Google  │     │
│  └─────────┘  └─────────┘     │
│                                 │
│  Or continue with email        │
│                                 │
│  [  Email input  ]             │
│  [  Password input  ]          │
│  [  Sign In Button  ]          │
└─────────────────────────────────┘
```

### Register Page (`/register`)

```
┌─────────────────────────────────┐
│   Create an account            │
│                                 │
│  ┌─────────┐  ┌─────────┐     │
│  │ GitHub  │  │ Google  │     │
│  └─────────┘  └─────────┘     │
│                                 │
│  Or sign up with email         │
│                                 │
│  [  Email input  ]             │
│  [  Password input  ]          │
│  [  Create Account Button ]    │
└─────────────────────────────────┘
```

### Navbar (Logged Out)

```
Cortex  [Analysis] [Roadmap] [Architecture] [Tasks] [Dashboard]    [Login] [Register]
```

### Navbar (Logged In)

```
Cortex  [Analysis] [Roadmap] [Architecture] [Tasks] [Dashboard]    user@email.com [Logout]
```

## ✅ Verification Checklist

After completing Steps 1-3, verify:

- [ ] Can click Google button on `/login`
- [ ] Google popup appears and allows sign-in
- [ ] After Google login, redirects to homepage
- [ ] User email appears in navbar
- [ ] Can click GitHub button on `/login`  
- [ ] GitHub authorization page appears
- [ ] After GitHub login, redirects to homepage
- [ ] Logout button works
- [ ] Can create account with email/password
- [ ] Can login with email/password after creation

## 🐛 Common Issues

### "This app's request is invalid" (Google)

**Fix**: Make sure you set a support email in Firebase Google provider settings

### "redirect_uri_mismatch" (GitHub)  

**Fix**: Double-check the callback URL in GitHub OAuth App settings matches:

```
https://studio-9620568047-2d6e3.firebaseapp.com/__/auth/handler
```

### Popup blocked

**Fix**: Allow popups for localhost in your browser settings

### "unauthorized domain"

**Fix**: Add `localhost` to Firebase → Authentication → Settings → Authorized domains

## 📚 Full Documentation

For detailed setup instructions, troubleshooting, and security best practices, see:

- **OAUTH_SETUP_GUIDE.md** - Complete setup guide
- **AUTH_IMPLEMENTATION_SUMMARY.md** - Technical implementation details

## 🎉 You're Done

Once you complete the 3 steps above, your users can sign in with:

- Google (easiest for most users)
- GitHub (perfect for developers)
- Email/Password (traditional method)

**Total setup time**: ~20 minutes
