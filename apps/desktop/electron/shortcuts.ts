import { globalShortcut, BrowserWindow } from 'electron';

export function registerGlobalShortcuts(mainWindow: BrowserWindow) {
  const shortcutKey = 'CommandOrControl+Shift+Space';

  const ret = globalShortcut.register(shortcutKey, () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.webContents.send('shortcut-wake');
    }
  });

  if (!ret) {
    console.warn(`Registration of global shortcut "${shortcutKey}" failed.`);
  }
}

export function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll();
}
