import { AppState, TierRow } from './types.js';

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

export function moveTierDown(id: string): void {
  const idx = appState.tiers.findIndex(t => t.id === id);
  if (idx < 0 || idx >= appState.tiers.length - 1) return;
  const tiers = [...appState.tiers];
  [tiers[idx], tiers[idx + 1]] = [tiers[idx + 1], tiers[idx]];
  appState = { ...appState, tiers };
}
