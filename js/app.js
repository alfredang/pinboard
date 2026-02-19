/**
 * app.js — Main application controller for PadClone
 */

const App = {
  selectedLayout: 'free',

  init() {
    this._bindNav();
    this._bindHome();
    this._bindBoardScreen();
    this._bindPostModal();
    this._bindNewBoardModal();
    this._bindColorSwatches();
    this._bindBgPicker();
    this.showHome();
  },

  // ── Navigation ──────────────────────────────────────

  showHome() {
    document.getElementById('homeScreen').classList.add('active');
    document.getElementById('boardScreen').classList.remove('active');
    BoardManager.renderBoardCards(document.getElementById('boardsGrid'));
  },

  showBoard(board) {
    document.getElementById('homeScreen').classList.remove('active');
    document.getElementById('boardScreen').classList.add('active');
    document.getElementById('boardTitle').textContent = board.name;

    const canvas = document.getElementById('canvas');
    canvas.className = 'canvas';
    if (board.layout !== 'free') {
      canvas.classList.add(`layout-${board.layout}`);
    }

    this.applyBackground(board.background || '#f5f5f5');
    PostManager.renderAll(board, canvas);
  },

  applyBackground(bg) {
    const canvas = document.getElementById('canvas');
    if (bg === 'grid') {
      canvas.style.background = '#fff';
      canvas.classList.add('grid-bg');
    } else if (bg === 'dots') {
      canvas.style.background = "radial-gradient(circle, #bbb 1px, transparent 1px) 0 0 / 20px 20px #fff";
      canvas.classList.remove('grid-bg');
    } else {
      canvas.style.background = bg;
      canvas.classList.remove('grid-bg');
    }
  },

  // ── Home ────────────────────────────────────────────

  _bindHome() {
    document.getElementById('heroMakeBoard').onclick = () => this.openNewBoardModal();
    document.getElementById('heroExplore').onclick = () => {
      document.getElementById('boardsGrid').scrollIntoView({ behavior: 'smooth' });
    };
  },

  // ── Navbar ──────────────────────────────────────────

  _bindNav() {
    document.querySelector('.nav-brand').onclick = () => this.showHome();
    document.getElementById('btnMyBoards').onclick = () => this.showHome();
    document.getElementById('btnNewBoard').onclick = () => this.openNewBoardModal();
  },

  // ── Board Screen ─────────────────────────────────────

  _bindBoardScreen() {
    document.getElementById('btnBack').onclick = () => {
      BoardManager.saveCurrentBoard();
      this.showHome();
    };

    document.getElementById('btnAddPost').onclick = () => this.openNewPost();

    document.getElementById('boardTitle').addEventListener('blur', (e) => {
      BoardManager.updateTitle(e.target.textContent.trim() || 'Untitled Board');
    });

    document.getElementById('boardTitle').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    });
  },

  // ── Background Picker ─────────────────────────────────

  _bindBgPicker() {
    document.getElementById('btnBg').onclick = () => {
      const picker = document.getElementById('bgPicker');
      picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
    };

    document.querySelectorAll('.bg-swatch').forEach(sw => {
      sw.onclick = () => {
        document.querySelectorAll('.bg-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        BoardManager.updateBackground(sw.dataset.bg);
      };
    });
  },

  // ── New Board Modal ───────────────────────────────────

  openNewBoardModal() {
    document.getElementById('newBoardName').value = '';
    this.selectedLayout = 'free';
    document.querySelectorAll('.layout-opt').forEach(o => {
      o.classList.toggle('selected', o.dataset.layout === 'free');
    });
    document.getElementById('newBoardModal').style.display = 'flex';
    setTimeout(() => document.getElementById('newBoardName').focus(), 100);
  },

  _bindNewBoardModal() {
    document.getElementById('cancelNewBoard').onclick = () => {
      document.getElementById('newBoardModal').style.display = 'none';
    };

    document.getElementById('newBoardModal').onclick = (e) => {
      if (e.target === document.getElementById('newBoardModal')) {
        document.getElementById('newBoardModal').style.display = 'none';
      }
    };

    document.querySelectorAll('.layout-opt').forEach(opt => {
      opt.onclick = () => {
        document.querySelectorAll('.layout-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.selectedLayout = opt.dataset.layout;
      };
    });

    document.getElementById('confirmNewBoard').onclick = () => {
      const name = document.getElementById('newBoardName').value.trim() || 'Untitled Board';
      const board = BoardManager.createBoard(name, this.selectedLayout);
      Storage.saveBoard(board);
      document.getElementById('newBoardModal').style.display = 'none';
      BoardManager.openBoard(board.id);
    };

    document.getElementById('newBoardName').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('confirmNewBoard').click();
    });
  },

  // ── Post Modal ────────────────────────────────────────

  openNewPost() {
    PostManager.editingPostId = null;
    PostManager.selectedColor = '#fff9c4';
    document.getElementById('postModalTitle').textContent = 'New Post';
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('deletePost').style.display = 'none';
    this._selectColor('#fff9c4');
    document.getElementById('postModal').style.display = 'flex';
    setTimeout(() => document.getElementById('postContent').focus(), 100);
  },

  openEditPost(postId) {
    const board = BoardManager.currentBoard;
    if (!board) return;
    const post = board.posts.find(p => p.id === postId);
    if (!post) return;

    PostManager.editingPostId = postId;
    document.getElementById('postModalTitle').textContent = 'Edit Post';
    document.getElementById('postTitle').value = post.title || '';
    document.getElementById('postContent').value = post.content || '';
    document.getElementById('deletePost').style.display = 'inline-block';
    this._selectColor(post.color || '#fff9c4');
    document.getElementById('postModal').style.display = 'flex';
    setTimeout(() => document.getElementById('postContent').focus(), 100);
  },

  _selectColor(color) {
    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.classList.toggle('selected', sw.dataset.color === color);
    });
    PostManager.selectedColor = color;
  },

  _bindColorSwatches() {
    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.onclick = () => this._selectColor(sw.dataset.color);
    });
  },

  _bindPostModal() {
    document.getElementById('cancelPost').onclick = () => {
      document.getElementById('postModal').style.display = 'none';
    };

    document.getElementById('postModal').onclick = (e) => {
      if (e.target === document.getElementById('postModal')) {
        document.getElementById('postModal').style.display = 'none';
      }
    };

    document.getElementById('savePost').onclick = () => {
      const title   = document.getElementById('postTitle').value;
      const content = document.getElementById('postContent').value;
      const color   = PostManager.selectedColor;
      const board   = BoardManager.currentBoard;
      if (!board) return;

      if (PostManager.editingPostId) {
        // Edit existing
        const post = board.posts.find(p => p.id === PostManager.editingPostId);
        if (post) {
          post.title   = title.trim();
          post.content = content.trim();
          post.color   = color;
          BoardManager.saveCurrentBoard();
          PostManager.renderAll(board, document.getElementById('canvas'));
        }
      } else {
        // New post
        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        const x = Math.random() * Math.max(100, rect.width - 250) + 20;
        const y = Math.random() * Math.max(100, rect.height - 200) + 20;
        const post = PostManager.createPost(title, content, color, x, y);
        board.posts.push(post);
        BoardManager.saveCurrentBoard();
        PostManager.renderAll(board, canvas);
      }

      document.getElementById('postModal').style.display = 'none';
    };

    document.getElementById('deletePost').onclick = () => {
      const board = BoardManager.currentBoard;
      if (!board || !PostManager.editingPostId) return;
      if (!confirm('Delete this post?')) return;
      board.posts = board.posts.filter(p => p.id !== PostManager.editingPostId);
      BoardManager.saveCurrentBoard();
      PostManager.renderAll(board, document.getElementById('canvas'));
      document.getElementById('postModal').style.display = 'none';
    };
  }
};

// Start
document.addEventListener('DOMContentLoaded', () => App.init());
