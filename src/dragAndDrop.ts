import { getState, moveItemToTier, moveItemToUnranked } from './state.js';
import { renderApp } from './render.js';

let initialized = false;

export function initDragAndDrop(): void {
  if (initialized) return;
  initialized = true;

  document.addEventListener('dragstart', (e) => {
    const card = (e.target as Element).closest('.tier-item') as HTMLElement | null;
    if (!card) return;
    const itemId = card.dataset.itemId;
    if (!itemId) return;
    e.dataTransfer!.setData('text/plain', itemId);
    e.dataTransfer!.effectAllowed = 'move';
  });

  document.addEventListener('dragover', (e) => {
    const zone = dropZoneOf(e.target as Element);
    if (!zone) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    zone.classList.add('drag-over');
  });

  document.addEventListener('dragleave', (e) => {
    const zone = dropZoneOf(e.target as Element);
    if (!zone) return;
    // Only remove the class if the cursor actually left the zone (not just moved to a child)
    if (!zone.contains(e.relatedTarget as Node | null)) {
      zone.classList.remove('drag-over');
    }
  });

  document.addEventListener('drop', (e) => {
    const zone = dropZoneOf(e.target as Element);
    if (!zone) return;
    e.preventDefault();
    zone.classList.remove('drag-over');

    const itemId = e.dataTransfer!.getData('text/plain');
    if (!itemId) return;

    if (zone.id === 'unranked-pool') {
      moveItemToUnranked(itemId);
    } else {
      const tierId = (zone as HTMLElement).dataset.tierId;
      if (!tierId) return;
      moveItemToTier(itemId, tierId);
    }

    renderApp(getState());
  });
}

function dropZoneOf(target: Element): Element | null {
  const zone = target.closest('.tier-items, #unranked-pool');
  return zone;
}
