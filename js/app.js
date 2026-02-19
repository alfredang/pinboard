/**
 * app.js — Main application controller for Pinboard
 */

const App = {
  selectedLayout: 'free',
  qrInstance: null,
  nicknameKey: 'pinboard_nickname',

  async init() {
    await Sync.init();
    this._bindNav();
    this._bindHome();
    this._bindBoardScreen();
    this._bindPostModal();
    this._bindNewBoardModal();
    this._bindColorSwatches();
    this._bindBgPicker();
    this._bindShareModal();
    this._bindJoinModal();
    this._bindSyncCallbacks();

    // Auto-join via URL param: ?room=123456
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode) {
      const savedNickname = this._getSavedNickname();
      if (savedNickname) {
        setTimeout(() => this.joinRoomByCode(roomCode, savedNickname), 300);
      } else {
        this.showHome();
        this.openJoinModal(roomCode);
      }
    } else {
      this.showHome();
    }
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
    if (board.layout !== 'free') canvas.classList.add(`layout-${board.layout}`);

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
    document.getElementById('heroJoin').onclick = () => this.openJoinModal();
    document.getElementById('heroExplore') && (document.getElementById('heroExplore').onclick = () => {
      document.getElementById('boardsGrid').scrollIntoView({ behavior: 'smooth' });
    });
  },

  // ── Navbar ──────────────────────────────────────────

  _bindNav() {
    document.querySelector('.nav-brand').onclick = () => this.showHome();
    document.getElementById('btnMyBoards').onclick = () => this.showHome();
    document.getElementById('btnNewBoard').onclick = () => this.openNewBoardModal();
    document.getElementById('btnJoinBoard').onclick = () => this.openJoinModal();
  },

  // ── Board Screen ─────────────────────────────────────

  _bindBoardScreen() {
    document.getElementById('btnBack').onclick = async () => {
      await Sync.leaveRoom();
      document.getElementById('syncBanner').style.display = 'none';
      document.getElementById('collabBadge').style.display = 'none';
      BoardManager.saveCurrentBoard();
      this.showHome();
    };

    document.getElementById('btnAddPost').onclick = () => this.openNewPost();

    document.getElementById('boardTitle').addEventListener('blur', (e) => {
      const title = e.target.textContent.trim() || 'Untitled Board';
      BoardManager.updateTitle(title);
      if (Sync.currentRoomCode) Sync.pushUpdate(BoardManager.currentBoard);
    });

    document.getElementById('boardTitle').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    });

    document.getElementById('btnLeaveRoom').onclick = async () => {
      await Sync.leaveRoom();
      document.getElementById('syncBanner').style.display = 'none';
      document.getElementById('collabBadge').style.display = 'none';
    };
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
        if (Sync.currentRoomCode) Sync.pushUpdate(BoardManager.currentBoard);
      };
    });
  },

  // ── Share Modal ───────────────────────────────────────

  _bindShareModal() {
    document.getElementById('btnShare').onclick = () => this.openShareModal();
    document.getElementById('closeShare').onclick = () => {
      document.getElementById('shareModal').style.display = 'none';
    };
    document.getElementById('shareModal').onclick = (e) => {
      if (e.target === document.getElementById('shareModal'))
        document.getElementById('shareModal').style.display = 'none';
    };

    document.getElementById('btnCreateRoom').onclick = async () => {
      if (!SYNC_ENABLED) {
        document.getElementById('syncNote').style.display = 'block';
        return;
      }
      const board = BoardManager.currentBoard;
      if (!board) return;

      document.getElementById('btnCreateRoom').textContent = 'Creating room…';
      document.getElementById('btnCreateRoom').disabled = true;

      const code = await Sync.createRoom(board);
      if (!code) return;

      this._showShareActive(code);
    };

    document.getElementById('btnCopyLink').onclick = () => {
      const link = document.getElementById('shareLink');
      link.select();
      document.execCommand('copy');
      document.getElementById('btnCopyLink').textContent = '✓ Copied!';
      setTimeout(() => document.getElementById('btnCopyLink').textContent = 'Copy', 2000);
    };
  },

  openShareModal() {
    document.getElementById('shareSetup').style.display = 'block';
    document.getElementById('shareActive').style.display = 'none';
    document.getElementById('btnCreateRoom').textContent = 'Generate Join Code';
    document.getElementById('btnCreateRoom').disabled = false;
    document.getElementById('syncNote').style.display = 'none';

    // If already hosting a room
    if (Sync.currentRoomCode && Sync.isHost) {
      this._showShareActive(Sync.currentRoomCode);
    }

    document.getElementById('shareModal').style.display = 'flex';
  },

  _showShareActive(code) {
    document.getElementById('shareSetup').style.display = 'none';
    document.getElementById('shareActive').style.display = 'block';
    document.getElementById('roomCodeDisplay').textContent = code;

    const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
    document.getElementById('shareLink').value = url;

    // Generate QR code
    const qrEl = document.getElementById('qrcode');
    qrEl.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrEl, {
        text: url,
        width: 150,
        height: 150,
        colorDark: '#212121',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    // Show collab badge on board
    document.getElementById('collabBadge').style.display = 'flex';
  },

  // ── Join Modal ────────────────────────────────────────

  _bindJoinModal() {
    document.getElementById('cancelJoin').onclick = () => {
      document.getElementById('joinModal').style.display = 'none';
    };
    document.getElementById('joinModal').onclick = (e) => {
      if (e.target === document.getElementById('joinModal'))
        document.getElementById('joinModal').style.display = 'none';
    };

    document.getElementById('confirmJoin').onclick = async () => {
      const nickname = document.getElementById('joinNickname').value.trim();
      const code = document.getElementById('joinCode').value.trim();
      const btn = document.getElementById('confirmJoin');
      btn.textContent = 'Joining…';
      btn.disabled = true;
      if (nickname.length < 2) {
        this._showJoinError('Please enter a nickname (at least 2 characters).');
        btn.textContent = 'Join Board';
        btn.disabled = false;
        return;
      }
      if (code.length !== 6) {
        this._showJoinError('Please enter a valid 6-digit room code.');
        btn.textContent = 'Join Board';
        btn.disabled = false;
        return;
      }
      await this.joinRoomByCode(code, nickname);
      btn.textContent = 'Join Board';
      btn.disabled = false;
    };

    document.getElementById('joinCode').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('confirmJoin').click();
    });
    document.getElementById('joinNickname').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('confirmJoin').click();
    });

    // Auto-format: only digits
    document.getElementById('joinCode').addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });
    document.getElementById('joinNickname').addEventListener('input', (e) => {
      e.target.value = e.target.value.slice(0, 24);
      if (e.target.value.trim().length >= 2) this._hideJoinError();
    });
  },

  openJoinModal(prefillCode = '') {
    document.getElementById('joinNickname').value = this._getSavedNickname();
    document.getElementById('joinCode').value = prefillCode;
    this._hideJoinError();
    document.getElementById('joinModal').style.display = 'flex';
    const target = document.getElementById('joinNickname').value.trim().length >= 2
      ? document.getElementById('joinCode')
      : document.getElementById('joinNickname');
    setTimeout(() => target.focus(), 100);
  },

  async joinRoomByCode(code, nickname = '') {
    if (!SYNC_ENABLED || !Sync.db) {
      const ok = await Sync.init();
      if (!ok || !Sync.db) {
        alert('Firebase not connected. Check console for errors.');
        return;
      }
    }
    const cleanNickname = nickname.trim().slice(0, 24);
    if (cleanNickname.length < 2) {
      this.openJoinModal(code);
      this._showJoinError('Please enter a nickname (at least 2 characters).');
      return;
    }

    document.getElementById('joinModal').style.display = 'none';
    this._hideJoinError();

    const boardData = await Sync.joinRoom(code, cleanNickname);
    if (!boardData) {
      document.getElementById('joinModal').style.display = 'flex';
      this._showJoinError('Room not found. Check the code and try again.');
      return;
    }
    localStorage.setItem(this.nicknameKey, cleanNickname);

    // Load the shared board
    const board = { ...boardData, id: boardData.id || Storage.uid() };
    delete board._lastEditBy;
    BoardManager.currentBoard = board;
    this.showBoard(board);

    // Show live banner
    document.getElementById('syncBanner').style.display = 'flex';
    document.getElementById('collabBadge').style.display = 'flex';

    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
  },

  _showJoinError(message) {
    const el = document.getElementById('joinError');
    el.textContent = `❌ ${message}`;
    el.style.display = 'block';
  },

  _hideJoinError() {
    document.getElementById('joinError').style.display = 'none';
  },

  _getSavedNickname() {
    return (localStorage.getItem(this.nicknameKey) || '').trim().slice(0, 24);
  },

  _getPostAuthorNickname() {
    const localNickname = this._getSavedNickname();
    if (localNickname) return localNickname;
    const syncNickname = String(Sync.currentNickname || '').trim().slice(0, 24);
    return syncNickname || 'Host';
  },

  // ── Sync Callbacks ────────────────────────────────────

  _bindSyncCallbacks() {
    Sync.onUpdate((boardData) => {
      if (!BoardManager.currentBoard) return;
      // Merge remote board into current
      const board = BoardManager.currentBoard;
      board.posts = boardData.posts || [];
      board.background = boardData.background || board.background;
      board.name = boardData.name || board.name;
      document.getElementById('boardTitle').textContent = board.name;
      this.applyBackground(board.background);
      PostManager.renderAll(board, document.getElementById('canvas'));
    });

    Sync.onPresence((count) => {
      document.getElementById('collabCount').textContent = count;
      document.getElementById('shareCollabCount').textContent = count;
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
      if (e.target === document.getElementById('newBoardModal'))
        document.getElementById('newBoardModal').style.display = 'none';
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
      if (e.target === document.getElementById('postModal'))
        document.getElementById('postModal').style.display = 'none';
    };

    document.getElementById('savePost').onclick = () => {
      const title   = document.getElementById('postTitle').value;
      const content = document.getElementById('postContent').value;
      const color   = PostManager.selectedColor;
      const board   = BoardManager.currentBoard;
      if (!board) return;

      if (PostManager.editingPostId) {
        const post = board.posts.find(p => p.id === PostManager.editingPostId);
        if (post) {
          post.title   = title.trim();
          post.content = content.trim();
          post.color   = color;
        }
      } else {
        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        const x = Math.random() * Math.max(100, rect.width - 250) + 20;
        const y = Math.random() * Math.max(100, rect.height - 200) + 20;
        const post = PostManager.createPost(
          title,
          content,
          color,
          x,
          y,
          this._getPostAuthorNickname()
        );
        board.posts.push(post);
      }

      BoardManager.saveCurrentBoard();
      PostManager.renderAll(board, document.getElementById('canvas'));
      if (Sync.currentRoomCode) Sync.pushUpdate(board);
      document.getElementById('postModal').style.display = 'none';
    };

    document.getElementById('deletePost').onclick = () => {
      const board = BoardManager.currentBoard;
      if (!board || !PostManager.editingPostId) return;
      if (!confirm('Delete this post?')) return;
      board.posts = board.posts.filter(p => p.id !== PostManager.editingPostId);
      BoardManager.saveCurrentBoard();
      PostManager.renderAll(board, document.getElementById('canvas'));
      if (Sync.currentRoomCode) Sync.pushUpdate(board);
      document.getElementById('postModal').style.display = 'none';
    };
  }
};

// Start
document.addEventListener('DOMContentLoaded', () => App.init());
