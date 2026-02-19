# 🟩 Pinboard — Digital Canvas

[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge&logo=github)](https://alfredang.github.io/pinboard/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

A Padlet-inspired digital canvas web app for whiteboards, lessons, and collaborative activities. Built with pure HTML, CSS, and JavaScript — zero dependencies, zero build tools.

---

## ✨ Features

- **Multiple Boards** — Create, name, and manage unlimited boards
- **Drag & Drop Posts** — Freely move sticky notes around the canvas
- **3 Layout Modes** — Free (drag anywhere), Grid, and List
- **Colorful Sticky Notes** — 7 pastel color options per post
- **Board Backgrounds** — 7 background options including dot and grid patterns
- **Persistent Storage** — Everything saved to local storage, survives refreshes
- **Touch Support** — Works on mobile and tablet
- **Board Preview Cards** — See mini-previews of all your boards at a glance
- **Edit & Delete** — Update or remove any post at any time

---

## 🕹️ How to Use

1. **Create a board** — Click "Make a board" or "+ New Board"
2. **Choose a layout** — Free (drag anywhere), Grid, or List
3. **Add posts** — Click "+ Add Post", write content, pick a color
4. **Move posts** — Drag them anywhere on the canvas (Free layout)
5. **Edit posts** — Hover over a post and click ✏️ Edit
6. **Change background** — Click 🎨 in the toolbar

---

## 📁 File Structure

```
padlet-clone/
├── index.html                  # App shell and modals
├── css/
│   └── style.css               # All UI styles, animations, responsive design
├── js/
│   ├── storage.js              # LocalStorage CRUD helpers
│   ├── board.js                # Board creation, rendering, management
│   ├── post.js                 # Post creation, drag-and-drop, rendering
│   └── app.js                  # Main app controller, event bindings
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions → GitHub Pages CI/CD
├── README.md
└── LICENSE
```

---

## 🚀 Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic app shell, modals, toolbar |
| **CSS3** | Grid layouts, animations, responsive design |
| **JavaScript (ES6+)** | Drag & drop, localStorage, dynamic rendering |
| **GitHub Actions** | Automated deployment to GitHub Pages |
| **GitHub Pages** | Free static hosting |

**Zero dependencies. No frameworks. No build step.**

---

## 🛠️ Local Development

```bash
git clone https://github.com/alfredang/padlet-clone.git
cd padlet-clone
open index.html  # or python3 -m http.server 8080
```

---

## 🤖 Acknowledgements

Built with **[OpenClaw](https://openclaw.ai)** — an AI-powered personal agent platform.

- 🌐 [openclaw.ai](https://openclaw.ai)
- 📖 [Docs](https://docs.openclaw.ai)
- 💬 [Discord](https://discord.com/invite/clawd)

---

## 📄 License

MIT
