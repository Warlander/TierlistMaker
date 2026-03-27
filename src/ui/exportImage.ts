import { AppState, TierRow, TierItem } from '../types.js';
import { CARD_W, CARD_H } from '../constants.js';

const CANVAS_W = 1200;
const PADDING = 12;
const LABEL_W = CARD_W;
const TIER_GAP = 2;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

async function renderTierlistToCanvas(tiers: TierRow[]): Promise<HTMLCanvasElement> {
  const itemsAreaW = CANVAS_W - 2 * PADDING - LABEL_W;
  const itemsPerRow = Math.max(1, Math.floor(itemsAreaW / CARD_W));

  // Pre-load all images
  const imageCache = new Map<string, HTMLImageElement>();
  const imageItems = tiers.flatMap(t => t.items).filter(item => item.imageDataUrl);
  await Promise.all(imageItems.map(async item => {
    if (item.imageDataUrl && !imageCache.has(item.imageDataUrl)) {
      try {
        imageCache.set(item.imageDataUrl, await loadImage(item.imageDataUrl));
      } catch {
        // Skip failed images
      }
    }
  }));

  // Calculate layout
  const tierHeights = tiers.map(tier =>
    Math.max(1, Math.ceil(tier.items.length / itemsPerRow)) * CARD_H
  );
  const totalTierHeight = tierHeights.reduce((a, b) => a + b, 0);
  const gaps = tiers.length > 1 ? (tiers.length - 1) * TIER_GAP : 0;
  const canvasH = PADDING * 2 + totalTierHeight + gaps;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, CANVAS_W, canvasH);

  let y = PADDING;
  tiers.forEach((tier, ti) => {
    const tierH = tierHeights[ti];
    const lx = PADDING;
    const itemsX = lx + LABEL_W;

    // Label box
    ctx.fillStyle = tier.color;
    ctx.fillRect(lx, y, LABEL_W, tierH);

    // Label text
    ctx.fillStyle = '#111';
    ctx.font = `bold 26px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tier.label, lx + LABEL_W / 2, y + tierH / 2, LABEL_W - 8);

    // Items area background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(itemsX, y, itemsAreaW, tierH);

    // Draw items
    tier.items.forEach((item, idx) => {
      const row = Math.floor(idx / itemsPerRow);
      const col = idx % itemsPerRow;
      const ix = itemsX + col * CARD_W;
      const iy = y + row * CARD_H;
      drawItem(ctx, item, ix, iy, imageCache);
    });

    y += tierH;
    if (ti < tiers.length - 1) y += TIER_GAP;
  });

  return canvas;
}

function drawItem(
  ctx: CanvasRenderingContext2D,
  item: TierItem,
  x: number,
  y: number,
  imageCache: Map<string, HTMLImageElement>,
): void {
  ctx.fillStyle = '#3d3d3d';
  ctx.fillRect(x, y, CARD_W, CARD_H);

  if (item.type === 'image' && item.imageDataUrl) {
    const img = imageCache.get(item.imageDataUrl);
    if (img) {
      const panX = item.imagePanX ?? 0;
      const panY = item.imagePanY ?? 0;
      const zoom = item.imageZoom ?? 1;
      const coverScale = Math.max(CARD_W / img.naturalWidth, CARD_H / img.naturalHeight);
      const displayW = img.naturalWidth * coverScale * zoom;
      const displayH = img.naturalHeight * coverScale * zoom;
      const bx = (CARD_W - displayW) / 2 + panX * CARD_W;
      const by = (CARD_H - displayH) / 2 + panY * CARD_H;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, CARD_W, CARD_H);
      ctx.clip();
      ctx.drawImage(img, x + bx, y + by, displayW, displayH);
      ctx.restore();

      if (item.name) {
        const labelH = 16;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(x, y + CARD_H - labelH, CARD_W, labelH);
        ctx.fillStyle = '#fff';
        ctx.font = '9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.name, x + CARD_W / 2, y + CARD_H - labelH / 2, CARD_W - 4);
      }
    }
  } else {
    ctx.fillStyle = '#f0f0f0';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.name, x + CARD_W / 2, y + CARD_H / 2, CARD_W - 8);
  }

  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, CARD_W - 1, CARD_H - 1);
}

export function showExportModal(state: AppState): void {
  const backdrop = document.createElement('div');
  backdrop.className = 'export-modal-backdrop';

  const dialog = document.createElement('div');
  dialog.className = 'export-modal-dialog';
  backdrop.appendChild(dialog);

  const title = document.createElement('h2');
  title.className = 'export-modal-title';
  title.textContent = 'Export as Image';
  dialog.appendChild(title);

  const imgContainer = document.createElement('div');
  imgContainer.className = 'export-modal-img-container';

  const loadingMsg = document.createElement('p');
  loadingMsg.className = 'export-modal-loading';
  loadingMsg.textContent = 'Rendering\u2026';
  imgContainer.appendChild(loadingMsg);
  dialog.appendChild(imgContainer);

  const btnRow = document.createElement('div');
  btnRow.className = 'export-modal-buttons';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'export-modal-btn-save';
  saveBtn.textContent = 'Save as PNG';
  saveBtn.disabled = true;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'export-modal-btn-close';
  closeBtn.textContent = 'Close';

  btnRow.appendChild(saveBtn);
  btnRow.appendChild(closeBtn);
  dialog.appendChild(btnRow);

  document.body.appendChild(backdrop);

  function close(): void {
    backdrop.remove();
    document.removeEventListener('keydown', onKeyDown);
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKeyDown);

  closeBtn.addEventListener('click', close);

  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) close();
  });

  renderTierlistToCanvas(state.tiers).then(canvas => {
    const dataUrl = canvas.toDataURL('image/png');

    loadingMsg.remove();

    const img = document.createElement('img');
    img.src = dataUrl;
    img.className = 'export-modal-img';
    img.alt = 'Tierlist export';
    imgContainer.appendChild(img);

    saveBtn.disabled = false;
    saveBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'tierlist.png';
      a.click();
    });
  }).catch(err => {
    loadingMsg.textContent = `Failed to render: ${(err as Error).message}`;
  });
}
