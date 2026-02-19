/**
 * config.js — Firebase configuration for Pinboard real-time collaboration
 */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBGQ_GqDfyaHsL3a4Oe1cKI297mfWobO1s",
  authDomain:        "pinboard-c06ce.firebaseapp.com",
  databaseURL:       "https://pinboard-c06ce-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "pinboard-c06ce",
  storageBucket:     "pinboard-c06ce.firebasestorage.app",
  messagingSenderId: "345215113896",
  appId:             "1:345215113896:web:576de615fd07688f5b409d"
};

// Set to false to disable real-time sync (local-only mode)
const SYNC_ENABLED = FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";
