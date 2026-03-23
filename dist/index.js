import { getState, setState } from './state.js';
import { renderApp } from './render.js';
import { saveToFile, loadFromFile } from './serialization.js';
import { initDragAndDrop } from './dragAndDrop.js';
function bootstrap() {
    renderApp(getState());
    initDragAndDrop();
    document.getElementById('save-btn').addEventListener('click', () => {
        saveToFile(getState());
    });
    document.getElementById('load-btn').addEventListener('click', () => {
        loadFromFile()
            .then(newState => {
            setState(newState);
            renderApp(newState);
        })
            .catch(err => alert(`Load failed: ${err.message}`));
    });
}
document.addEventListener('DOMContentLoaded', bootstrap);
