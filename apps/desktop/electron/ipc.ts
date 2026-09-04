import { ipcMain, BrowserWindow, screen, app, shell } from 'electron';
import { exec } from 'child_process';
import { setLoginAutoStart } from './autostart';
import { saveWindowState } from './window';

let savedDockCoords = { xPercent: 0.50, yPercent: 0.80 };

export function setCustomDockCoords(xPercent: number, yPercent: number) {
  savedDockCoords = {
    xPercent: Math.max(0.05, Math.min(0.95, xPercent)),
    yPercent: Math.max(0.05, Math.min(0.95, yPercent)),
  };
}

export function glideWindowToDockPosition(win: BrowserWindow, customXPercent?: number, customYPercent?: number) {
  if (!win || win.isDestroyed()) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;
  if (!workArea || !workArea.width || !workArea.height) return;

  const [winWidth, winHeight] = win.getSize();

  const xP = (typeof customXPercent === 'number' && !isNaN(customXPercent)) ? customXPercent : savedDockCoords.xPercent;
  const yP = (typeof customYPercent === 'number' && !isNaN(customYPercent)) ? customYPercent : savedDockCoords.yPercent;

  const targetX = Math.round(workArea.x + (workArea.width - winWidth) * xP);
  const maxY = workArea.y + workArea.height - winHeight - 65;
  const rawTargetY = Math.round(workArea.y + (workArea.height - winHeight) * yP);
  const targetY = Math.min(maxY, Math.max(workArea.y + 20, rawTargetY));

  if (isNaN(targetX) || isNaN(targetY)) return;

  const [startX, startY] = win.getPosition();
  if (isNaN(startX) || isNaN(startY)) return;

  const diffX = targetX - startX;
  const diffY = targetY - startY;

  if (Math.abs(diffX) < 6 && Math.abs(diffY) < 6) return;

  const steps = 14;
  let currentStep = 0;
  const timer = setInterval(() => {
    currentStep++;
    if (currentStep >= steps || win.isDestroyed()) {
      clearInterval(timer);
      if (!win.isDestroyed()) {
        try {
          win.setPosition(targetX, targetY);
          saveWindowState(targetX, targetY, winWidth, winHeight);
        } catch (e) {}
      }
      return;
    }
    const progress = currentStep / steps;
    const ease = 1 - Math.pow(1 - progress, 3);
    const curX = Math.round(startX + diffX * ease);
    const curY = Math.round(startY + diffY * ease);
    if (!isNaN(curX) && !isNaN(curY) && !win.isDestroyed()) {
      try {
        win.setPosition(curX, curY);
      } catch (e) {}
    }
  }, 16);
}

export function glideWindowToBottomCenter(win: BrowserWindow) {
  glideWindowToDockPosition(win);
}

