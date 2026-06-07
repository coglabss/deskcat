const { Tray, Menu, app } = require('electron');
const path = require('path');

// getState() -> { muted, autostart }; setState(patch) persists changes.
function createTray(win, getState, setState) {
  const tray = new Tray(path.join(__dirname, '../../assets/tray-icon.png'));
  function rebuild() {
    const muted = getState().muted;
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: '🍗 Feed', click: () => win.webContents.send('cat:action', 'feed') },
      { label: '😴 Sleep', click: () => win.webContents.send('cat:action', 'sleep') },
      { label: '🧶 Play', click: () => win.webContents.send('cat:action', 'play') },
      { type: 'separator' },
      { label: muted ? '🔈 Unmute' : '🔇 Mute', click: () => { const m = !muted; setState({ muted: m }); win.webContents.send('cat:mute', m); rebuild(); } },
      { label: 'Start with Windows', type: 'checkbox', checked: getState().autostart, click: (item) => setState({ autostart: item.checked }) },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ]));
  }
  tray.setToolTip('Desktop Cat');
  rebuild();
  return tray;
}

module.exports = { createTray };
