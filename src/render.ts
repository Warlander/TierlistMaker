import { AppState, TierItem, TierRow } from './types.js';
import { saveStateToLocalStorage } from './serialization.js';
import {
  getState,
  addTier,
  removeTier,
  renameTier,
  recolorTier,
  moveTierUp,
  moveTierDown,
  addTextItem,
  addImageItem,
  renameItem,
  changeItemImage,
  removeItemImage,
  updateItemPanZoom,
  deleteItem,
} from './state.js';
import { showContextMenu } from './ui/contextMenu.js';
import { showImageAdjust } from './ui/imageAdjust.js';

function createItemElement(item: TierItem): HTMLElement {
  const card = document.createElement('div');
  card.classList.add('tier-item');
  card.dataset.itemId = item.id;
  card.draggable = true;

  if (item.type === 'image' && item.imageDataUrl) {
    const CARD_W = 80, CARD_H = 72;
    const panX = item.imagePanX ?? 0;
    const panY = item.imagePanY ?? 0;
    const zoom = item.imageZoom ?? 1;
    const probe = new Image();
    const applyBg = () => {
      const nw = probe.naturalWidth, nh = probe.naturalHeight;
      if (!nw || !nh) return;
      const coverScale = Math.max(CARD_W / nw, CARD_H / nh);
      const displayW = nw * coverScale * zoom;
      const displayH = nh * coverScale * zoom;
      const bx = (CARD_W - displayW) / 2 + panX * CARD_W;
      const by = (CARD_H - displayH) / 2 + panY * CARD_H;
      card.style.backgroundImage = `url(${item.imageDataUrl})`;
      card.style.backgroundSize = `${displayW}px ${displayH}px`;
      card.style.backgroundPosition = `${bx}px ${by}px`;
    };
    probe.onload = applyBg;
    probe.src = item.imageDataUrl;
    if (probe.complete && probe.naturalWidth > 0) { probe.onload = null; applyBg(); }

    const label = document.createElement('span');
    label.classList.add('item-name-label');
    label.textContent = item.name;
    card.appendChild(label);
  } else {
    card.textContent = item.name;
  }

  card.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const menuItems: { label: string; onClick: () => void; danger?: boolean }[] = [
      { label: 'Rename', onClick: () => startItemRename(card, item) },
    ];
    if (item.type === 'image') {
      menuItems.push({ label: 'Adjust image', onClick: () => {
        showImageAdjust(item, (panX, panY, zoom) => {
          updateItemPanZoom(item.id, panX, panY, zoom);
          renderApp(getState());
        });
      }});
      menuItems.push({ label: 'Change image', onClick: () => pickNewImage(item.id) });
      menuItems.push({ label: 'Remove image', onClick: () => { removeItemImage(item.id); renderApp(getState()); } });
    } else {
      menuItems.push({ label: 'Add image', onClick: () => pickNewImage(item.id) });
    }
    menuItems.push({ label: 'Delete item', danger: true, onClick: () => {
      if (confirm(`Delete "${item.name}"?`)) {
        deleteItem(item.id);
        renderApp(getState());
      }
    }});
    showContextMenu(e.clientX, e.clientY, menuItems);
  });

  return card;
}

function startItemRename(card: HTMLElement, item: TierItem): void {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = item.name;

  if (item.type === 'image') {
    // Sit at the bottom overlaying the image, matching .item-name-label style
    Object.assign(input.style, {
      position: 'absolute', bottom: '0', left: '0', right: '0', zIndex: '1',
      width: '100%', fontSize: '0.65rem', textAlign: 'center',
      padding: '1px 2px', background: 'rgba(0,0,0,0.75)', color: '#fff',
      border: 'none', outline: '1px solid #aaa',
    });
    const label = card.querySelector('.item-name-label');
    if (label) label.replaceWith(input);
    else card.appendChild(input);
  } else {
    // Dark card background — use light text, transparent background
    Object.assign(input.style, {
      width: '100%', fontSize: 'inherit', textAlign: 'center',
      padding: '2px 4px', background: 'transparent',
      color: '#f0f0f0', border: 'none', outline: '1px solid #888',
    });
    card.textContent = '';
    card.appendChild(input);
  }

  input.focus();
  input.select();
  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const val = input.value.trim() || item.name;
    renameItem(item.id, val);
    renderApp(getState());
  };
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { committed = true; renderApp(getState()); }
  });
}

