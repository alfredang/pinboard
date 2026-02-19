/**
 * board.js — Board management for PadClone
 */

const BoardManager = {
  currentBoard: null,

  createBoard(name = 'Untitled Board', layout = 'free') {
    return {
      id: Storage.uid(),
      name,
      layout,
      background: '#f5f5f5',
      posts: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  },

  openBoard(id) {
    const board = Storage.getBoard(id);
    if (!board) return;
    this.currentBoard = board;
    App.showBoard(board);
  },

  saveCurrentBoard() {
    if (!this.currentBoard) return;
    this.currentBoard.updatedAt = Date.now();
    Storage.saveBoard(this.currentBoard);
  },

  updateBackground(bg) {
    if (!this.currentBoard) return;
    this.currentBoard.background = bg;
    this.saveCurrentBoard();
    App.applyBackground(bg);
  },

  updateTitle(title) {
    if (!this.currentBoard) return;
    this.currentBoard.name = title;
    this.saveCurrentBoard();
  },

  renderBoardCards(container) {
    const boards = Storage.getBoards();
    container.innerHTML = '';

    // "New board" card
    const newCard = document.createElement('div');
    newCard.className = 'board-card board-card-new';
    newCard.innerHTML = '<span>+</span><small>New Board</small>';
    newCard.onclick = () => App.openNewBoardModal();
    container.appendChild(newCard);

    boards.forEach(board => {
      const card = document.createElement('div');
      card.className = 'board-card';
      const preview = this._buildPreview(board);
      const postWord = board.posts.length === 1 ? 'post' : 'posts';
      card.innerHTML = `
        <div class="board-card-preview">${preview}</div>
        <div class="board-card-info">
          <h3>${this._escape(board.name)}</h3>
          <p>${board.posts.length} ${postWord} · ${this._timeAgo(board.updatedAt)}</p>
        </div>
      `;
      card.onclick = () => BoardManager.openBoard(board.id);
      container.appendChild(card);
    });
  },

  _buildPreview(board) {
    const positions = [
      { left: '10px', top: '10px' },
      { left: '80px', top: '20px' },
      { left: '30px', top: '65px' },
      { left: '110px', top: '60px' },
    ];
    const colors = ['#fff9c4', '#f8bbd9', '#bbdefb', '#c8e6c9', '#ffe0b2'];
    return board.posts.slice(0, 4).map((post, i) => {
      const pos = positions[i] || { left: `${i * 40}px`, top: `${i * 20}px` };
      const color = post.color || colors[i % colors.length];
      return `<div class="mini-post" style="left:${pos.left};top:${pos.top};background:${color}">${this._escape((post.title || post.content || '').slice(0, 20))}</div>`;
    }).join('');
  },

  _escape(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  },

  _timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }
};
