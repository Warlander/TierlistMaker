import { getState, setState, clearTierlist } from './state.js';
import { renderApp, initPasteHandler } from './render.js';
import { saveToFile, loadFromFile, loadStateFromLocalStorage } from './serialization.js';
import { initDragAndDrop } from './dragAndDrop.js';
import { VERSION } from './version.js';
import { showExportModal } from './ui/exportImage.js';

function bootstrap(): void {
  const saved = loadStateFromLocalStorage();
  if (saved) {
    setState(saved);
  }
  renderApp(getState());
  initDragAndDrop();
  initPasteHandler();

  const versionEl = document.getElementById('version-string');
  if (versionEl) versionEl.textContent = `Version ${VERSION}`;

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

  document.getElementById('export-img-btn')!.addEventListener('click', () => {
    showExportModal(getState());
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
