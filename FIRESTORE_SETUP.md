# Firebase Firestore Setup Guide

## Overview

This guide helps you set up Firebase Firestore with proper security rules to enable persistent data storage for the CodeFlow application.

## Prerequisites

- Firebase project created
- Firebase CLI installed (`npm install -g firebase-tools`)
- Authentication configured with Google OAuth
- `.env.local` configured with Firebase credentials

## Steps to Enable Persistent Data Storage

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

This will open a browser window to authenticate with your Google account.

### 3. Initialize Firebase (if not already done)

```bash
cd c:\AHS\ 2026
firebase init
```

Select:
- ✅ Firestore
- ✅ Hosting (optional)

### 4. Deploy Security Rules

The updated `firestore.rules` file includes:

- **Analyses Collection**: Persistent storage for repository analysis data
  - Users can only read/write their own analyses
  - Required fields: `userId`, `repoUrl`, `repoName`
  - Automatically synced with IndexedDB for offline access

- **Users Collection**: Profile and preference data
  - Each user can only modify their own data

- **Quiz Collection**: Quiz responses and progress
  - Users can track their learning progress

- **Learning Paths**: Personalized learning paths
  - Users maintain their own learning journey

- **Playbooks**: Shared team knowledge
  - Public read, authenticated write

Deploy the rules:

```bash
firebase deploy --only firestore:rules
```

### 5. Create Firestore Indexes (Optional)

If you get an error about missing indexes during queries, run:

```bash
firebase deploy --only firestore:indexes
```

## Verify Setup

### Check Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Verify the rules match the content in `firestore.rules`

### Test from Application

1. Start the frontend:
   ```bash
   cd ai-onboarding-engineer
   npm run dev
   ```

2. Sign in with Google OAuth

3. Navigate to **Analysis** page and enter a GitHub URL

4. The analysis data should be:
   - ✅ Saved to Firestore (persistent)
   - ✅ Cached in IndexedDB (offline access)
   - ✅ Only visible to the authenticated user

### Monitor Firestore

To view stored data:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. **Firestore Database** → **Collections**
4. View the `analyses` collection to see stored repository analyses

## Security Features

✅ **User Isolation**: Users can only access their own data
✅ **Offline Support**: IndexedDB caching + persistence
✅ **Type Safety**: Required fields enforced at DB level
✅ **Audit Trail**: Timestamps track creation and updates
✅ **Sharing Control**: Public read for playbooks, private for analyses

## Common Issues & Fixes

### "Missing or insufficient permissions"
- **Cause**: Rules not deployed
- **Fix**: Run `firebase deploy --only firestore:rules`

### "Document not found"
- **Cause**: Not authenticated or insufficient data
- **Fix**: Sign in with Google OAuth and ensure required fields exist

### "Multiple tabs open" warning
- **Cause**: Offline persistence enabled in multiple tabs
- **Fix**: Close other tabs or ignore warning - it's expected behavior

### Data not persisting between sessions
- **Cause**: IndexedDB not enabled
- **Fix**: Check browser supports IndexedDB (all modern browsers do)
- **Verify**: Open DevTools → Application → IndexedDB → firebaseLocalStorageDb

## Environment Variables Required

Ensure your `.env.local` has:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_API_BASE_URL=http://localhost:8000
```

## Monitoring & Analytics

### View Storage Usage

1. Firebase Console → **Project Settings** → **Usage**
2. Monitor read/write operations
3. Check storage quota

### Enable Cloud Logging (Optional)

```bash
firebase functions:log
```

## Production Checklist

Before deploying to production:

- [ ] Rules are restrictive (no public write access)
- [ ] Indexes created for frequently queried fields
- [ ] Storage quota increased if needed
- [ ] Backup enabled in Cloud Firestore
- [ ] Monitoring and alerts configured
- [ ] CORS configured for frontend domain

## Next Steps

1. **Enable real-time sync**: Edit `RepositoryContext.tsx` to use `onSnapshot()` instead of `getAllUserAnalyses()`
2. **Add batch operations**: Optimize multiple reads/writes
3. **Implement caching strategy**: Reduce unnecessary API calls
4. **Set up automated backups**: Cloud Firestore → Backups

## Resources

- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Enable Offline Persistence](https://firebase.google.com/docs/firestore/enable-offline)

## Support

For issues:
1. Check browser console (F12 → Console tab)
2. View Firebase logs in console
3. Verify `.env.local` configuration
4. Run `firebase deploy --only firestore:rules` again
