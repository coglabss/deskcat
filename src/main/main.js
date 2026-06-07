const { app } = require('electron');
const Store = require('electron-store');
const { createOverlay } = require('./overlay-window');
const { wirePassthrough } = require('./passthrough');
const { createTray } = require('./tray');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  const store = new Store({ defaults: { muted: false, autostart: true } });
  const getState = () => ({ muted: store.get('muted'), autostart: store.get('autostart') });
  const setState = (patch) => {
    for (const [k, v] of Object.entries(patch)) store.set(k, v);
  };

  let win = null;
  let tray = null; // keep a reference so the tray isn't garbage-collected
  app.whenReady().then(() => {
    win = createOverlay();
    wirePassthrough(win);
    tray = createTray(win, getState, setState);
  });
  app.on('second-instance', () => { if (win) win.show(); });
  app.on('window-all-closed', () => app.quit());
}
