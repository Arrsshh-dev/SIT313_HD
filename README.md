# DEV@Deakin — Task D2 Browse Posts

## Features implemented
- Backend-only Firestore post creation and retrieval.
- Firebase ID-token verification on authenticated post creation and optional authenticated browsing.
- Server-side subscription lookup: visitors and Free users receive only `plan=free`; Paid users receive Free and Paid posts.
- Server-side validation, post author ID and server-generated creation timestamp.
- Browse Posts page with type, plan, tag and date filters; local hide; reset; and expandable post content.
- Paid-only post creation is blocked by the backend for Free accounts.

## Run locally
1. Install frontend dependencies from the project root: `npm install`.
2. Install backend dependencies: `cd backend && npm install`.
3. In `backend`, create `.env` from `.env.example`. Configure `FIREBASE_SERVICE_ACCOUNT` with the Firebase Admin service-account JSON for the same Firebase project. Keep this secret out of Git.
4. In the project root, create `.env` from `.env.example`. Set `VITE_API_URL=http://localhost:3000`.
5. Start the API in `backend`: `npm run dev`.
6. Start the Vite app in another terminal from the root: `npm run dev`.

The backend service account needs Firestore access to the `users` and `posts` collections. Firebase Authentication must be enabled and user documents should be stored at `users/{uid}` with `subscription: "free"` or `"paid"`.

## API
- `POST /posts` — requires `Authorization: Bearer <Firebase ID token>`. Server validates all fields and writes the post, authenticated UID and server timestamp.
- `GET /posts` — public requests return Free posts only. Valid authenticated Free requests return Free posts. Paid requests return both plans. Optional query parameters: `type`, `plan`, `tag`, `from`, `to`.

## Important deployment notes
- Set `FIREBASE_SERVICE_ACCOUNT` as a backend deployment secret/environment variable, not a frontend variable.
- Set `VITE_API_URL` to the deployed backend URL when building the frontend.
- Update the CORS allow-list in `backend/server.js` for your deployed frontend origin.
- The payment form in the inherited project is a demonstration only; it does not process real payments. For production, subscription changes must be performed by a trusted payment webhook/backend, not by trusting a client-side Firestore update.
- The original archive contained a local `.env`; it is intentionally excluded from this Task D2 archive. Review your credentials and rotate any secrets that may have been exposed.
- Do not commit `node_modules`, `.env`, service-account JSON files, or other secrets.
