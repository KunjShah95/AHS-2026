# 🎯 Backend-Frontend Integration Checklist

## ✅ Pre-Deployment Checklist

### Backend Setup:
- [x] FastAPI backend exists at `c:\AHS 2026\backend`
- [x] Dependencies listed in `requirements.txt`
- [x] CORS middleware configured in `app/main.py`
- [x] Deployment configs created:
  - [x] `vercel.json` (Vercel)
  - [x] `render.yaml` (Render)
  - [x] `railway.json` (Railway)
- [x] `.env.example` created for reference

### Frontend Setup:
- [x] React frontend at `c:\AHS 2026\ai-onboarding-engineer`
- [x] API client configured (`src/lib/api.ts`)
- [x] Environment variable support added
- [x] `.env` file includes `VITE_API_BASE_URL`

---

## 🚀 Deployment Steps

### Step 1: Choose Backend Platform
Select ONE of the following:

#### Option A: Vercel (Recommended)
```bash
cd c:\AHS 2026\backend
npm install -g vercel
vercel login
vercel
# Note the deployment URL
```

#### Option B: Render
1. Push backend to GitHub
2. Create new Web Service on Render
3. Connect GitHub repo
4. Note the deployment URL

#### Option C: Railway
1. Push backend to GitHub
2. Create new project on Railway
3. Deploy from GitHub
4. Note the deployment URL

**Backend URL**: `_________________________` ← Write it here!

---

### Step 2: Update Backend CORS

Edit `c:\AHS 2026\backend\app\main.py`:

```python
allow_origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "https://YOUR_VERCEL_FRONTEND_URL.vercel.app",  # ← Add your URL
    "https://*.vercel.app",
],
```

**Commit and redeploy backend!**

---

### Step 3: Configure Frontend Environment

#### Vercel Dashboard:
1. Go to your frontend project on Vercel
2. Settings → Environment Variables
3. Add new variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://YOUR_BACKEND_URL` (from Step 1)
   - **Environment**: Production, Preview, Development

#### Local `.env` (already done):
```bash
VITE_API_BASE_URL=http://localhost:8000
```

---

### Step 4: Redeploy Frontend

```bash
cd c:\AHS 2026\ai-onboarding-engineer
git add .
git commit -m "Configure backend API connection"
git push
```

Vercel will auto-deploy. Wait for deployment to complete.

---

## 🧪 Testing

### 1. Test Backend Health:
```bash
curl https://YOUR_BACKEND_URL/
```

**Expected Response**:
```json
{"message": "Codebase Intelligence Layer Operational"}
```

### 2. Test Backend API Docs:
Visit: `https://YOUR_BACKEND_URL/docs`

Should show Swagger UI with all endpoints.

### 3. Test Frontend → Backend Connection:

Open browser console on your frontend:
```javascript
fetch(import.meta.env.VITE_API_BASE_URL + '/')
  .then(r => r.json())
  .then(console.log);
```

**Expected**: `{"message": "Codebase Intelligence Layer Operational"}`

### 4. Test with Authentication:

Login to your app, then test an authenticated endpoint:
```javascript
import { api } from './lib/api';

api.get('/analytics')
  .then(console.log)
  .catch(console.error);
```

---

## 🔍 Troubleshooting

### CORS Error in Browser Console:

**Problem**: 
```
Access to fetch at 'https://backend.url' from origin 'https://frontend.url' 
has been blocked by CORS policy
```

**Solution**:
1. Verify backend `allow_origins` includes your frontend URL
2. Ensure `allow_credentials=True` is set
3. Redeploy backend after changes

---

### 404 Not Found:

**Problem**: API requests return 404

**Solution**:
1. Check `VITE_API_BASE_URL` is set correctly in Vercel
2. Verify backend is deployed and running
3. Test backend URL directly in browser

---

### Authentication Errors:

**Problem**: API requests fail with auth errors

**Solution**:
1. Ensure user is logged in
2. Check Firebase token is being sent (see Network tab)
3. Verify backend Firebase config matches frontend

---

## 📊 Verify Deployment

### Backend Checklist:
- [ ] Backend deployed successfully
- [ ] Health check endpoint (`/`) returns success
- [ ] API docs accessible at `/docs`
- [ ] CORS configured with frontend URL
- [ ] Environment variables set (if needed)

### Frontend Checklist:
- [ ] Frontend deployed on Vercel
- [ ] `VITE_API_BASE_URL` set in Vercel
- [ ] No CORS errors in browser console
- [ ] API requests working from browser
- [ ] Authentication flow working end-to-end

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Frontend loads without errors
✅ Backend health check responds
✅ API requests from frontend work
✅ Authentication flow completes
✅ No CORS errors in console
✅ All features functional in production

---

## 📚 Reference Documentation

- **Full Deployment Guide**: `BACKEND_DEPLOYMENT_GUIDE.md`
- **Quick Reference**: `QUICK_DEPLOY.md`
- **Architecture Diagram**: See generated image
- **Backend API Docs**: `https://YOUR_BACKEND_URL/docs`
- **Frontend Setup**: `ai-onboarding-engineer/SETUP_SUMMARY.md`

---

## 🆘 Need Help?

1. Check backend logs on deployment platform
2. Check browser console for frontend errors
3. Test endpoints individually using curl or Postman
4. Verify all environment variables are set
5. Ensure both frontend and backend are on latest deployment

---

**Estimated Time**: 15-20 minutes for full deployment ⏱️

**Status**: Ready to Deploy! 🚀
