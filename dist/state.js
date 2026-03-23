function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function makeTier(label, color) {
    return { id: generateId(), label, color, items: [] };
}
export function createInitialState() {
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
let appState = createInitialState();
export function getState() {
    return appState;
}
export function setState(newState) {
    appState = newState;
}
export function addTier() {
    appState = Object.assign(Object.assign({}, appState), { tiers: [...appState.tiers, makeTier('New', '#888888')] });
}
export function removeTier(id) {
    const tier = appState.tiers.find(t => t.id === id);
    const removed = tier ? tier.items : [];
    appState = Object.assign(Object.assign({}, appState), { tiers: appState.tiers.filter(t => t.id !== id), unranked: [...appState.unranked, ...removed] });
}
export function renameTier(id, label) {
    appState = Object.assign(Object.assign({}, appState), { tiers: appState.tiers.map(t => t.id === id ? Object.assign(Object.assign({}, t), { label }) : t) });
}
export function recolorTier(id, color) {
    appState = Object.assign(Object.assign({}, appState), { tiers: appState.tiers.map(t => t.id === id ? Object.assign(Object.assign({}, t), { color }) : t) });
}
export function moveTierUp(id) {
    const idx = appState.tiers.findIndex(t => t.id === id);
    if (idx <= 0)
        return;
    const tiers = [...appState.tiers];
    [tiers[idx - 1], tiers[idx]] = [tiers[idx], tiers[idx - 1]];
    appState = Object.assign(Object.assign({}, appState), { tiers });
}
export function addTextItem(name) {
    const item = { id: generateId(), type: 'text', name };
    appState = Object.assign(Object.assign({}, appState), { unranked: [...appState.unranked, item] });
}
export function addImageItem(name, imageDataUrl) {
    const item = { id: generateId(), type: 'image', name, imageDataUrl, imagePanX: 0, imagePanY: 0, imageZoom: 1 };
    appState = Object.assign(Object.assign({}, appState), { unranked: [...appState.unranked, item] });
}
export function moveTierDown(id) {
    const idx = appState.tiers.findIndex(t => t.id === id);
    if (idx < 0 || idx >= appState.tiers.length - 1)
        return;
    const tiers = [...appState.tiers];
    [tiers[idx], tiers[idx + 1]] = [tiers[idx + 1], tiers[idx]];
    appState = Object.assign(Object.assign({}, appState), { tiers });
}
function removeItemFromState(itemId) {
    for (const tier of appState.tiers) {
        const idx = tier.items.findIndex(it => it.id === itemId);
        if (idx !== -1) {
            const item = tier.items[idx];
            const tiers = appState.tiers.map(t => t.id === tier.id ? Object.assign(Object.assign({}, t), { items: t.items.filter(it => it.id !== itemId) }) : t);
            return { item, state: Object.assign(Object.assign({}, appState), { tiers }) };
        }
    }
    const idx = appState.unranked.findIndex(it => it.id === itemId);
    if (idx !== -1) {
        const item = appState.unranked[idx];
        return { item, state: Object.assign(Object.assign({}, appState), { unranked: appState.unranked.filter(it => it.id !== itemId) }) };
    }
    return null;
}
export function moveItemToTier(itemId, tierId) {
    const result = removeItemFromState(itemId);
    if (!result)
        return;
    const { item, state } = result;
    appState = Object.assign(Object.assign({}, state), { tiers: state.tiers.map(t => t.id === tierId ? Object.assign(Object.assign({}, t), { items: [...t.items, item] }) : t) });
}
export function renameItem(id, name) {
    appState = Object.assign(Object.assign({}, appState), { tiers: appState.tiers.map(t => (Object.assign(Object.assign({}, t), { items: t.items.map(it => it.id === id ? Object.assign(Object.assign({}, it), { name }) : it) }))), unranked: appState.unranked.map(it => it.id === id ? Object.assign(Object.assign({}, it), { name }) : it) });
}
export function changeItemImage(id, imageDataUrl) {
    appState = Object.assign(Object.assign({}, appState), { tiers: appState.tiers.map(t => (Object.assign(Object.assign({}, t), { items: t.items.map(it => it.id === id ? Object.assign(Object.assign({}, it), { type: 'image', imageDataUrl }) : it) }))), unranked: appState.unranked.map(it => it.id === id ? Object.assign(Object.assign({}, it), { type: 'image', imageDataUrl }) : it) });
}
export function removeItemImage(id) {
    appState = Object.assign(Object.assign({}, appState), { tiers: appState.tiers.map(t => (Object.assign(Object.assign({}, t), { items: t.items.map(it => it.id === id ? Object.assign(Object.assign({}, it), { type: 'text', imageDataUrl: undefined }) : it) }))), unranked: appState.unranked.map(it => it.id === id ? Object.assign(Object.assign({}, it), { type: 'text', imageDataUrl: undefined }) : it) });
}
export function moveItemToUnranked(itemId) {
    const result = removeItemFromState(itemId);
    if (!result)
        return;
    const { item, state } = result;
    appState = Object.assign(Object.assign({}, state), { unranked: [...state.unranked, item] });
}