function startTierRename(label: HTMLElement, labelText: HTMLSpanElement, tier: TierRow): void {
  if (label.querySelector('input.tier-label-input')) return; // already renaming
  const input = document.createElement('input');
  input.type = 'text';
  input.value = tier.label;
  input.classList.add('tier-label-input');
  label.replaceChild(input, labelText);
  input.focus();
  input.select();
  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const val = input.value.trim() || tier.label;
    renameTier(tier.id, val);
    renderApp(getState());
  };
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { committed = true; renderApp(getState()); }
  });
}

function pickNewImage(itemId: string): void {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) { fileInput.remove(); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      changeItemImage(itemId, dataUrl);
      renderApp(getState());
      fileInput.remove();
      checkAndOpenAdjust(itemId, dataUrl);
    };
    reader.readAsDataURL(file);
  });
  fileInput.click();
}

function checkAndOpenAdjust(itemId: string, dataUrl: string): void {
  const imgEl = new Image();
  imgEl.onload = () => {
    if (imgEl.naturalWidth === imgEl.naturalHeight) return;
    const state = getState();
    const item = findItem(state, itemId);
    if (!item) return;
    showImageAdjust(item, (panX, panY, zoom) => {
      updateItemPanZoom(itemId, panX, panY, zoom);
      renderApp(getState());
    });
  };
  imgEl.src = dataUrl;
}

function findItem(state: AppState, id: string): TierItem | undefined {
  for (const tier of state.tiers) {
    const found = tier.items.find(it => it.id === id);
    if (found) return found;
  }
  return state.unranked.find(it => it.id === id);
}

function createTierRowElement(tier: TierRow, isFirst: boolean, isLast: boolean): HTMLElement {
  const row = document.createElement('div');
  row.classList.add('tier-row');
  row.dataset.tierId = tier.id;

  // Label + color picker
  const label = document.createElement('div');
  label.classList.add('tier-label');
  label.style.backgroundColor = tier.color;

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = tier.color;
  colorInput.classList.add('tier-color-input');
  colorInput.title = 'Change tier color';
  colorInput.addEventListener('input', () => {
    recolorTier(tier.id, colorInput.value);
    renderApp(getState());
  });

  const labelText = document.createElement('span');
  labelText.classList.add('tier-label-text');
  labelText.textContent = tier.label;
  labelText.title = 'Click to rename';
  labelText.addEventListener('click', (e) => {
    e.stopPropagation();
    startTierRename(label, labelText, tier);
  });

  label.addEventListener('click', (e) => {
    if (e.target !== label) return;
    colorInput.click();
  });

  label.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
      { label: 'Rename', onClick: () => startTierRename(label, labelText, tier) },
      { label: 'Change color', onClick: () => colorInput.click() },
    ]);
  });

  label.appendChild(colorInput);
  label.appendChild(labelText);

  // Items area
  const items = document.createElement('div');
  items.classList.add('tier-items');
  items.dataset.tierId = tier.id;
  for (const item of tier.items) {
    items.appendChild(createItemElement(item));
  }

  // Controls
  const controls = document.createElement('div');
  controls.classList.add('tier-controls');

  const makeBtn = (text: string, title: string, disabled: boolean, onClick: () => void): HTMLButtonElement => {
    const btn = document.createElement('button');
    btn.classList.add('tier-control-btn');
    btn.textContent = text;
    btn.title = title;
    btn.disabled = disabled;
    btn.addEventListener('click', onClick);
    return btn;
  };

  controls.appendChild(makeBtn('▲', 'Move up', isFirst, () => { moveTierUp(tier.id); renderApp(getState()); }));
  controls.appendChild(makeBtn('▼', 'Move down', isLast, () => { moveTierDown(tier.id); renderApp(getState()); }));
  controls.appendChild(makeBtn('×', 'Remove tier', false, () => { removeTier(tier.id); renderApp(getState()); }));

  row.appendChild(label);
  row.appendChild(items);
  row.appendChild(controls);
  return row;
}

