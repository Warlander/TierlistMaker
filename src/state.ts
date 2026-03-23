import { AppState, TierItem, TierRow } from './types.js';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeTier(label: string, color: string): TierRow {
  return { id: generateId(), label, color, items: [] };
}

export function createInitialState(): AppState {
  return {
    tiers: [
      makeTier('S', '#ff7f7f'),
      makeTier('A', '#ffbf7f'),
      makeTier('B', '#ffdf80'),
      makeTier('C', '#7fff7f'),
      makeTier('D', '#7fbfff'),
      makeTier('F', '#bf7fff'),
    ],
    unranked: [],
  };
}

let appState: AppState = createInitialState();

export function getState(): AppState {
  return appState;
}

export function setState(newState: AppState): void {
  appState = newState;
}

export function addTier(): void {
  appState = { ...appState, tiers: [...appState.tiers, makeTier('New', '#888888')] };
}

export function removeTier(id: string): void {
  const tier = appState.tiers.find(t => t.id === id);
  const removed = tier ? tier.items : [];
  appState = {
    ...appState,
    tiers: appState.tiers.filter(t => t.id !== id),
    unranked: [...appState.unranked, ...removed],
  };
}

export function renameTier(id: string, label: string): void {
  appState = {
    ...appState,
    tiers: appState.tiers.map(t => t.id === id ? { ...t, label } : t),
  };
}

export function recolorTier(id: string, color: string): void {
  appState = {
    ...appState,
    tiers: appState.tiers.map(t => t.id === id ? { ...t, color } : t),
  };
}

export function moveTierUp(id: string): void {
  const idx = appState.tiers.findIndex(t => t.id === id);
  if (idx <= 0) return;
  const tiers = [...appState.tiers];
  [tiers[idx - 1], tiers[idx]] = [tiers[idx], tiers[idx - 1]];
  appState = { ...appState, tiers };
}

export function addTextItem(name: string): void {
  const item: TierItem = { id: generateId(), type: 'text', name };
  appState = { ...appState, unranked: [...appState.unranked, item] };
}

export function addImageItem(name: string, imageDataUrl: string): void {
  const item: TierItem = { id: generateId(), type: 'image', name, imageDataUrl, imagePanX: 0, imagePanY: 0, imageZoom: 1 };
  appState = { ...appState, unranked: [...appState.unranked, item] };
}

export function moveTierDown(id: string): void {
  const idx = appState.tiers.findIndex(t => t.id === id);
  if (idx < 0 || idx >= appState.tiers.length - 1) return;
  const tiers = [...appState.tiers];
  [tiers[idx], tiers[idx + 1]] = [tiers[idx + 1], tiers[idx]];
  appState = { ...appState, tiers };
}

function removeItemFromState(itemId: string): { item: TierItem; state: AppState } | null {
  for (const tier of appState.tiers) {
    const idx = tier.items.findIndex(it => it.id === itemId);
    if (idx !== -1) {
      const item = tier.items[idx];
      const tiers = appState.tiers.map(t =>
        t.id === tier.id ? { ...t, items: t.items.filter(it => it.id !== itemId) } : t
      );
      return { item, state: { ...appState, tiers } };
    }
  }
  const idx = appState.unranked.findIndex(it => it.id === itemId);
  if (idx !== -1) {
    const item = appState.unranked[idx];
    return { item, state: { ...appState, unranked: appState.unranked.filter(it => it.id !== itemId) } };
  }
  return null;
}

export function moveItemToTier(itemId: string, tierId: string): void {
  const result = removeItemFromState(itemId);
  if (!result) return;
  const { item, state } = result;
  appState = {
    ...state,
    tiers: state.tiers.map(t => t.id === tierId ? { ...t, items: [...t.items, item] } : t),
  };
}

export function moveItemToUnranked(itemId: string): void {
  const result = removeItemFromState(itemId);
  if (!result) return;
  const { item, state } = result;
  appState = { ...state, unranked: [...state.unranked, item] };
}
