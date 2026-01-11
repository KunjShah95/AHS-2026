# Frontend-Backend Integration Checklist

## Quick Start (5 minutes)

### Frontend (Vercel)

```
VITE_API_BASE_URL=https://ahs-2026.onrender.com
```

### Backend (Render)

```
FRONTEND_URL_PROD=https://your-vercel-domain.vercel.app
```

Then deploy and test!

---

## Complete Setup Checklist

### Phase 1: Environment Configuration

#### Frontend (.env.local for local testing)

- [ ] `VITE_API_BASE_URL=http://localhost:8000` (for local dev)
- [ ] All Firebase credentials filled in
- [ ] Firebase project ID matches: `ahs-2026`

#### Backend (.env)

- [ ] `GOOGLE_CLOUD_PROJECT=ahs-2026`
- [ ] `GOOGLE_CLOUD_CREDENTIALS=<JSON blob>`
- [ ] `FRONTEND_URL_PROD=` (will set in Render)

#### Render Dashboard

- [ ] Backend service created
- [ ] Environment variables set
- [ ] Service is running (check at <https://ahs-2026.onrender.com>)

#### Vercel Dashboard

- [ ] Project created
- [ ] GitHub repo connected
- [ ] Environment variables configured:
  - [ ] `VITE_API_BASE_URL`
  - [ ] `VITE_FIREBASE_API_KEY`
  - [ ] `VITE_FIREBASE_AUTH_DOMAIN`
  - [ ] `VITE_FIREBASE_PROJECT_ID`
  - [ ] `VITE_FIREBASE_STORAGE_BUCKET`
  - [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `VITE_FIREBASE_APP_ID`
  - [ ] `VITE_FIREBASE_MEASUREMENT_ID`

### Phase 2: CORS Configuration

- [ ] Backend `main.py` has CORS middleware
- [ ] `allowed_origins` includes localhost URLs
- [ ] `FRONTEND_URL_PROD` env var reads into allowed_origins
- [ ] Vercel wildcard `https://*.vercel.app` allowed

### Phase 3: Firebase Setup

- [ ] Firebase project created: `ahs-2026`
- [ ] Google OAuth configured with Vercel domain
- [ ] Firestore enabled
- [ ] Security rules deployed
- [ ] Indexes created (if needed)
- [ ] Auth sign-in method: Google OAuth ✓

### Phase 4: Deployment

#### Option A: Render + Vercel Dashboard

1. [ ] Go to Render dashboard
2. [ ] Create new Web Service
3. [ ] Connect GitHub repo
4. [ ] Set Build: `pip install -r requirements.txt`
5. [ ] Set Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. [ ] Set Environment Variables
7. [ ] Deploy
8. [ ] Go to Vercel dashboard
9. [ ] Create new project, import repo
10. [ ] Set Environment Variables
11. [ ] Deploy

#### Option B: Using CLI

```bash
# From root directory
# Deploy backend
cd backend
vercel deploy --prod  # if using Vercel for backend too

# Or for Render:
# Go to https://dashboard.render.com and connect GitHub

# Deploy frontend
cd ai-onboarding-engineer
vercel deploy --prod
```

### Phase 5: Testing

#### Local Testing (Before Production)

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd ai-onboarding-engineer
npm run dev

# Visit http://localhost:5173
# Sign in with Google
# Test Analysis page
```

#### Production Testing

- [ ] Visit `https://your-vercel-domain.vercel.app`
- [ ] Google OAuth sign-in works
- [ ] Navigate to Analysis page
- [ ] Submit a GitHub URL
- [ ] See "Analyzing..." loader
- [ ] Result shows in Roadmap page
- [ ] Check [Render logs](https://dashboard.render.com) - no errors
- [ ] Check [Vercel logs](https://vercel.com) - no errors
- [ ] Check browser DevTools Network tab - all requests 200 OK
- [ ] Check Firestore - data saved

### Phase 6: Monitoring

- [ ] Set up Render uptime monitoring
- [ ] Set up Vercel analytics
- [ ] Monitor Firebase usage
- [ ] Check Render for cold starts (upgrade if needed)
- [ ] Monitor API response times

---

## Critical Environment Variables

### Must Be Exactly Right

| Variable | Value | Where |
|----------|-------|-------|
| VITE_API_BASE_URL | <https://ahs-2026.onrender.com> | Vercel |
| VITE_FIREBASE_PROJECT_ID | ahs-2026 | Vercel |
| FRONTEND_URL_PROD | <https://your-domain.vercel.app> | Render |
| GOOGLE_CLOUD_PROJECT | ahs-2026 | Render |

### If Any Are Wrong

- [ ] CORS errors → check API_BASE_URL and FRONTEND_URL_PROD
- [ ] Firebase errors → check all FIREBASE_* variables
- [ ] "Not Found" errors → check backend is running

---

## Troubleshooting Decision Tree

### "Cannot reach API" / Network errors

1. Is backend running? → <https://ahs-2026.onrender.com>
2. Is VITE_API_BASE_URL set to HTTPS? (not HTTP)
3. Are CORS errors in console?
4. Check Render logs for errors

### "CORS blocked" error

1. Backend crashed? Check Render logs
2. FRONTEND_URL_PROD set in Render env?
3. Restart Render service
4. Check `main.py` CORS middleware exists

### "Firebase Auth failed"

1. Are Firebase env vars all set?
2. Do they match your Firebase project?
3. Is Google OAuth app configured with Vercel domain?
4. Check Firebase Console → Authentication

### "Data not saving"

1. Did Firestore security rules deploy?
2. Run: `firebase deploy --only firestore:rules`
3. Is user authenticated (signed in)?
4. Check Firestore Console for write permissions

### "Backend taking 30+ seconds"

1. Render free tier = cold starts
2. Upgrade to Starter plan ($7/month)
3. Or keep-alive by making requests

---

## Success Indicators

When everything works:

✅ Frontend loads instantly
✅ Google OAuth sign-in works
✅ Analysis API responds in <5 seconds
✅ Data appears in Firestore
✅ No console errors
✅ No CORS warnings
✅ Offline mode works (IndexedDB)
✅ Vercel logs show clean requests
✅ Render logs show clean responses

---

## Deployment URLs

| Service | URL | Status |
|---------|-----|--------|
| Backend API | <https://ahs-2026.onrender.com> | Check on Render |
| Frontend | <https://your-vercel-domain.vercel.app> | Check on Vercel |
| Firebase Console | <https://console.firebase.google.com> | Check authentication |
| Render Dashboard | <https://dashboard.render.com> | Monitor logs |
| Vercel Dashboard | <https://vercel.com> | Monitor logs |

---

## One-Time Setup Commands

```bash
# From root directory

# 1. Deploy Firestore rules
firebase deploy --only firestore:rules

# 2. Build frontend
cd ai-onboarding-engineer
npm run build

# 3. Deploy frontend
vercel deploy --prod

# 4. Check backend
curl https://ahs-2026.onrender.com/
```

---

## Getting Help

1. **Check Console** - F12 → Console, Network tabs
2. **Check Logs**:
   - Vercel: <https://vercel.com/dashboard> → Logs
   - Render: <https://dashboard.render.com> → Logs
   - Firebase: <https://console.firebase.google.com>
3. **Common Issues**: See DEPLOYMENT_CONNECTION_GUIDE.md
4. **Verify Environment**: Check all vars are set and correct
