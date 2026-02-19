/**
 * sync.js — Real-time collaboration engine for Pinboard
 * Uses Firebase Realtime Database for live sync across devices
 */

const Sync = {
  db: null,
  roomRef: null,
  sessionId: null,
  currentNickname: 'Guest',
  currentRoomCode: null,
  isHost: false,
  onUpdateCallback: null,
  onPresenceCallback: null,

  // ── Init ──────────────────────────────────────────────

  async init() {
    if (!SYNC_ENABLED) return false;
    try {
      // Guard against double-init (e.g. soft reloads)
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      this.db = firebase.database();
      this.sessionId = this.sessionId || Storage.uid();
      console.log('[Sync] Firebase ready, session:', this.sessionId);
      return true;
    } catch (e) {
      console.error('[Sync] Firebase init failed:', e);
      return false;
    }
  },

  // ── Host: Create a room ───────────────────────────────

  async createRoom(board) {
    if (!this.db) {
      console.error('[Sync] db is null — Firebase not initialized');
      return null;
    }
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

    try {
      await this.db.ref(`rooms/${code}`).set(roomData);
      this.roomRef = this.db.ref(`rooms/${code}`);
      this._listenPresence(code);
      this._listenBoardChanges(code);
      return code;
    } catch (e) {
      console.error('[Sync] createRoom failed:', e);
      return null;
    }
  },

  // ── Guest: Join a room ────────────────────────────────

  async joinRoom(code, nickname = 'Guest') {
    if (!this.db) {
      console.error('[Sync] db is null — Firebase not initialized');
      return null;
    }
    try {
      const snap = await this.db.ref(`rooms/${code}`).once('value');
      if (!snap.exists()) {
        console.warn('[Sync] Room not found:', code);
        return null;
      }
      const roomData = snap.val();
      this.currentNickname = this._sanitizeNickname(nickname);
      this.currentRoomCode = code;
      this.isHost = false;
      this.roomRef = this.db.ref(`rooms/${code}`);
      this._listenPresence(code);
      this._listenBoardChanges(code);
      return roomData.board;
    } catch (e) {
      console.error('[Sync] joinRoom failed:', e);
      return null;
    }
  },

  // ── Push board update ─────────────────────────────────

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
      if (boardData._lastEditBy === this.sessionId) return;
      if (this.onUpdateCallback) this.onUpdateCallback(boardData);
    });
  },

  // ── Presence ──────────────────────────────────────────

  _announcePresence(code) {
    if (!this.db) return;
    const myRef = this.db.ref(`rooms/${code}/presence/${this.sessionId}`);
    myRef.set({
      joinedAt: firebase.database.ServerValue.TIMESTAMP,
      active: true,
      nickname: this.currentNickname || 'Guest'
    });
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
    if (!this.db || !this.currentRoomCode) return;
    try {
      await this.db.ref(`rooms/${this.currentRoomCode}/presence/${this.sessionId}`).remove();
      this.db.ref(`rooms/${this.currentRoomCode}/board`).off();
      this.db.ref(`rooms/${this.currentRoomCode}/presence`).off();
    } catch (e) {}
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

  _sanitizeNickname(nickname) {
    const clean = String(nickname || '').trim().slice(0, 24);
    return clean || 'Guest';
  },

  onUpdate(cb)   { this.onUpdateCallback = cb; },
  onPresence(cb) { this.onPresenceCallback = cb; }
};
