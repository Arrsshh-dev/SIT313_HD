# Production Deployment Guide — Netlify & Render

This guide explains how to deploy both halves of DEV@Deakin cleanly without build failures or exposed credentials.

---

## 1. Frontend Deployment (Netlify)

### Why `firebase.jsx` MUST be in Git:
Client-side Firebase apps run in the user's browser, so Firebase configuration (like `apiKey`, `projectId`) is public by design (security is enforced by Firebase Authentication and Firestore Security Rules). If `firebase.jsx` is excluded by `.gitignore`, Netlify will fail to build with `Cannot find module './firebase'`.

### Netlify Deployment Steps:
1. Connect your GitLab repository on **Netlify**.
2. **Build settings**:
   - **Base directory**: Leave blank (root directory `/`)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. **Environment Variables** (in Netlify Site Settings → Environment variables):
   - `VITE_API_URL`: Your deployed Render backend URL (e.g., `https://devdeakin-api.onrender.com`).
4. **SPA Client Routing**:
   - The repository already includes `public/_redirects` (`/*  /index.html  200`), ensuring all deep links (`/admin`, `/browse-posts`, `/login`, etc.) work without 404 errors on refresh.

---

## 2. Backend Deployment (Render)

### Render Deployment Steps:
1. Create a **New Web Service** on [Render](https://render.com/).
2. Connect your repository and configure:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
3. **Environment Variables** (in Render Dashboard → Environment):
   - `PORT`: `3000` (or leave default, Render sets this automatically)
   - `FRONTEND_URL`: Your deployed Netlify domain (e.g., `https://devdeakin-web.netlify.app`)
   - `SENDGRID_API_KEY`: Your SendGrid API key
   - `SENDGRID_FROM_EMAIL`: Your verified SendGrid sender email
   - `FIREBASE_SERVICE_ACCOUNT`: Copy the entire content of your `backend/serviceAccountKey.json` as a single-line string.
     - *Why this works*: `server.js` now checks `process.env.FIREBASE_SERVICE_ACCOUNT` first. If present, it initializes Firebase Admin directly without needing a physical file committed to GitHub/GitLab.

---

## 3. Post-Deployment Verification
1. Add your Netlify URL (e.g. `https://devdeakin-web.netlify.app`) to **Firebase Console → Authentication → Settings → Authorized domains**.
2. Test Google Sign-In and Two-Factor Authentication on the live site.
