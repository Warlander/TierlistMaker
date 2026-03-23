import { AppState, TierItem, TierRow } from './types.js';
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
} from './state.js';

function createItemElement(item: TierItem): HTMLElement {
  const card = document.createElement('div');
  card.classList.add('tier-item');
  card.dataset.itemId = item.id;
  card.draggable = true;

  if (item.type === 'image' && item.imageDataUrl) {
    const img = document.createElement('img');
    img.src = item.imageDataUrl;
    img.alt = item.name;
    card.appendChild(img);

    const label = document.createElement('span');
    label.classList.add('item-name-label');
    label.textContent = item.name;
    card.appendChild(label);
  } else {
    card.textContent = item.name;
  }

  return card;
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
  });

  label.addEventListener('click', (e) => {
    if (e.target !== label) return;
    colorInput.click();
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
        addImageItem(file.name.replace(/\.[^.]+$/, ''), reader.result as string);
        loaded++;
        if (loaded === files.length) renderApp(getState());
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
