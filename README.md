# ISP Network Log System

A network operations log system for ISP/NOC teams — track router configs, fiber
troubleshooting, OLT provisioning and more. Built with React + Vite and Firebase.

## Architecture

This is a **client-only SPA**. The React app runs entirely in the browser and talks
**directly** to Firebase (Firestore + Auth). There is no separate Node server — the
"backend" is Firebase, plus the security rules that run on Firebase's side.

```
isp-network-log-system/
├── frontend/            # React + Vite app (the UI + Firebase client calls)
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── services/    # data layer — all Firestore/Auth calls live here
│   │   ├── firebase/    # Firebase SDK initialization
│   │   ├── data/        # static option lists
│   │   └── utils/
│   ├── .env             # Firebase web config (gitignored)
│   └── package.json
│
└── firebase/            # backend config (runs on Firebase, not in the app)
    ├── firestore.rules          # role-based access control
    ├── firestore.indexes.json
    ├── firebase.json
    └── .firebaserc              # default project id
```

## Run the frontend locally

```bash
cd frontend
npm install
npm run dev
```

The app reads Firebase config from `frontend/.env` (see `frontend/.env.example`).

## Deploy

### Frontend → Vercel (free static hosting)

1. Import the repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add the `VITE_FIREBASE_*` environment variables (from `frontend/.env`) in the
   Vercel project settings.
4. Add your Vercel domain under Firebase Console → Authentication → Settings →
   **Authorized domains** so Google sign-in works in production.

Build command (`npm run build`) and output (`dist`) are auto-detected once the root
directory is set.

### Backend → Firebase (security rules)

The access rules are enforced by Firebase, deployed with the Firebase CLI:

```bash
cd firebase
firebase deploy --only firestore:rules
```

> Before first deploy, open `firebase/firestore.rules` and set `seedAdminEmail()` to
> your own email — that account bootstraps itself as the first Admin.

## Access levels

Roles live on each `teamMembers` record and are enforced by Firestore rules:

| Level    | Capabilities                                              |
| -------- | -------------------------------------------------------- |
| Admin    | Everything — manage users, devices, activity types, logs |
| Engineer | Read all; create/edit/delete logs                        |
| Viewer   | Read-only                                                |
