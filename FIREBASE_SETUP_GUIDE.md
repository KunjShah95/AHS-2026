# Firebase Setup Guide for AHS-2026

This project requires Firebase for Authentication and Database (Firestore). Follow these steps to complete the setup.

## 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the setup wizard.
3. Once created, navigate to your project dashboard.

## 2. Enable Authentication
1. In the left sidebar, click **Build** > **Authentication**.
2. Click **Get Started**.
3. Enable **Google** and **Email/Password** sign-in providers (or whichever ones you plan to use).

## 3. Enable Firestore Database
1. In the left sidebar, click **Build** > **Firestore Database**.
2. Click **Create Database**.
3. Choose a location (e.g., `nam5` or `us-central1`).
4. Start in **Test mode** for development (allows read/write for 30 days).

## 4. Frontend Configuration
You need to update your frontend environment variables with your Firebase project details.
1. In Firebase Console, go to **Project settings** (gear icon).
2. Scroll down to **Your apps** and click the **</>** (Web) icon.
3. Register the app (e.g., "ai-onboarding-engineer").
4. Copy the `firebaseConfig` object values.
5. Open `frontend/ai-onboarding-engineer/.env` and update the values:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## 5. Backend Configuration (Service Account)
The backend requires a Service Account to verify tokens and access Firestore securely.
1. In Firebase Console, go to **Project settings** > **Service accounts**.
2. Click **Generate new private key**.
3. Save the file.
4. Rename the file to `serviceAccountKey.json`.
5. Move this file to the `backend/` directory of this project.
   - Path should be: `backend/serviceAccountKey.json`

## 6. Restart Servers
After updating the configuration:
1. Restart the frontend: `npm run dev` (in `frontend/ai-onboarding-engineer`)
2. Restart the backend: `uvicorn app.main:app --reload` (in `backend`)

## 7. Verification
- **Frontend**: Log in using the UI.
- **Backend**: The API will verify the Firebase ID token sent by the frontend.
