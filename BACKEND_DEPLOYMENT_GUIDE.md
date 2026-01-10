# Backend Deployment & Frontend Connection Guide

## 📦 Backend Overview

Your backend is a **FastAPI (Python)** application with:
- Repository ingestion and analysis
- Code intelligence (AST-based dependency graphs)
- Learning path generation
- Task generation
- Interactive tutor Q&A
- Firebase integration

**Local URL**: `http://localhost:8000`
**Docs**: `http://localhost:8000/docs` (Swagger UI)

---

## 🚀 Deployment Options

### **Option 1: Vercel (Recommended - Same platform as frontend)**

#### Prerequisites:
- Vercel CLI: `npm install -g vercel`
- Vercel account linked to GitHub

#### Deployment Steps:

```bash
# Navigate to backend directory
cd c:\AHS 2026\backend

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Scope: (your account)
# - Link to existing project? No
# - Project name: ai-onboarding-backend
# - Directory: ./
# - Override settings? No

# Your backend will be deployed to:
# https://ai-onboarding-backend.vercel.app
```

#### Production Deployment:
```bash
vercel --prod
```

#### Environment Variables (if needed):
```bash
# Add environment variables in Vercel dashboard
# or via CLI:
vercel env add FIREBASE_CREDENTIALS production
```

---

### **Option 2: Render.com (Great for Python)**

#### Deployment Steps:

1. **Push to GitHub** (if not already):
   ```bash
   cd c:\AHS 2026\backend
   git init
   git add .
   git commit -m "Initial backend commit"
   git remote add origin https://github.com/YOUR_USERNAME/ai-onboarding-backend.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - Click **"New +"** → **"Web Service"**
   - Connect GitHub repository
   - Configure:
     - **Name**: `ai-onboarding-backend`
     - **Runtime**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Click **"Create Web Service"**

3. **Your backend URL**: `https://ai-onboarding-backend.onrender.com`

---

### **Option 3: Railway.app (Developer-friendly)**

#### Deployment Steps:

1. **Deploy via GitHub**:
   - Go to [railway.app](https://railway.app)
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select your backend repository
   - Railway auto-detects Python and deploys

2. **Configure** (if needed):
   - Railway auto-detects `requirements.txt`
   - Ensure start command is set (usually auto-detected)

3. **Your backend URL**: `https://ai-onboarding-backend.railway.app`

---

### **Option 4: Google Cloud Run (Most scalable, requires Firebase integration)**

Since you're using Firebase, Cloud Run is a natural fit:

```bash
# Install Google Cloud SDK
# Then:
gcloud run deploy ai-onboarding-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🔗 Connecting Frontend to Backend

### **Step 1: Update Backend CORS**

The backend (`c:\AHS 2026\backend\app\main.py`) has been updated to allow your Vercel frontend.

**Replace** `https://your-vercel-app.vercel.app` with your actual Vercel URL:

```python
allow_origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "https://ai-onboarding-engineer.vercel.app",  # ← Update this
    "https://*.vercel.app",
],
```

### **Step 2: Configure Frontend Environment Variables**

#### **Local Development** (`.env`):
```bash
VITE_API_BASE_URL=http://localhost:8000
```

#### **Vercel Production**:

1. Go to your frontend project on Vercel
2. **Settings** → **Environment Variables**
3. Add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-url.vercel.app` (or Render/Railway URL)
   - **Environments**: Production, Preview

4. **Redeploy** your frontend:
   ```bash
   # In frontend directory
   cd c:\AHS 2026\ai-onboarding-engineer
   git add .
   git commit -m "Update API configuration"
   git push
   ```

---

## ✅ Testing the Connection

### **1. Test Backend Locally:**
```bash
cd c:\AHS 2026\backend
uvicorn app.main:app --reload

# Visit: http://localhost:8000/docs
```

### **2. Test API Endpoint:**
```bash
# Test root endpoint
curl http://localhost:8000/

# Expected response:
# {"message": "Codebase Intelligence Layer Operational"}
```

### **3. Test from Frontend:**

In your frontend, you can now use the API client:

```typescript
import { api } from './lib/api';

// Example: Process a repository
const processRepo = async (repoUrl: string) => {
  try {
    const result = await api.post('/ingestion/process', {
      repository_url: repoUrl
    });
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 🔒 Security Checklist

- [ ] Update CORS origins with actual frontend URL
- [ ] Add backend URL to Vercel environment variables
- [ ] Ensure Firebase credentials are secure (use environment variables)
- [ ] Test authentication flow end-to-end
- [ ] Enable HTTPS for production backend
- [ ] Set up rate limiting (optional)

---

## 📊 Monitoring

### **Backend Health Check:**
```bash
curl https://your-backend-url.com/
```

### **Vercel Logs:**
```bash
vercel logs
```

### **Render/Railway Logs:**
Available in their respective dashboards.

---

## 🎯 Quick Deployment Commands

### **Deploy Backend to Vercel:**
```bash
cd c:\AHS 2026\backend
vercel --prod
```

### **Update Frontend Env Var:**
```bash
# In Vercel dashboard or:
vercel env add VITE_API_BASE_URL production
# Enter: https://your-backend-url.vercel.app
```

### **Redeploy Frontend:**
```bash
cd c:\AHS 2026\ai-onboarding-engineer
git push  # Auto-deploys on Vercel
```

---

## 🐛 Troubleshooting

### **CORS Errors:**
- Ensure backend CORS includes your frontend URL
- Check browser console for exact error
- Verify `allow_credentials=True` in backend

### **404 Not Found:**
- Verify backend is deployed and running
- Check `VITE_API_BASE_URL` is set correctly
- Test backend endpoint directly in browser

### **Authentication Issues:**
- Ensure Firebase tokens are being sent
- Check backend token validation
- Verify user is logged in before API calls

---

## 📚 API Documentation

Once deployed, visit:
- **Swagger UI**: `https://your-backend-url.com/docs`
- **ReDoc**: `https://your-backend-url.com/redoc`

---

## 🎉 Next Steps

1. **Deploy Backend** using one of the options above
2. **Get Backend URL** from deployment platform
3. **Update CORS** in `backend/app/main.py`
4. **Add Environment Variable** in Vercel frontend
5. **Test Connection** from frontend
6. **Monitor** logs and errors

---

**Need Help?** Check the API documentation at your backend URL `/docs` endpoint.
