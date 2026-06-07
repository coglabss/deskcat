const { ipcMain } = require('electron');

// Start by ignoring the mouse (clicks pass through to the desktop). When the
// renderer reports the pointer is over the cat, capture the mouse so drag/pet
// work; otherwise keep ignoring. `forward: true` lets mousemove events still
// reach the renderer so it can keep reporting hover state.
function wirePassthrough(win) {
  win.setIgnoreMouseEvents(true, { forward: true });
  ipcMain.on('cat:hover', (_e, over) => {
    win.setIgnoreMouseEvents(!over, { forward: true });
  });
}

module.exports = { wirePassthrough };
