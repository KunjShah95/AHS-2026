# Repository Analysis Troubleshooting Guide

## Issue: Website can't fetch and analyze repository

---

## ✅ FIXES APPLIED

### 1. **Backend Environment Configuration** ✓

- **Problem**: `GOOGLE_CLOUD_PROJECT` environment variable was missing
- **Solution**: Added to `.env` file
- **File**: `backend/.env`
- **Added**: `GOOGLE_CLOUD_PROJECT=ahs-2026-onboarding`

### 2. **TypeScript Export Issues** ✓

- **Problem**: Export forward declarations before type definitions
- **Solution**: Removed forward type-only exports
- **File**: `backend/app/lib/db.ts`
- **Fixed**: Cleaned up module-level export statements

### 3. **Frontend TypeScript Config** ✓

- **Problem**: Type imports not using `type` keyword
- **Solution**: Updated RepositoryContext to use `type` keyword for imports
- **File**: `ai-onboarding-engineer/src/context/RepositoryContext.tsx`
- **Fixed**: `import type { SavedAnalysis }` instead of `import { SavedAnalysis }`

---

## 🔍 DIAGNOSIS STEPS

If the issue persists, follow these steps:

### Step 1: Verify Backend is Running

```bash
# Terminal 1: Start Backend
cd backend
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Then start server:
uvicorn app.main:app --reload
```

✅ You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### Step 2: Verify Frontend Build (Clear Cache)

```bash
# Terminal 2: Restart Frontend with cache clear
cd ai-onboarding-engineer

# Clear Vite cache
rm -r node_modules/.vite 2>nul || true

# Force rebuild
npm run dev -- --force
```

✅ You should see:

```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

### Step 3: Check Browser Console

1. Open browser DevTools: **F12**
2. Go to **Console** tab
3. Check for errors (red text)
4. Check **Network** tab to see API calls:
   - Look for POST `/ingestion/process` request
   - Check response status and body

### Step 4: Test API Directly

```bash
# While backend is running, test the endpoint
curl -X POST http://localhost:8000/ingestion/process \
  -H "Content-Type: application/json" \
  -d '{"repo_path": "agent_test_repo", "github_url": null}' \
  2>&1
```

✅ Should return `{"status": "success", ...}`

---

## 🐛 COMMON ERRORS & FIXES

### Error: `CORS error: The Access-Control-Allow-Origin header is missing`

**Problem**: Backend not running or CORS not configured

**Solution**:

1. Make sure backend is running (see Step 1 above)
2. Check backend logs for errors
3. Verify `VITE_API_BASE_URL` in frontend `.env.local`:

   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```

---

### Error: `TypeError: Cannot read property 'status' of undefined`

**Problem**: API response is not being parsed correctly

**Solution**:

1. Check backend `/ingestion/process` endpoint is returning valid JSON
2. Test with curl (see Step 4 above)
3. Check for network errors in Console

---

### Error: `Firebase operation failed: ...`

**Problem**: Firebase configuration issue

**Solution**:

1. Check `ai-onboarding-engineer/.env.local` has Firebase config:

   ```
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   ```

2. Verify Firebase credentials are valid
3. Check Firebase Firestore rules allow writes

---

### Error: `Module not found: RepositoryContext`

**Problem**: TypeScript module resolution issue

**Solution**:

1. Clear cache and restart dev server:

   ```bash
   rm -r node_modules/.vite
   npm run dev -- --force
   ```

2. Verify path alias in `tsconfig.app.json`:

   ```json
   "paths": { "@/*": ["./src/*"] }
   ```

---

## 🚀 QUICK FIX CHECKLIST

- [ ] **Backend running**: `uvicorn app.main:app --reload`
- [ ] **Frontend running**: `npm run dev`
- [ ] **Environment variables set**:
  - Backend `.env`: Has `GOOGLE_CLOUD_PROJECT`, `GEMINI_API_KEY`, `GITHUB_PAT`
  - Frontend `.env.local`: Has `VITE_API_BASE_URL`, Firebase config
- [ ] **Frontend cache cleared**: `rm -r node_modules/.vite && npm run dev -- --force`
- [ ] **Browser console clean**: No red errors
- [ ] **API responding**: `curl http://localhost:8000/` returns `{"message": "CodeFlow..."}`
- [ ] **No CORS errors**: Check browser Network tab

---

## 📋 FILE LOCATIONS

| File | Purpose | Status |
|------|---------|--------|
| `backend/.env` | Backend configuration | ✅ Updated |
| `ai-onboarding-engineer/.env.local` | Frontend configuration | ⚠️ Check manually |
| `ai-onboarding-engineer/src/lib/db.ts` | Database exports | ✅ Fixed |
| `ai-onboarding-engineer/src/context/RepositoryContext.tsx` | State management | ✅ Updated |
| `backend/app/main.py` | Backend entry point | ✅ Verified |
| `backend/app/api/endpoints/ingestion.py` | Repository analysis endpoint | ✅ Verified |

---

## 🔧 NEXT STEPS

1. **Restart both servers** (backend + frontend)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Try analyzing a repository** through the UI
4. **Monitor console logs** for errors
5. **If still failing**: Check Step 3 (Browser Console) and Step 4 (Test API Directly)

---

## ✨ SUCCESS INDICATORS

When everything is working:

1. ✅ No red errors in browser console
2. ✅ `/ingestion/process` request shows status 200 in Network tab
3. ✅ Backend logs show processing stages:

   ```
   INFO: Processing repository...
   INFO: Agent 1: Ingestion complete
   INFO: Agent 2: Code Intelligence complete
   INFO: Agent 3: Learning Graph complete
   INFO: Agent 4: Task Generation complete
   ```

4. ✅ UI shows "Analyzing Codebase Structure..." then navigates to Roadmap
5. ✅ Roadmap displays repository-specific content

---

**Last Updated**: January 11, 2026
**Session**: Repository Persistence Implementation - Error Resolution
