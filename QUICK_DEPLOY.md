# 🚀 Quick Deployment Reference

## Backend Deployment (Choose One):

### **Vercel** (Recommended):
```bash
cd c:\AHS 2026\backend
npm install -g vercel
vercel login
vercel --prod
```
**URL**: Gets assigned automatically (e.g., `https://ai-onboarding-backend.vercel.app`)

### **Render**:
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Deploy (auto-detects Python)

**URL**: `https://ai-onboarding-backend.onrender.com`

### **Railway**:
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select backend repo

**URL**: `https://ai-onboarding-backend.railway.app`

---

## Frontend Connection:

### **1. Update Backend CORS** (`c:\AHS 2026\backend\app\main.py`):
```python
allow_origins=[
    "https://YOUR-FRONTEND-URL.vercel.app",  # ← Add your Vercel URL
    "https://*.vercel.app",
]
```

### **2. Add Env Var to Vercel**:
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://YOUR-BACKEND-URL`
   - **Environment**: Production + Preview

### **3. Redeploy Frontend**:
```bash
cd c:\AHS 2026\ai-onboarding-engineer
git add .
git commit -m "Add backend URL"
git push  # Auto-deploys on Vercel
```

---

## ✅ Test Connection:

```bash
# Test backend
curl https://YOUR-BACKEND-URL/

# Expected: {"message": "Codebase Intelligence Layer Operational"}
```

---

## 📂 Modified Files:

- ✅ `backend/vercel.json` - Vercel config
- ✅ `backend/render.yaml` - Render config
- ✅ `backend/railway.json` - Railway config
- ✅ `backend/app/main.py` - Updated CORS
- ✅ `frontend/src/lib/api.ts` - Environment variable support
- ✅ `frontend/.env` - Local API URL

---

## 🎯 Recommended Flow:

1. Deploy backend to **Vercel** → Get URL
2. Update `backend/app/main.py` with frontend Vercel URL
3. Add `VITE_API_BASE_URL` to Vercel (frontend)
4. Push changes to GitHub
5. Test at your Vercel frontend URL

**Total Time**: ~10 minutes ⏱️
