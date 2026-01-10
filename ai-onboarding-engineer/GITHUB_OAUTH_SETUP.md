# GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth authentication for the AI Onboarding Engineer application.

## Prerequisites

- A GitHub account
- A Firebase project (already configured)
- Admin access to your Firebase project

---

## Step 1: Create a GitHub OAuth App

1. **Go to GitHub Developer Settings**
   - Navigate to: <https://github.com/settings/developers>
   - Or: GitHub → Settings → Developer settings → OAuth Apps

2. **Click "New OAuth App"**

3. **Fill in the application details:**

   ```
   Application name: AI Onboarding Engineer (or your preferred name)
   Homepage URL: http://localhost:5173 (for development)
   Application description: AI-powered repository learning assistant
   Authorization callback URL: https://ahs-2026.firebaseapp.com/__/auth/handler
   ```

   **Important Notes:**
   - For production, update the Homepage URL to your production domain
   - The callback URL must use your Firebase auth domain
   - Firebase handles the OAuth flow, so the callback URL is standardized

4. **Click "Register application"**

5. **Save your credentials:**
   - **Client ID**: Copy this immediately
   - **Client Secret**: Click "Generate a new client secret" and copy it
   - ⚠️ **IMPORTANT**: You can only see the client secret once!

---

## Step 2: Configure Firebase Authentication

1. **Go to Firebase Console**
   - Navigate to: <https://console.firebase.google.com/>
   - Select your project: `ahs-2026`

2. **Enable GitHub Authentication**
   - Go to: **Build** → **Authentication** → **Sign-in method**
   - Click on **GitHub** in the providers list
   - Click **Enable**

3. **Add GitHub OAuth Credentials**
   - Paste the **Client ID** from GitHub
   - Paste the **Client Secret** from GitHub
   - Copy the **Authorization callback URL** shown in Firebase
   - Click **Save**

4. **Verify the callback URL matches**
   - The callback URL in Firebase should be: `https://ahs-2026.firebaseapp.com/__/auth/handler`
   - This should match what you entered in GitHub OAuth App

---

## Step 3: Add Authorized Domains (Development)

1. **In Firebase Console:**
   - Go to: **Build** → **Authentication** → **Settings** → **Authorized domains**

2. **Add development domains:**
   - `localhost` (should already be there)
   - If using a different port or domain, add it here

3. **Click "Add domain"** for each new domain

---

## Step 4: Environment Variables (Already Configured)

Your `.env` file already contains the necessary Firebase configuration:

```env
VITE_FIREBASE_API_KEY=AIzaSyBP7BaPPb6CrSDxZIXY_rbdK8ya2fKrvM8
VITE_FIREBASE_AUTH_DOMAIN=ahs-2026.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ahs-2026
VITE_FIREBASE_STORAGE_BUCKET=ahs-2026.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1009473556350
VITE_FIREBASE_APP_ID=1:1009473556350:web:bd35b6a3cf549b88782d2f
VITE_FIREBASE_MEASUREMENT_ID=G-R8LFBQ0HG1
```

**No additional environment variables needed** - GitHub OAuth credentials are stored securely in Firebase!

---

## Step 5: Test the Integration

1. **Start your development server:**

   ```bash
   npm run dev
   ```

2. **Navigate to the login/register page:**
   - Click on the "Sign in with GitHub" button

3. **Expected Flow:**
   - Redirected to GitHub authorization page
   - Grant permissions to your app
   - Redirected back to your application
   - User logged in successfully

4. **Check for successful authentication:**
   - User object should be available in AuthContext
   - User should be redirected to `/dashboard`

---

## Troubleshooting

### Common Issues

#### 1. **Error: `auth/unauthorized-domain`**

**Solution:** Add your domain to Firebase authorized domains

- Firebase Console → Authentication → Settings → Authorized domains
- Add: `localhost`, `127.0.0.1`, or your custom domain

#### 2. **Error: redirect_uri_mismatch**

**Solution:** Ensure callback URLs match exactly

- GitHub OAuth App callback URL: `https://ahs-2026.firebaseapp.com/__/auth/handler`
- Firebase Auth domain: `ahs-2026.firebaseapp.com`

#### 3. **Error: Invalid credentials**

**Solution:** Verify GitHub OAuth credentials in Firebase

- Firebase Console → Authentication → Sign-in method → GitHub
- Re-enter Client ID and Client Secret

#### 4. **Popup blocked**

**Solution:** Allow popups for localhost or your domain in browser settings

#### 5. **CORS errors**

**Solution:**

- Ensure Firebase SDK is properly initialized
- Check that all Firebase configuration is correct in `.env`

---

## Production Deployment

When deploying to production:

1. **Update GitHub OAuth App:**
   - Add production domain to "Homepage URL"
   - Keep the same callback URL (Firebase handles this)

2. **Update Firebase Authorized Domains:**
   - Add your production domain
   - Example: `app.yourdomain.com`

3. **Environment Variables:**
   - Ensure all `VITE_FIREBASE_*` variables are set in production environment
   - Never commit `.env` files to version control

---

## Security Best Practices

✅ **DO:**

- Keep Client Secret secure and never commit to git
- Use environment variables for sensitive data
- Enable Firebase App Check for production
- Regularly rotate OAuth credentials
- Monitor authentication logs in Firebase

❌ **DON'T:**

- Commit `.env` files to version control
- Share Client Secret publicly
- Use development credentials in production
- Disable Firebase security rules

---

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Firebase GitHub Auth Guide](https://firebase.google.com/docs/auth/web/github-auth)

---

## Support

If you encounter issues:

1. Check Firebase Console logs
2. Check browser console for errors
3. Verify all credentials are correct
4. Review Firebase security rules
5. Check GitHub OAuth App settings

---

**Setup completed! Your GitHub OAuth integration should now be working.** 🎉
