/**
 * config.js — Firebase configuration for Pinboard real-time collaboration
 *
 * HOW TO SET UP:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (free Spark plan works great)
 * 3. Add a Web App → copy your config values below
 * 4. In Firebase Console → Realtime Database → Create database → Start in test mode
 * 5. Push this file to GitHub and you're live!
 */

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// Set to false to disable real-time sync (local-only mode)
const SYNC_ENABLED = FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";
