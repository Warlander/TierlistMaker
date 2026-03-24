import { getState, moveItemToTier, moveItemToUnranked, moveItemToTierAtIndex, moveItemToUnrankedAtIndex } from './state.js';
import { renderApp } from './render.js';

let initialized = false;
let draggedItemId: string | null = null;
let currentDropZone: Element | null = null;
let currentInsertIndex: number = -1;

export function initDragAndDrop(): void {
  if (initialized) return;
  initialized = true;

  document.addEventListener('dragstart', (e) => {
    const card = (e.target as Element).closest('.tier-item') as HTMLElement | null;
    if (!card) return;
    const itemId = card.dataset.itemId;
    if (!itemId) return;
    draggedItemId = itemId;
    e.dataTransfer!.setData('text/plain', itemId);
    e.dataTransfer!.effectAllowed = 'move';
  });

  document.addEventListener('dragover', (e) => {
    const zone = dropZoneOf(e.target as Element);
    if (!zone) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    zone.classList.add('drag-over');

    const index = computeInsertionIndex(zone, e.clientX, e.clientY);
    if (zone !== currentDropZone || index !== currentInsertIndex) {
      currentDropZone = zone;
      currentInsertIndex = index;
      showDropIndicator(zone, index);
    }
  });

  document.addEventListener('dragleave', (e) => {
    const zone = dropZoneOf(e.target as Element);
    if (!zone) return;
    if (!zone.contains(e.relatedTarget as Node | null)) {
      zone.classList.remove('drag-over');
      removeDropIndicator();
      currentDropZone = null;
      currentInsertIndex = -1;
    }
  });

  document.addEventListener('dragend', () => {
    removeDropIndicator();
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    draggedItemId = null;
    currentDropZone = null;
    currentInsertIndex = -1;
  });

  document.addEventListener('drop', (e) => {
    const zone = dropZoneOf(e.target as Element);
    if (!zone) return;
    e.preventDefault();
    zone.classList.remove('drag-over');
    removeDropIndicator();

    const itemId = e.dataTransfer!.getData('text/plain');
    if (!itemId) return;

    const index = currentInsertIndex >= 0 ? currentInsertIndex : computeInsertionIndex(zone, e.clientX, e.clientY);

    if (zone.id === 'unranked-pool') {
      moveItemToUnrankedAtIndex(itemId, index);
    } else {
      const tierId = (zone as HTMLElement).dataset.tierId;
      if (!tierId) return;
      moveItemToTierAtIndex(itemId, tierId, index);
    }

    draggedItemId = null;
    currentDropZone = null;
    currentInsertIndex = -1;

    renderApp(getState());
  });
}

function dropZoneOf(target: Element): Element | null {
  return target.closest('.tier-items, #unranked-pool');
}

function computeInsertionIndex(container: Element, clientX: number, clientY: number): number {
  const items = Array.from(container.querySelectorAll<HTMLElement>('.tier-item'))
    .filter(el => el.dataset.itemId !== draggedItemId);

  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    if (clientY > rect.bottom) continue;                          // cursor below item → keep going
    if (clientY < rect.top) return i;                            // cursor above item (prev row) → insert before
    if (clientX < rect.left + rect.width / 2) return i;         // same row, left half → insert before
    // same row, right half → keep going
  }
  return items.length;
}

function showDropIndicator(container: Element, index: number): void {
  removeDropIndicator();
  const indicator = document.createElement('div');
  indicator.className = 'drop-indicator';
  const items = Array.from(container.querySelectorAll<HTMLElement>('.tier-item'))
    .filter(el => el.dataset.itemId !== draggedItemId);
  if (index >= items.length) {
    container.appendChild(indicator);
  } else {
    container.insertBefore(indicator, items[index]);
  }
}

function removeDropIndicator(): void {
  document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
}
