/**
 * storage.js — Local storage helpers for PadClone
 */

const Storage = {
  _key: 'padclone_data',

  load() {
    try {
      return JSON.parse(localStorage.getItem(this._key)) || { boards: [] };
    } catch {
      return { boards: [] };
    }
  },

  save(data) {
    localStorage.setItem(this._key, JSON.stringify(data));
  },

  getBoards() {
    return this.load().boards;
  },

  getBoard(id) {
    return this.load().boards.find(b => b.id === id);
  },

  saveBoard(board) {
    const data = this.load();
    const idx = data.boards.findIndex(b => b.id === board.id);
    if (idx >= 0) data.boards[idx] = board;
    else data.boards.unshift(board);
    this.save(data);
  },

  deleteBoard(id) {
    const data = this.load();
    data.boards = data.boards.filter(b => b.id !== id);
    this.save(data);
  },

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
};
