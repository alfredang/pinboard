# Pinboard

A digital canvas / pinboard web application.

## Project Structure

- `index.html` — Main HTML entry point
- `css/` — Stylesheets
- `js/` — JavaScript modules

## Custom Commands

### /start-app

Auto-detect project type and start the application on localhost.

**Steps:**

1. This is a static HTML project (`index.html`). Serve it with `npx serve` (port 3000) or `python3 -m http.server 8000`.
2. Kill any existing process on the target port: `lsof -ti:<port> | xargs kill -9 2>/dev/null`
3. Start the server in the background.
4. Open in browser (macOS: `open http://localhost:<port>`, Linux: `xdg-open http://localhost:<port>`).
5. Display summary with project type, command, and URL.

### /test-app

Test the web application using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing screenshots, and viewing browser logs.

**Steps:**

1. **Install Playwright if needed**: `pip install playwright && playwright install chromium` (or `npx playwright install chromium` if using the Node version).
2. **Use the helper script** at `.claude/test-app/scripts/with_server.py` to manage server lifecycle:
   ```bash
   python3 .claude/test-app/scripts/with_server.py --server "npx serve -l 3000" --port 3000 -- python3 your_test.py
   ```
3. **Write Playwright test scripts** using Python's `sync_playwright`:
   ```python
   from playwright.sync_api import sync_playwright

   with sync_playwright() as p:
       browser = p.chromium.launch(headless=True)
       page = browser.new_page()
       page.goto('http://localhost:3000')
       page.wait_for_load_state('networkidle')
       # ... test logic ...
       page.screenshot(path='/tmp/test_screenshot.png', full_page=True)
       browser.close()
   ```

**Decision tree:**
- Static HTML → Read HTML file directly to identify selectors, then write Playwright script
- Dynamic webapp, server not running → Use `.claude/test-app/scripts/with_server.py`
- Dynamic webapp, server running → Navigate, wait for `networkidle`, inspect DOM, then act

**Best practices:**
- Always `wait_for_load_state('networkidle')` before inspecting the DOM
- Always launch chromium in `headless=True` mode
- Always close the browser when done
- Use descriptive selectors: `text=`, `role=`, CSS selectors, or IDs
- See `.claude/test-app/examples/` for reference patterns (element discovery, static HTML automation, console logging)
