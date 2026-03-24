# TierlistMaker

A local, browser-based tierlist maker focused on simplicity and full offline ownership.

## Why

Existing online tierlist tools didn't meet my requirements — particularly the ability to save everything to a single file and fully restore it later, with no accounts, no cloud, and no data leaving the machine. Simplicity and ease of use were prioritized over feature bloat.

## Features

- **Image & text items** — add images from local disk or plain text entries
- **Drag and drop** — reorder items within and between tiers
- **Unranked pool** — holding area for items not yet placed
- **Single-file save/load** — exports a self-contained JSON with images embedded as base64; restores the full tierlist from that one file
- **Tier customization** — rename, recolor, reorder, add, or remove tiers

## Tech

TypeScript compiled to ES modules, runs entirely in the browser. No backend, no server-side logic, no external dependencies at runtime.

## Running Locally

```bash
npm run build
node node_modules/serve/build/main.js dist -p 3333
```

Then open `http://localhost:3333` in your browser.

## Attribution

All code is AI-written under the author's supervision.
