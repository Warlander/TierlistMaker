import { TierItem } from '../types.js';
import { PREVIEW_W, PREVIEW_H } from '../constants.js';

export function showImageAdjust(
  item: TierItem,
  onConfirm: (panX: number, panY: number, zoom: number) => void,
): void {
  let panX = item.imagePanX ?? 0;
  let panY = item.imagePanY ?? 0;
  let zoom = item.imageZoom ?? 1;

  let naturalW = 0;
  let naturalH = 0;
  let coverScale = 1;

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'image-adjust-backdrop';

  // Dialog
  const dialog = document.createElement('div');
  dialog.className = 'image-adjust-dialog';
  backdrop.appendChild(dialog);

  // Preview container — background-image renders the image here
  const preview = document.createElement('div');
  preview.className = 'image-adjust-preview';
  preview.style.backgroundImage = `url(${item.imageDataUrl})`;
  preview.style.backgroundRepeat = 'no-repeat';
  dialog.appendChild(preview);

  // Zoom row
  const zoomRow = document.createElement('div');
  zoomRow.className = 'image-adjust-zoom';

  const zoomLabel = document.createElement('label');
  zoomLabel.textContent = 'Zoom';
  zoomRow.appendChild(zoomLabel);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '1';
  slider.max = '5';
  slider.step = '0.01';
  slider.value = String(zoom);
  zoomRow.appendChild(slider);

  dialog.appendChild(zoomRow);

  // Confirm / Cancel buttons
  const btnRow = document.createElement('div');
  btnRow.className = 'image-adjust-buttons';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'image-adjust-btn-cancel';
  cancelBtn.textContent = 'Cancel';

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'image-adjust-btn-confirm';
  confirmBtn.textContent = 'Confirm';

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(confirmBtn);
  dialog.appendChild(btnRow);

  document.body.appendChild(backdrop);

  // Pan limits (fractional): how far the center can shift before the image edge shows
  function getMaxPanX(): number {
    return Math.max(0, (naturalW * coverScale * zoom - PREVIEW_W) / (2 * PREVIEW_W));
  }
  function getMaxPanY(): number {
    return Math.max(0, (naturalH * coverScale * zoom - PREVIEW_H) / (2 * PREVIEW_H));
  }

  function clampPan(): void {
    panX = Math.max(-getMaxPanX(), Math.min(getMaxPanX(), panX));
    panY = Math.max(-getMaxPanY(), Math.min(getMaxPanY(), panY));
  }

  function applyTransform(): void {
    if (!naturalW || !naturalH) return;
    const displayW = naturalW * coverScale * zoom;
    const displayH = naturalH * coverScale * zoom;
    // background-position: center the image, then shift by pan (in pixels)
    const bx = (PREVIEW_W - displayW) / 2 + panX * PREVIEW_W;
    const by = (PREVIEW_H - displayH) / 2 + panY * PREVIEW_H;
    preview.style.backgroundSize = `${displayW}px ${displayH}px`;
    preview.style.backgroundPosition = `${bx}px ${by}px`;
  }

  const probe = new Image();
  function initDimensions(): void {
    naturalW = probe.naturalWidth;
    naturalH = probe.naturalHeight;
    if (!naturalW || !naturalH) return;
    coverScale = Math.max(PREVIEW_W / naturalW, PREVIEW_H / naturalH);
    const maxZoom = Math.max(1, Math.max(naturalW / PREVIEW_W, naturalH / PREVIEW_H));
    slider.max = String(maxZoom);
    zoom = Math.max(1, Math.min(maxZoom, zoom));
    slider.value = String(zoom);
    clampPan();
    applyTransform();
  }
  probe.onload = initDimensions;
  probe.src = item.imageDataUrl!;
  if (probe.complete && probe.naturalWidth > 0) { probe.onload = null; initDimensions(); }

  // Drag-to-pan
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panStartX = 0;
  let panStartY = 0;

  preview.addEventListener('mousedown', (e) => {
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panStartX = panX;
    panStartY = panY;
    preview.classList.add('dragging');
    e.preventDefault();
  });

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    panX = panStartX + (e.clientX - dragStartX) / PREVIEW_W;
    panY = panStartY + (e.clientY - dragStartY) / PREVIEW_H;
    clampPan();
    applyTransform();
  };

  const onMouseUp = () => {
    dragging = false;
    preview.classList.remove('dragging');
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  slider.addEventListener('input', () => {
    zoom = parseFloat(slider.value);
    clampPan();
    applyTransform();
  });

  function close(): void {
    backdrop.remove();
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('keydown', onKeyDown);
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKeyDown);

  cancelBtn.addEventListener('click', close);
  confirmBtn.addEventListener('click', () => { close(); onConfirm(panX, panY, zoom); });

  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) close();
  });
}
