# ⚡ Firebase + GitHub OAuth - Quick Commands

## 🚀 Deploy in 3 Steps

### Step 1: Build
```bash
cd "c:\AHS 2026\ai-onboarding-engineer"
npm run build
```

### Step 2: Deploy
```bash
cd "c:\AHS 2026"
firebase deploy --only hosting
```

### Step 3: Configure OAuth
See detailed instructions below ↓

---

## 🔧 GitHub OAuth Setup

### Create OAuth App
1. Visit: <https://github.com/settings/developers>
2. Click: **New OAuth App**
3. Use these values:

```
Application name:        AI Onboarding Engineer
Homepage URL:            https://ahs-2026.web.app
Authorization callback:  https://ahs-2026.firebaseapp.com/__/auth/handler
```

4. Save **Client ID** and **Client Secret**

---

## 🔐 Firebase Auth Setup

### Enable GitHub Provider
1. Visit: <https://console.firebase.google.com/project/ahs-2026/authentication>
2. Click: **Sign-in method** tab
3. Enable **GitHub**
4. Paste:
   - Client ID from GitHub
   - Client Secret from GitHub
5. Save

---

## ✅ Test

Visit: `https://ahs-2026.web.app/login`  
Click: **GitHub button**  
Result: Should login successfully

---

## 🔄 Redeploy (After Changes)

```bash
cd "c:\AHS 2026\ai-onboarding-engineer" && npm run build && cd .. && firebase deploy --only hosting
```

One command - done! ✨

---

## 📚 Full Guides

- **Complete Guide**: See `COMPLETE_DEPLOYMENT_GUIDE.md`
- **Quick Deploy**: See `DEPLOY_NOW.md`
- **Detailed Firebase**: See `FIREBASE_DEPLOYMENT_GUIDE.md`

---

## 🎯 Your URLs

| Purpose | URL |
|---------|-----|
| Live Site | <https://ahs-2026.web.app> |
| Firebase Console | <https://console.firebase.google.com/project/ahs-2026> |
| GitHub OAuth | <https://github.com/settings/developers> |
| Firebase Auth | <https://console.firebase.google.com/project/ahs-2026/authentication> |

---

## 💡 Critical OAuth URLs

**Homepage**: `https://ahs-2026.web.app`  
**Callback**: `https://ahs-2026.firebaseapp.com/__/auth/handler`

**⚠️ The callback URL must be EXACTLY as shown above!**

---

## 🐛 Quick Troubleshooting

| Error | Fix |
|-------|-----|
| `auth/unauthorized-domain` | Add `ahs-2026.web.app` to Firebase authorized domains |
| `redirect_uri_mismatch` | Verify callback URL matches exactly |
| Popup blocked | Allow popups for `ahs-2026.web.app` |
| Deploy fails | Run: `firebase login` then retry |

---

**Ready to deploy? Start with Step 1 above! ⬆️**
