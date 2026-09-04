import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow): Tray {
  if (tray) return tray;

  // Locate tray icon
  let iconPath = path.join(__dirname, '../emotions/Idle/rotations/south.png');
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(app.getAppPath(), 'emotions/Idle/rotations/south.png');
  }

  let trayIcon = nativeImage.createFromPath(iconPath);
  if (trayIcon.isEmpty()) {
    // Fallback: create 16x16 red dot icon
    trayIcon = nativeImage.createFromBuffer(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAcSURBVDhPY/wPBAwUACYGhgFgwKjBqMFoMKAwAAAhpAJh95q53QAAAABJRU5ErkJggg==',
        'base64'
      )
    );
  } else {
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Omi Desktop AI Assistant');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Omi AI Assistant',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Wake',
      click: () => {
        mainWindow.webContents.send('tray-action', 'wake');
      },
    },
    {
      label: 'Sleep',
      click: () => {
        mainWindow.webContents.send('tray-action', 'sleep');
      },
    },
    {
      label: 'Toggle Wandering',
      click: () => {
        mainWindow.webContents.send('tray-action', 'toggle-wander');
      },
    },
    {
      label: 'Center on Screen',
      click: () => {
        mainWindow.webContents.send('tray-action', 'center');
      },
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow.webContents.send('tray-action', 'settings');
      },
    },
    {
      label: 'Debug Panel',
      click: () => {
        mainWindow.webContents.send('tray-action', 'debug');
      },
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.webContents.send('tray-action', 'wake');
  });

  return tray;
}

export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
