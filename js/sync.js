/**
 * sync.js — Real-time collaboration engine for Pinboard
 * Uses Firebase Realtime Database for live sync across devices
 */

const Sync = {
  db: null,
  roomRef: null,
  presenceRef: null,
  sessionId: null,
  currentRoomCode: null,
  isHost: false,
  onUpdateCallback: null,
  onPresenceCallback: null,

  // ── Init ──────────────────────────────────────────────

  async init() {
    if (!SYNC_ENABLED) return false;
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      this.db = firebase.database();
      this.sessionId = Storage.uid();
      console.log('[Sync] Firebase initialized, sessionId:', this.sessionId);
      return true;
    } catch (e) {
      console.warn('[Sync] Firebase init failed:', e);
      return false;
    }
  },

  // ── Host: Create a room ───────────────────────────────

  async createRoom(board) {
    if (!this.db) return null;
    const code = this._genCode();
    this.currentRoomCode = code;
    this.isHost = true;

    const roomData = {
      code,
      boardId: board.id,
      hostId: this.sessionId,
      board: this._serializeBoard(board),
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    await this.db.ref(`rooms/${code}`).set(roomData);
    this.roomRef = this.db.ref(`rooms/${code}`);
    this._listenPresence(code);
    this._listenBoardChanges(code);
    return code;
  },

  // ── Guest: Join a room ────────────────────────────────

  async joinRoom(code) {
    if (!this.db) return null;
    const snap = await this.db.ref(`rooms/${code}`).once('value');
    if (!snap.exists()) return null;

    const roomData = snap.val();
    this.currentRoomCode = code;
    this.isHost = false;
    this.roomRef = this.db.ref(`rooms/${code}`);
    this._listenPresence(code);
    this._listenBoardChanges(code);
    this._announcePresence(code);
    return roomData.board;
  },

  // ── Push board update (host & guest) ─────────────────

  async pushUpdate(board) {
    if (!this.roomRef) return;
    try {
      await this.roomRef.update({
        board: this._serializeBoard(board),
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        lastEditBy: this.sessionId
      });
    } catch (e) {
      console.warn('[Sync] Push failed:', e);
    }
  },

  // ── Listen for remote changes ─────────────────────────

  _listenBoardChanges(code) {
    this.db.ref(`rooms/${code}/board`).on('value', (snap) => {
      if (!snap.exists()) return;
      const boardData = snap.val();
      // Ignore our own updates
      if (boardData._lastEditBy === this.sessionId) return;
      if (this.onUpdateCallback) this.onUpdateCallback(boardData);
    });
  },

  // ── Presence ──────────────────────────────────────────

  _announcePresence(code) {
    if (!this.db) return;
    const myRef = this.db.ref(`rooms/${code}/presence/${this.sessionId}`);
    myRef.set({ joinedAt: firebase.database.ServerValue.TIMESTAMP, active: true });
    myRef.onDisconnect().remove();
  },

  _listenPresence(code) {
    this._announcePresence(code);
    this.db.ref(`rooms/${code}/presence`).on('value', (snap) => {
      const count = snap.exists() ? Object.keys(snap.val()).length : 1;
      if (this.onPresenceCallback) this.onPresenceCallback(count);
    });
  },

  // ── Leave room ────────────────────────────────────────

  async leaveRoom() {
    if (!this.roomRef || !this.currentRoomCode) return;
    await this.db.ref(`rooms/${this.currentRoomCode}/presence/${this.sessionId}`).remove();
    this.db.ref(`rooms/${this.currentRoomCode}/board`).off();
    this.db.ref(`rooms/${this.currentRoomCode}/presence`).off();
    this.roomRef = null;
    this.currentRoomCode = null;
    this.isHost = false;
  },

  // ── Helpers ───────────────────────────────────────────

  _genCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  _serializeBoard(board) {
    return JSON.parse(JSON.stringify({ ...board, _lastEditBy: this.sessionId }));
  },

  onUpdate(cb)   { this.onUpdateCallback = cb; },
  onPresence(cb) { this.onPresenceCallback = cb; }
};
