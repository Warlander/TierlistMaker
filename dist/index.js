import { getState } from './state.js';
import { renderApp } from './render.js';
function bootstrap() {
    renderApp(getState());
}
document.addEventListener('DOMContentLoaded', bootstrap);
