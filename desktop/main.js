const {app, BrowserWindow, shell} = require('electron');
const path = require('path');
app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 440, height: 780, minWidth: 340, minHeight: 520,
    backgroundColor: '#0a0e12', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadFile(path.join(__dirname, '..', 'www', 'index.html'));
  win.webContents.setWindowOpenHandler(({url}) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return {action:'deny'};
  });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
