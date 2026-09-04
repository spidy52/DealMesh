import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  setWindowPosition: (x: number, y: number) =>
    ipcRenderer.send('set-window-position', { x, y }),
  setWindowSize: (width: number, height: number, anchor: 'bottom-center' | 'top-left' = 'bottom-center') =>
    ipcRenderer.send('set-window-size', { width, height, anchor }),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  getScreenBounds: () => ipcRenderer.invoke('get-screen-bounds'),
  getAllDisplays: () => ipcRenderer.invoke('get-all-displays'),
  setAlwaysOnTop: (alwaysOnTop: boolean) => ipcRenderer.send('set-always-on-top', alwaysOnTop),
  setAutostart: (enable: boolean) => ipcRenderer.send('set-autostart', enable),
  setIgnoreMouseEvents: (ignore: boolean, forward: boolean = true) =>
    ipcRenderer.send('set-ignore-mouse-events', ignore, forward),
  logToTerminal: (msg: string) => ipcRenderer.send('log-to-terminal', msg),
  openExternalUrl: (url: string) => ipcRenderer.send('open-external-url', url),
  openDealSearch: (query: string) => ipcRenderer.send('open-deal-search', query),
  launchApp: (appCommand: string) => ipcRenderer.send('launch-app', appCommand),
  quitApp: () => ipcRenderer.send('quit-app'),
  
  onShortcutWake: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('shortcut-wake', handler);
    return () => {
      ipcRenderer.removeListener('shortcut-wake', handler);
    };
  },

  onWindowMoved: (callback: (pos: { x: number; y: number }) => void) => {
    const handler = (_event: any, pos: { x: number; y: number }) => callback(pos);
    ipcRenderer.on('window-moved', handler);
    return () => {
      ipcRenderer.removeListener('window-moved', handler);
    };
  },
  
  onTrayAction: (callback: (action: string) => void) => {
    const handler = (_event: any, action: string) => callback(action);
    ipcRenderer.on('tray-action', handler);
    return () => {
      ipcRenderer.removeListener('tray-action', handler);
    };
  },

  onShowDealOverlay: (callback: (data: { query: string; dealData?: any } | string) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('show-deal-overlay', handler);
    return () => {
      ipcRenderer.removeListener('show-deal-overlay', handler);
    };
  },

  onShowNegotiationArena: (callback: (data: { query?: string; dealData?: any }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('show-negotiation-arena', handler);
    return () => {
      ipcRenderer.removeListener('show-negotiation-arena', handler);
    };
  },

  onVoiceStatus: (callback: (status: string) => void) => {
    const handler = (_event: any, status: string) => callback(status);
    ipcRenderer.on('voice-status', handler);
    return () => {
      ipcRenderer.removeListener('voice-status', handler);
    };
  },

  moveToBottomCenter: () => ipcRenderer.send('move-to-bottom-center'),
  moveToDockPosition: (coords?: { xPercent?: number; yPercent?: number }) =>
    ipcRenderer.send('move-to-dock-position', coords),
  setDockPosition: (xPercent: number, yPercent: number) =>
    ipcRenderer.send('set-dock-position', { xPercent, yPercent }),
  getDockPosition: () => ipcRenderer.invoke('get-dock-position'),

  onVoiceWake: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('voice-wake', handler);
    return () => {
      ipcRenderer.removeListener('voice-wake', handler);
    };
  },

  onVoiceHeard: (callback: (text: string) => void) => {
    const handler = (_event: any, text: string) => callback(text);
    ipcRenderer.on('voice-heard', handler);
    return () => {
      ipcRenderer.removeListener('voice-heard', handler);
    };
  },

  onVoiceInterrupted: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('voice-interrupted', handler);
    return () => {
      ipcRenderer.removeListener('voice-interrupted', handler);
    };
  },

  onExecuteCheckout: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('execute-checkout', handler);
    return () => {
      ipcRenderer.removeListener('execute-checkout', handler);
    };
  },

  onCloseNegotiationArena: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('close-negotiation-arena', handler);
    return () => {
      ipcRenderer.removeListener('close-negotiation-arena', handler);
    };
  },

  onCloseDealOverlay: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('close-deal-overlay', handler);
    return () => {
      ipcRenderer.removeListener('close-deal-overlay', handler);
    };
  },
});
