const { app } = require('electron');
const { createOverlay } = require('./overlay-window');
const { wirePassthrough } = require('./passthrough');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  let win = null;
  app.whenReady().then(() => {
    win = createOverlay();
    wirePassthrough(win);
  });
  app.on('second-instance', () => { if (win) win.show(); });
  app.on('window-all-closed', () => app.quit());
}
