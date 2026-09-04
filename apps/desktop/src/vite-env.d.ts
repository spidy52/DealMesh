/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    setWindowPosition: (x: number, y: number) => void;
    setWindowSize: (width: number, height: number, anchor?: 'bottom-center' | 'top-left') => void;
    getWindowPosition: () => Promise<{ x: number; y: number }>;
    getScreenBounds: () => Promise<{ x: number; y: number; width: number; height: number }>;
    getAllDisplays: () => Promise<Array<{ id: number; bounds: any; workArea: any; scaleFactor: number; isPrimary: boolean }>>;
    setAlwaysOnTop: (alwaysOnTop: boolean) => void;
    setAutostart: (enable: boolean) => void;
    setIgnoreMouseEvents?: (ignore: boolean, forward?: boolean) => void;
    logToTerminal?: (msg: string) => void;
    openExternalUrl?: (url: string) => void;
    openDealSearch?: (query: string) => void;
    launchApp?: (appCommand: string) => void;
    sendStateUpdate?: (data: { state: string; clickThroughWhileSleeping: boolean }) => void;
    quitApp: () => void;
    onShortcutWake: (callback: () => void) => () => void;
    onWindowMoved: (callback: (pos: { x: number; y: number }) => void) => () => void;
    onTrayAction: (callback: (action: string) => void) => () => void;
    onShowDealOverlay?: (callback: (data: { query: string; dealData?: any } | string) => void) => () => void;
    onShowNegotiationArena?: (callback: (data: any) => void) => () => void;
    onVoiceStatus?: (callback: (status: string) => void) => () => void;
    onExecuteCheckout?: (callback: () => void) => () => void;
    onCloseNegotiationArena?: (callback: () => void) => () => void;
    onCloseDealOverlay?: (callback: () => void) => () => void;
    moveToBottomCenter?: () => void;
    moveToDockPosition?: (coords?: { xPercent?: number; yPercent?: number }) => void;
    setDockPosition?: (xPercent: number, yPercent: number) => void;
    getDockPosition?: () => Promise<{ xPercent: number; yPercent: number }>;
    onVoiceWake?: (callback: () => void) => () => void;
    onVoiceHeard?: (callback: (text: string) => void) => () => void;
    onVoiceInterrupted?: (callback: () => void) => () => void;
  };
}
