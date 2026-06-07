const { app } = require('electron');

function applyAutostart(enabled) {
  app.setLoginItemSettings({
    openAtLogin: !!enabled,
    path: process.execPath,
    args: [],
  });
}

module.exports = { applyAutostart };
