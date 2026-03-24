# TierlistMaker — Project Guidelines

## Overview

A local, browser-based tierlist maker. Runs entirely client-side with no server logic beyond serving static files. Users build tierlists from images (loaded from local disk) or plain text, arrange items by dragging, and save/load complete tierlists as self-contained files.

---

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Browser only — no Node.js runtime logic
- **Server**: Static file server only (e.g. `npx serve dist/` or equivalent). No API routes, no backend processing.
- **Build**: `tsc` compiles `src/` → `dist/`. The `dist/` directory is the deployment artifact.
- **Dependencies**: Keep minimal. Prefer browser-native APIs. Any UI library must be bundler-friendly or CDN-loadable without a build step beyond `tsc`.

---

## Build & Run

```bash
npm run build        # compiles TypeScript → dist/
node node_modules/serve/build/main.js dist -p 3333 --no-clipboard   # local static server (serve is a devDependency)
```

**Note:** `npx` does not resolve on this machine via Claude Code's preview tool — use `node node_modules/serve/...` directly. The `serve` package is installed as a devDependency.

The entry point is `dist/index.js` (compiled from `src/index.ts`). The main HTML file must be at `dist/index.html`.

---

## TypeScript / Browser Module Note

`tsconfig.json` uses `"module": "ES2020"` (not `commonjs`). This is required because the compiled output is loaded directly in the browser via `<script type="module">` — `require()` does not exist in browsers without a bundler.

All cross-file imports in `.ts` source files must use `.js` extensions:
```typescript
import { Foo } from './types.js';   // correct — browser resolves the compiled output
import { Foo } from './types';       // wrong — breaks at runtime in browser
```

---

## Feature Requirements

All features below must be implemented. Do not mark a feature complete until it fully satisfies its description.

### 1. Tier Management
- Default tiers on first load: **S, A, B, C, D, F** with distinct colors.
- Users can:
  - Add new tiers (appended to the list)
  - Remove existing tiers (items in removed tiers move to the unranked pool)
  - Rename tier labels inline
  - Change tier background color via a color picker
- Tier order is reorderable (drag or buttons).

### 2. Tier Items
Two types of items exist:

**Image items**
- User picks an image from local disk (via `<input type="file">` or drag-drop from OS)
- Image is rendered inside the item card (cropped/fitted to a fixed card size)
- Right-click context menu on an item exposes:
  - **Adjust image**: a popup to pan and zoom within the card bounds
  - **Rename**: change the item's display name (shown as label below or overlaid on the image)

**Text items**
- Plain text, no image
- Same rename capability via right-click

### 3. Drag and Drop
- Items can be dragged between tiers and within a tier to reorder
- Items can be dragged to/from an **unranked pool** (items not yet placed in any tier)
- Use the HTML5 Drag and Drop API or a lightweight equivalent — no heavy DnD libraries unless they add clear value

### 4. Save / Load
- **Save**: exports a single self-contained JSON file. Images are embedded as base64 data URLs. The file must fully restore the tierlist (tier names, colors, order; items with their images, names, image pan/zoom state) with no external dependencies.
- **Load**: imports a previously saved JSON file and restores full state, replacing the current session.
- File format is versioned (`"version": 1`) to allow future migrations.

### 5. Single-Page Application
- No routing. One view only.
- Any secondary UI (image adjust popup, rename dialog, color picker, load confirmation) is implemented as a **modal overlay** on top of the main view.
- Modals are dismissible via Escape key and a close button.

---

## Architecture Guidelines

```
src/
  index.ts          # Entry point — bootstraps the app
  types.ts          # Shared TypeScript interfaces/types
  state.ts          # Central app state and mutation helpers
  render.ts         # DOM rendering / UI updates
  dragAndDrop.ts    # Drag and drop logic
  serialization.ts  # Save / load (JSON ↔ app state)
  ui/
    modal.ts        # Generic modal overlay component
    contextMenu.ts  # Right-click context menu
    imageAdjust.ts  # Image pan/zoom popup
```

- Keep DOM manipulation contained to `render.ts` and `ui/` modules.
- State mutations go through `state.ts` — never mutate state directly in event handlers.
- No global variables outside of the single app state object.

---

## Out of Scope

The following are explicitly out of scope and must not be added:

- Server-side storage or APIs
- User accounts or authentication
- Cloud sync or sharing
- Undo/redo history
- Multiple simultaneous tierlists open at once
- Animated transitions (keep it functional, not flashy)