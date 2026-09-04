import { app, BrowserWindow, session, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess, exec } from 'child_process';
import { createAssistantWindow, getMainWindow } from './window';
import { createTray, destroyTray } from './tray';
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './shortcuts';
import { setupIpcHandlers, glideWindowToBottomCenter } from './ipc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-cache');
app.commandLine.appendSwitch('no-sandbox');

let mainWindow: BrowserWindow | null = null;
let voiceProcess: ChildProcess | null = null;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('⚠️ [ELECTRON]: Another instance of Omni is already running. Quitting duplicate instance.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.webContents.send('show-deal-overlay', { query: 'deals' });
    }
  });
}

function startPythonVoiceService(win: BrowserWindow) {
  const devScriptPath = path.join(__dirname, '../electron/voice_service.py');
  const prodScriptPath = path.join(__dirname, 'voice_service.py');
  const scriptPath = fs.existsSync(devScriptPath) ? devScriptPath : prodScriptPath;
  console.log('🚀 [VOICE ENGINE]: Spawning Python native microphone & desktop automation service from', scriptPath);

  voiceProcess = spawn('python', [scriptPath], {
    cwd: path.join(__dirname, '../../..'),
  });

  voiceProcess.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line.trim());
        if (msg.event === 'ready') {
          console.log('🎤 [VOICE READY]: Omni is actively listening on your microphone!');
        } else if (msg.event === 'listening') {
          win.webContents.send('voice-status', 'LISTENING');
        } else if (msg.event === 'interrupted') {
          console.log(`🛑 [BARGE-IN]: Interrupted Omni speech by user audio!`);
          win.webContents.send('voice-interrupted');
        } else if (msg.event === 'heard') {
          console.log(`🗣️ [USER SPOKEN]: "${msg.text}"`);
          glideWindowToBottomCenter(win);
          win.webContents.send('voice-heard', msg.text);
          win.webContents.send('voice-wake');
        } else if (msg.event === 'action') {
          glideWindowToBottomCenter(win);
          console.log(`⚡ [DESKTOP ACTION]: ${msg.action} ->`, msg.query || msg.url || msg.command);
          if (msg.action === 'checkout') {
            win.webContents.send('execute-checkout');
          } else if (msg.action === 'deal_completed') {
            win.webContents.send('close-negotiation-arena');
            win.webContents.send('execute-checkout');
            const prodTitle = msg.deal_data?.confirmed_title || msg.deal_data?.title || 'Titan Edge Ultra-Slim Minimalist Watch';
            const prodPrice = msg.deal_data?.confirmed_price || msg.deal_data?.basePrice || 2000;
            const origPrice = msg.deal_data?.originalPrice || 2499;
            const savings = msg.deal_data?.savings || Math.max(0, origPrice - prodPrice);
            const confirmedStore = msg.deal_data?.confirmed_store || 'Titan Official Store';
            const cartQuery = new URLSearchParams({
              cart: 'open',
              product: String(prodTitle),
              price: String(prodPrice),
              original_price: String(origPrice),
              savings: String(savings),
              store: String(confirmedStore)
            }).toString();

            const liveUrl = msg.url || msg.deal_data?.confirmed_url || (msg.deal_data?.stores && msg.deal_data.stores[0]?.url);
            if (liveUrl && (liveUrl.startsWith('http://') || liveUrl.startsWith('https://')) && !liveUrl.includes('localhost:5174')) {
              console.log(`🌐 [BROWSER NAVIGATION]: Opening live store URL on desktop: ${liveUrl}`);
              shell.openExternal(liveUrl);
            } else {
              const targetUrl = `http://localhost:5174/?${cartQuery}`;
              shell.openExternal(targetUrl);
            }
          } else if (msg.action === 'show_deal_overlay' || msg.action === 'show_screen_products' || msg.action === 'show_variant_picker') {
            win.webContents.send('close-negotiation-arena');
            win.webContents.send('show-deal-overlay', { query: msg.query || 'deals', dealData: msg.deal_data });
            const liveStoreUrl = msg.url || msg.deal_data?.confirmed_url;
            if (liveStoreUrl && (liveStoreUrl.startsWith('http://') || liveStoreUrl.startsWith('https://')) && !liveStoreUrl.includes('localhost')) {
              console.log(`🌐 [BROWSER NAVIGATION]: Opening store web page on screen: ${liveStoreUrl}`);
              shell.openExternal(liveStoreUrl);
            }
          } else if (msg.action === 'show_negotiation_arena') {
            win.webContents.send('show-negotiation-arena', { query: msg.query || 'deals', dealData: msg.deal_data });
          } else if (msg.action === 'open_deal_search') {
            win.webContents.send('show-deal-overlay', { query: msg.query || 'deals', dealData: msg.deal_data });
            const liveUrl = msg.url || msg.deal_data?.confirmed_url;
            if (liveUrl) {
              console.log(`🌐 [BROWSER NAVIGATION]: Opening store search URL: ${liveUrl}`);
              shell.openExternal(liveUrl);
            }
          } else if (msg.action === 'close_all_overlays') {
            win.webContents.send('close-negotiation-arena');
            win.webContents.send('close-deal-overlay');
          } else if (msg.action === 'open_url') {
            if (msg.url) shell.openExternal(msg.url);
          } else if (msg.action === 'launch_app') {
            exec(`cmd.exe /c start ${msg.command}`, (err) => {
              if (err) console.error('Launch error:', err);
            });
          }
          console.log(`🤖 [OMNI REPLYING]: "${msg.reply}"`);
          win.webContents.send('voice-reply', { reply: msg.reply });
        } else if (msg.event === 'reply') {
          glideWindowToBottomCenter(win);
          console.log(`🤖 [OMNI REPLYING]: "${msg.reply}"`);
          win.webContents.send('voice-reply', { text: msg.text, reply: msg.reply });
        }
      } catch (err) {
        // Not a JSON line, print raw
        console.log(line.trim());
      }
    }
  });

  voiceProcess.stderr?.on('data', (err) => {
    console.error(`[Voice Service Warning]: ${err.toString().trim()}`);
  });

  voiceProcess.on('exit', (code) => {
    console.log(`[Voice Service Exited with code ${code}]`);
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(true);
  });

  session.defaultSession.setPermissionCheckHandler(() => {
    return true;
  });

  mainWindow = createAssistantWindow();

  setupIpcHandlers(mainWindow);
  createTray(mainWindow);
  registerGlobalShortcuts(mainWindow);

  // Start native Python voice and desktop automation service
  startPythonVoiceService(mainWindow);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('🚀 [MAIN WINDOW LOADED]: URL =', mainWindow?.webContents.getURL(), 'Bounds =', mainWindow?.getBounds());
  });

  mainWindow.webContents.on('did-fail-load', (e, code, desc, url) => {
    console.error('❌ [MAIN WINDOW LOAD FAILED]:', code, desc, url);
  });

  mainWindow.webContents.on('console-message', (_e, level, msg, line, src) => {
    console.log(`[RENDERER CONSOLE lvl=${level}]: ${msg} (${src}:${line})`);
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createAssistantWindow();
    }
  });
});

app.on('will-quit', () => {
  if (voiceProcess) {
    voiceProcess.kill();
    voiceProcess = null;
  }
  unregisterGlobalShortcuts();
  destroyTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