export function setupIpcHandlers(mainWindow: BrowserWindow) {
  ipcMain.on('move-to-bottom-center', () => {
    glideWindowToDockPosition(mainWindow);
  });

  ipcMain.on('move-to-dock-position', (_event, coords?: { xPercent?: number; yPercent?: number }) => {
    glideWindowToDockPosition(mainWindow, coords?.xPercent, coords?.yPercent);
  });

  ipcMain.on('set-dock-position', (_event, { xPercent, yPercent }) => {
    setCustomDockCoords(xPercent, yPercent);
  });

  ipcMain.handle('get-dock-position', () => {
    return savedDockCoords;
  });

  // Set window position directly with strict screen bounds clamping
  ipcMain.on('set-window-position', (_event, { x, y }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (typeof x !== 'number' || isNaN(x) || typeof y !== 'number' || isNaN(y)) return;
      const primaryDisplay = screen.getPrimaryDisplay();
      const { workArea } = primaryDisplay;
      const [width, height] = mainWindow.getSize();

      const clampedX = Math.max(workArea.x + 10, Math.min(workArea.x + workArea.width - width - 10, Math.round(x)));
      const clampedY = Math.max(workArea.y + 10, Math.min(workArea.y + workArea.height - height - 10, Math.round(y)));

      try {
        mainWindow.setPosition(clampedX, clampedY);
        saveWindowState(clampedX, clampedY, width, height);
      } catch (e) {}
    }
  });

  // Dynamically resize window with strict screen bounds clamping
  ipcMain.on('set-window-size', (_event, { width, height, anchor = 'bottom-center' }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (typeof width !== 'number' || isNaN(width) || typeof height !== 'number' || isNaN(height)) return;
      const primaryDisplay = screen.getPrimaryDisplay();
      const { workArea } = primaryDisplay;
      const [currX, currY] = mainWindow.getPosition();
      const [currW, currH] = mainWindow.getSize();

      const maxW = Math.max(200, workArea.width - 20);
      const maxH = Math.max(200, workArea.height - 20);
      const targetW = Math.min(maxW, Math.max(160, Math.round(width)));
      const targetH = Math.min(maxH, Math.max(160, Math.round(height)));

      if (currW === targetW && currH === targetH) return;

      let newX = currX;
      let newY = currY;

      if (anchor === 'bottom-center') {
        newX = currX - Math.round((targetW - currW) / 2);
        newY = currY - (targetH - currH);
      }

      // CRITICAL CLAMP: Window must ALWAYS stay 100% inside visible screen area
      newX = Math.max(workArea.x + 10, Math.min(workArea.x + workArea.width - targetW - 10, newX));
      newY = Math.max(workArea.y + 10, Math.min(workArea.y + workArea.height - targetH - 10, newY));

      if (isNaN(newX) || isNaN(newY)) return;

      try {
        mainWindow.setBounds({
          x: Math.round(newX),
          y: Math.round(newY),
          width: targetW,
          height: targetH,
        });
        saveWindowState(Math.round(newX), Math.round(newY), targetW, targetH);
      } catch (e) {}
    }
  });

  // Desktop Automation Actions: Open Browser URLs & Search Deals
  ipcMain.on('open-external-url', (_event, url: string) => {
    console.log(`🌐 [DESKTOP AUTOMATION]: Opening URL in browser -> ${url}`);
    shell.openExternal(url);
  });

  ipcMain.on('open-deal-search', (_event, query: string) => {
    const encoded = encodeURIComponent(query.trim());
    const searchUrl = `http://localhost:5173/deals?q=${encoded}`;
    console.log(`🔍 [DESKTOP AUTOMATION]: Searching DealMesh in browser -> ${searchUrl}`);
    shell.openExternal(searchUrl);
  });

  // Desktop Automation: Launch local Windows apps
  ipcMain.on('launch-app', (_event, appCommand: string) => {
    console.log(`🚀 [DESKTOP AUTOMATION]: Launching application -> ${appCommand}`);
    if (appCommand === 'chrome') {
      shell.openExternal('https://www.google.com');
    } else {
      exec(`cmd.exe /c start ${appCommand}`, (err) => {
        if (err) console.error('Failed to launch app:', err);
      });
    }
  });

  // Get current window position
  ipcMain.handle('get-window-position', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [x, y] = mainWindow.getPosition();
      return { x, y };
    }
    return { x: 0, y: 0 };
  });

  // Get primary screen / current display work area bounds
  ipcMain.handle('get-screen-bounds', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const bounds = mainWindow.getBounds();
      const currentDisplay = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
      return currentDisplay.workArea;
    }
    return screen.getPrimaryDisplay().workArea;
  });

  // Get all displays info
  ipcMain.handle('get-all-displays', () => {
    return screen.getAllDisplays().map((d) => ({
      id: d.id,
      bounds: d.bounds,
      workArea: d.workArea,
      scaleFactor: d.scaleFactor,
      isPrimary: d.id === screen.getPrimaryDisplay().id,
    }));
  });

  // Real-Time Terminal Voice Logger
  ipcMain.on('log-to-terminal', (_event, msg: string) => {
    console.log(msg);
  });

  // Mouse pass-through handler for seamless background scrolling
  ipcMain.on('set-ignore-mouse-events', (_event, ignore: boolean, forward: boolean = true) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIgnoreMouseEvents(Boolean(ignore), { forward: Boolean(forward) });
    }
  });

  // Set always on top (Windows compatible)
  ipcMain.on('set-always-on-top', (_event, alwaysOnTop: boolean) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(Boolean(alwaysOnTop));
    }
  });

  // Set autostart
  ipcMain.on('set-autostart', (_event, enable: boolean) => {
    setLoginAutoStart(enable);
  });

  // Quit app
  ipcMain.on('quit-app', () => {
    app.quit();
  });
}
