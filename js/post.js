/**
 * post.js — Post (sticky note) management for PadClone
 */

const PostManager = {
  selectedColor: '#fff9c4',
  editingPostId: null,

  createPost(title, content, color, x, y, authorNickname = '') {
    return {
      id: Storage.uid(),
      title: title.trim(),
      content: content.trim(),
      color: color || '#fff9c4',
      authorNickname: String(authorNickname || '').trim().slice(0, 24),
      x: x ?? Math.random() * 400 + 50,
      y: y ?? Math.random() * 300 + 50,
      createdAt: Date.now()
    };
  },

  renderPost(post, canvas, layout) {
    const el = document.createElement('div');
    el.className = 'post';
    el.dataset.id = post.id;
    el.style.background = post.color;

    if (layout === 'free') {
      el.style.left = post.x + 'px';
      el.style.top  = post.y + 'px';
    }

    el.innerHTML = `
      ${post.title ? `<div class="post-title">${this._escape(post.title)}</div>` : ''}
      <div class="post-content">${this._escape(post.content)}</div>
      ${post.authorNickname ? `<div class="post-author">by ${this._escape(post.authorNickname)}</div>` : ''}
      <div class="post-actions">
        <button class="post-btn edit-btn">✏️ Edit</button>
      </div>
    `;

    el.querySelector('.edit-btn').onclick = (e) => {
      e.stopPropagation();
      App.openEditPost(post.id);
    };

    if (layout === 'free') {
      this._makeDraggable(el, post);
    }

    canvas.appendChild(el);
    return el;
  },

  renderAll(board, canvas) {
    // Remove existing posts
    canvas.querySelectorAll('.post').forEach(el => el.remove());

    // Remove empty state
    const empty = canvas.querySelector('.empty-canvas');
    if (empty) empty.remove();

    if (board.posts.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'empty-canvas';
      emptyEl.innerHTML = `
        <div class="empty-icon">📌</div>
        <p>Click "+ Add Post" to add your first post</p>
      `;
      canvas.appendChild(emptyEl);
      return;
    }

    board.posts.forEach(post => {
      this.renderPost(post, canvas, board.layout);
    });
  },

  _makeDraggable(el, post) {
    let startX, startY, origX, origY, dragging = false;

    el.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('post-btn')) return;
      dragging = true;
      el.classList.add('dragging');
      startX = e.clientX;
      startY = e.clientY;
      origX = post.x;
      origY = post.y;
      e.preventDefault();
    });

    // Touch support
    el.addEventListener('touchstart', (e) => {
      if (e.target.classList.contains('post-btn')) return;
      const t = e.touches[0];
      dragging = true;
      el.classList.add('dragging');
      startX = t.clientX;
      startY = t.clientY;
      origX = post.x;
      origY = post.y;
    }, { passive: true });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      post.x = Math.max(0, origX + dx);
      post.y = Math.max(0, origY + dy);
      el.style.left = post.x + 'px';
      el.style.top  = post.y + 'px';
    });

    document.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      post.x = Math.max(0, origX + dx);
      post.y = Math.max(0, origY + dy);
      el.style.left = post.x + 'px';
      el.style.top  = post.y + 'px';
    }, { passive: true });

    const stopDrag = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      const board = BoardManager.currentBoard;
      if (board) {
        const p = board.posts.find(p => p.id === post.id);
        if (p) { p.x = post.x; p.y = post.y; }
        BoardManager.saveCurrentBoard();
        // Sync position to collaborators
        if (Sync.currentRoomCode) Sync.pushUpdate(board);
      }
    };

    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  },

  _escape(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
};