export function renderApp(state: AppState): void {
  const tierlistEl = document.getElementById('tierlist')!;
  const unrankedEl = document.getElementById('unranked-pool')!;

  tierlistEl.innerHTML = '';
  unrankedEl.innerHTML = '';

  state.tiers.forEach((tier, i) => {
    tierlistEl.appendChild(createTierRowElement(tier, i === 0, i === state.tiers.length - 1));
  });

  // Add Tier button — create once, keep outside tierlist so innerHTML clear doesn't remove it
  if (!document.getElementById('add-tier-btn')) {
    const addBtn = document.createElement('button');
    addBtn.id = 'add-tier-btn';
    addBtn.textContent = '+ Add Tier';
    addBtn.addEventListener('click', () => { addTier(); renderApp(getState()); });
    tierlistEl.parentElement!.insertBefore(addBtn, tierlistEl.nextSibling);
  }

  for (const item of state.unranked) {
    unrankedEl.appendChild(createItemElement(item));
  }

  attachItemCreationControls();
  saveStateToLocalStorage(state);
}

function attachItemCreationControls(): void {
  const existing = document.getElementById('item-creation-controls');
  if (existing) existing.remove();

  const unrankedSection = document.getElementById('unranked-section')!;

  const controls = document.createElement('div');
  controls.id = 'item-creation-controls';

  // Hidden file input for images
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.multiple = true;
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files ?? []);
    if (files.length === 0) return;
    let loaded = 0;
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const name = file.name.replace(/\.[^.]+$/, '');
        const imgEl = new Image();
        imgEl.onload = () => {
          addImageItem(name, dataUrl);
          loaded++;
          if (loaded === files.length) renderApp(getState());
          if (imgEl.naturalWidth !== imgEl.naturalHeight) {
            const state = getState();
            const newItem = state.unranked[state.unranked.length - 1];
            if (newItem) {
              showImageAdjust(newItem, (panX, panY, zoom) => {
                updateItemPanZoom(newItem.id, panX, panY, zoom);
                renderApp(getState());
              });
            }
          }
        };
        imgEl.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
    fileInput.value = '';
  });
  controls.appendChild(fileInput);

  const addTextBtn = document.createElement('button');
  addTextBtn.textContent = '+ Add Text';
  addTextBtn.addEventListener('click', () => showTextInput(controls, addTextBtn));
  controls.appendChild(addTextBtn);

  const addImagesBtn = document.createElement('button');
  addImagesBtn.textContent = '+ Add Images';
  addImagesBtn.addEventListener('click', () => fileInput.click());
  controls.appendChild(addImagesBtn);

  unrankedSection.appendChild(controls);
}

function showTextInput(controls: HTMLElement, addTextBtn: HTMLButtonElement): void {
  addTextBtn.style.display = 'none';

  const row = document.createElement('div');
  row.id = 'text-item-input-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Item name';
  input.classList.add('text-item-input');
  row.appendChild(input);

  const confirm = document.createElement('button');
  confirm.textContent = 'Add';
  const cancel = document.createElement('button');
  cancel.textContent = 'Cancel';

  const commit = () => {
    const val = input.value.trim();
    if (val) addTextItem(val);
    renderApp(getState());
  };
  const dismiss = () => renderApp(getState());

  confirm.addEventListener('click', commit);
  cancel.addEventListener('click', dismiss);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') dismiss();
  });

  row.appendChild(confirm);
  row.appendChild(cancel);
  controls.appendChild(row);
  input.focus();
}
