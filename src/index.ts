import { getState, setState, clearTierlist } from './state.js';
import { renderApp } from './render.js';
import { saveToFile, loadFromFile, loadStateFromLocalStorage } from './serialization.js';
import { initDragAndDrop } from './dragAndDrop.js';

function bootstrap(): void {
  const saved = loadStateFromLocalStorage();
  if (saved) {
    setState(saved);
  }
  renderApp(getState());
  initDragAndDrop();

  document.getElementById('save-btn')!.addEventListener('click', () => {
    saveToFile(getState());
  });

  document.getElementById('load-btn')!.addEventListener('click', () => {
    loadFromFile()
      .then(newState => {
        setState(newState);
        renderApp(newState);
      })
      .catch(err => alert(`Load failed: ${err.message}`));
  });

  document.getElementById('clear-btn')!.addEventListener('click', () => {
    if (confirm('Clear the entire tierlist? This cannot be undone.')) {
      clearTierlist();
      renderApp(getState());
    }
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
