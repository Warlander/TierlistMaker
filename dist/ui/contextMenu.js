let activeMenu = null;
let outsideClickListener = null;
let escapeListener = null;
function closeContextMenu() {
    if (activeMenu) {
        activeMenu.remove();
        activeMenu = null;
    }
    if (outsideClickListener) {
        document.removeEventListener('mousedown', outsideClickListener, true);
        outsideClickListener = null;
    }
    if (escapeListener) {
        document.removeEventListener('keydown', escapeListener, true);
        escapeListener = null;
    }
}
export function showContextMenu(x, y, items) {
    closeContextMenu();
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    Object.assign(menu.style, {
        position: 'fixed',
        zIndex: '9999',
        background: '#2a2a2a',
        border: '1px solid #444',
        borderRadius: '4px',
        padding: '4px 0',
        minWidth: '140px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    });
    for (const item of items) {
        const btn = document.createElement('button');
        btn.textContent = item.label;
        Object.assign(btn.style, {
            display: 'block',
            width: '100%',
            padding: '6px 14px',
            background: 'none',
            border: 'none',
            color: '#e0e0e0',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '14px',
        });
        btn.addEventListener('mouseenter', () => { btn.style.background = '#3a3a3a'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'none'; });
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault(); // prevent browser from shifting focus away from future input
            e.stopPropagation();
        });
        btn.addEventListener('click', () => {
            closeContextMenu();
            item.onClick();
        });
        menu.appendChild(btn);
    }
    document.body.appendChild(menu);
    activeMenu = menu;
    // Position, clamped to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mw = menu.offsetWidth || 140;
    const mh = menu.offsetHeight || items.length * 32;
    menu.style.left = Math.min(x, vw - mw - 8) + 'px';
    menu.style.top = Math.min(y, vh - mh - 8) + 'px';
    outsideClickListener = (e) => {
        if (!menu.contains(e.target))
            closeContextMenu();
    };
    escapeListener = (e) => {
        if (e.key === 'Escape')
            closeContextMenu();
    };
    document.addEventListener('mousedown', outsideClickListener, true);
    document.addEventListener('keydown', escapeListener, true);
}
