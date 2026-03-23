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
export function moveTierDown(id) {
    const idx = appState.tiers.findIndex(t => t.id === id);
    if (idx < 0 || idx >= appState.tiers.length - 1)
        return;
    const tiers = [...appState.tiers];
    [tiers[idx], tiers[idx + 1]] = [tiers[idx + 1], tiers[idx]];
    appState = Object.assign(Object.assign({}, appState), { tiers });
}
