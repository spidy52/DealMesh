import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');

interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadWindowState(): WindowState {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;

  let state: WindowState = {
    x: Math.round(workArea.x + workArea.width * 0.5 - 80),
    y: Math.round(workArea.y + workArea.height * 0.75 - 80),
    width: 160,
    height: 160,
  };

  try {
    if (fs.existsSync(STATE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      if (saved.x !== undefined && saved.y !== undefined) {
        const clampedX = Math.max(workArea.x + 20, Math.min(workArea.x + workArea.width - 180, saved.x));
        const clampedY = Math.max(workArea.y + 20, Math.min(workArea.y + workArea.height - 180, saved.y));
        state = {
          x: clampedX,
          y: clampedY,
          width: Math.max(160, saved.width || 160),
          height: Math.max(160, saved.height || 160),
        };
      }
    }
  } catch (e) {
    console.error('Failed to load window state:', e);
  }

  return state;
}

export function saveWindowState(x: number, y: number, width: number, height: number) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ x, y, width, height }), 'utf-8');
  } catch (e) {
    console.error('Failed to save window state:', e);
  }
}

export function createAssistantWindow(): BrowserWindow {
  const state = loadWindowState();
  const preloadPath = fs.existsSync(path.join(__dirname, 'preload.mjs'))
    ? path.join(__dirname, 'preload.mjs')
    : path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: 160,
    height: 160,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    focusable: true,
    show: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
    },
  });

  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setVisibleOnAllWorkspaces?.(true, { visibleOnFullScreen: true });
  mainWindow.show();
  mainWindow.focus();
  mainWindow.moveTop();

  mainWindow.on('moved', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [x, y] = mainWindow.getPosition();
      const [width, height] = mainWindow.getSize();
      saveWindowState(x, y, width, height);
      mainWindow.webContents.send('window-moved', { x, y });
    }
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
