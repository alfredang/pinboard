/**
 * sync.js — Lightweight board sharing via URL-encoded data
 * No external services required — board data is embedded in the share link.
 */

const Sync = {
  currentRoomCode: null,
  currentNickname: 'Guest',
  isHost: false,

  async init() { return true; },

  // ── Encode board into a shareable URL fragment ───────
  encodeBoard(board) {
    const minimal = {
      n: board.name,
      bg: board.background,
      l: board.layout,
      p: (board.posts || []).map(p => ({
        t: p.title,
        c: p.content,
        co: p.color,
        x: Math.round(p.x),
        y: Math.round(p.y),
        a: p.author
      }))
    };
    const json = JSON.stringify(minimal);
    // Use base64url encoding
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },

  // ── Decode board from URL fragment ──────────────────
  decodeBoard(encoded) {
    try {
      // Restore standard base64
      let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const json = decodeURIComponent(escape(atob(b64)));
      const d = JSON.parse(json);
      return {
        id: Storage.uid(),
        name: d.n || 'Shared Board',
        background: d.bg || '#f5f5f5',
        layout: d.l || 'free',
        posts: (d.p || []).map(p => ({
          id: Storage.uid(),
          title: p.t || '',
          content: p.c || '',
          color: p.co || '#fff9c4',
          x: p.x || 0,
          y: p.y || 0,
          author: p.a || 'Unknown',
          createdAt: Date.now()
        })),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    } catch (e) {
      console.error('[Sync] Failed to decode board:', e);
      return null;
    }
  },

  // ── Generate share URL ─────────────────────────────
  getShareUrl(board) {
    const encoded = this.encodeBoard(board);
    return `${window.location.origin}${window.location.pathname}?board=${encoded}`;
  },

  // Stubs for compatibility
  async leaveRoom() {
    this.currentRoomCode = null;
    this.isHost = false;
  },
  async pushUpdate() {},
  onUpdate() {},
  onPresence() {}
};
