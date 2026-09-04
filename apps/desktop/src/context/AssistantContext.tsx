import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  AssistantSettings,
  AssistantState,
  Direction,
  EmotionType,
  Position,
  ScreenBounds,
  SpeechMessage,
} from '../types/assistant';
import { AssistantStateMachine } from '../assistant/AssistantStateMachine';
import { AssistantMovement } from '../assistant/AssistantMovement';
import { eventBus } from '../events/AssistantEventBus';
import { speechToSpeech } from '../voice/SpeechToSpeechService';
import { wsClient } from '../websocket/WebSocketClient';

interface AssistantContextType {
  state: AssistantState;
  emotion: EmotionType;
  direction: Direction;
  position: Position;
  bounds: ScreenBounds;
  isMoving: boolean;
  settings: AssistantSettings;
  speechMessage: SpeechMessage | null;
  isInteractOpen: boolean;
  isSettingsOpen: boolean;
  isDebugOpen: boolean;
  contextMenu: { isOpen: boolean; position: { x: number; y: number } };
  
  // Actions
  setState: (state: AssistantState, emotion?: EmotionType) => void;
  setEmotion: (emotion: EmotionType) => void;
  setDirection: (direction: Direction) => void;
  wake: () => void;
  sleep: () => void;
  poke: () => void;
  startDragging: () => void;
  stopDragging: () => void;
  syncPositionAfterDrag: () => void;
  speak: (text: string, durationMs?: number, quickReplies?: Array<{ label: string; action: string }>, emotion?: EmotionType) => void;
  dismissSpeech: () => void;
  updateSettings: (newSettings: AssistantSettings) => void;
  toggleWandering: () => void;
  moveToCenter: () => void;
  triggerRandomWander: () => void;
  
  // Modals & Panels
  setInteractOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setDebugOpen: (open: boolean) => void;
  isDealOverlayOpen: boolean;
  setDealOverlayOpen: (open: boolean) => void;
  isArenaOpen: boolean;
  setIsArenaOpen: (open: boolean) => void;
  dealQuery: string;
  setDealQuery: (q: string) => void;
  activeDealData: any;
  setActiveDealData: (d: any) => void;
  openContextMenu: (x: number, y: number) => void;
  closeContextMenu: () => void;
}

const DEFAULT_SETTINGS: AssistantSettings = {
  name: 'Omi',
  scale: 2,
  personality: 'friendly',
  alwaysOnTop: true,
  startWithWindows: true,
  wanderingEnabled: true, // Free-roaming cute companion on desktop
  wanderingInterval: 5,
  walkSpeed: 90,
  clickThroughWhileSleeping: false,
  reduceMotion: false,
  soundEnabled: true,
};

const AssistantContext = createContext<AssistantContextType | null>(null);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AssistantSettings>(() => {
    const saved = localStorage.getItem('omi_assistant_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_SETTINGS;
  });

  const [state, setStateInternal] = useState<AssistantState>('IDLE');
  const [emotion, setEmotionInternal] = useState<EmotionType>('Idle');
  const [direction, setDirectionInternal] = useState<Direction>('south');
  const [position, setPositionInternal] = useState<Position>({ x: 400, y: 400 });
  const [bounds, setBoundsInternal] = useState<ScreenBounds>({ x: 0, y: 0, width: 1920, height: 1080 });
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [speechMessage, setSpeechMessage] = useState<SpeechMessage | null>(null);

  const [isInteractOpen, setInteractOpen] = useState<boolean>(false);
  const [isSettingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [isDebugOpen, setDebugOpen] = useState<boolean>(false);
  const [isDealOverlayOpen, setDealOverlayOpen] = useState<boolean>(false);
  const [isArenaOpen, setIsArenaOpen] = useState<boolean>(false);
  const [dealQuery, setDealQuery] = useState<string>('watches');
  const [activeDealData, setActiveDealData] = useState<any>(null);
  const [dockPosition, setDockPosition] = useState<{ xPercent: number; yPercent: number }>({
    xPercent: 0.50,
    yPercent: 0.80,
  });

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  const stateMachineRef = useRef<AssistantStateMachine | null>(null);
  const movementRef = useRef<AssistantMovement | null>(null);

  // Helper to dynamically adjust window size (snug vs expanded)
  const isExpanded = isInteractOpen || isSettingsOpen || isDebugOpen || isDealOverlayOpen || isArenaOpen || contextMenu.isOpen || speechMessage !== null;

  useEffect(() => {
    if (window.electronAPI?.setWindowSize) {
      if (isArenaOpen) {
        window.electronAPI.setWindowSize(760, 540, 'bottom-center');
      } else if (isSettingsOpen || isDebugOpen) {
        window.electronAPI.setWindowSize(460, 480, 'bottom-center');
      } else if (isDealOverlayOpen) {
        window.electronAPI.setWindowSize(760, 540, 'bottom-center');
      } else if (isInteractOpen || contextMenu.isOpen) {
        window.electronAPI.setWindowSize(350, 480, 'bottom-center');
      } else if (speechMessage !== null) {
        window.electronAPI.setWindowSize(260, 200, 'bottom-center');
      } else {
        const snugSize = Math.max(160, Math.round(150 * settings.scale));
        window.electronAPI.setWindowSize(snugSize, snugSize, 'bottom-center');
      }
    }
  }, [isExpanded, isInteractOpen, isSettingsOpen, isDebugOpen, isDealOverlayOpen, isArenaOpen, contextMenu.isOpen, speechMessage, settings.scale]);

  // Initialize State Machine & Movement Engine
  useEffect(() => {
    const sm = new AssistantStateMachine();
    stateMachineRef.current = sm;

    sm.subscribe((_from, to, emo) => {
      setStateInternal(to);
      setEmotionInternal(emo);

      if (to === 'SLEEPING') {
        movementRef.current?.stop();
        speechToSpeech.isSleeping = true;
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } else {
        speechToSpeech.isSleeping = false;
      }

      if (window.electronAPI) {
        window.electronAPI.sendStateUpdate?.({
          state: to,
          clickThroughWhileSleeping: settings.clickThroughWhileSleeping,
        });
      }
    });

    const mov = new AssistantMovement(
      { x: 400, y: 400 },
      bounds,
      (newPos, newDir, moving) => {
        setPositionInternal(newPos);
        setDirectionInternal(newDir);
        setIsMoving(moving);

        if (window.electronAPI) {
          window.electronAPI.setWindowPosition?.(newPos.x, newPos.y);
        }
      }
    );
    movementRef.current = mov;
    mov.setScale(settings.scale);
    mov.setWanderingEnabled(settings.wanderingEnabled);
    mov.setSpeed(settings.walkSpeed);

    return () => {
      sm.destroy();
      mov.destroy();
    };
  }, []);

  // Sync settings changes
  useEffect(() => {
    localStorage.setItem('omi_assistant_settings', JSON.stringify(settings));

    if (movementRef.current) {
      movementRef.current.setScale(settings.scale);
      movementRef.current.setWanderingEnabled(settings.wanderingEnabled);
      movementRef.current.setSpeed(settings.walkSpeed);
      movementRef.current.setWanderingInterval(settings.wanderingInterval);
    }

    if (window.electronAPI) {
      window.electronAPI.setAlwaysOnTop?.(settings.alwaysOnTop);
      window.electronAPI.setAutostart?.(settings.startWithWindows);
    }
  }, [settings]);

  // Handle display bounds and electron events
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getScreenBounds?.().then((screenBounds: ScreenBounds) => {
        if (screenBounds) {
          setBoundsInternal(screenBounds);
          movementRef.current?.setBounds(screenBounds);
        }
      });

      window.electronAPI.getWindowPosition?.().then((winPos) => {
        if (winPos) {
          setPositionInternal(winPos);
          movementRef.current?.setPosition(winPos);
        }
      });

      // When user manually drags the window natively, sync position
      const unsubMoved = window.electronAPI.onWindowMoved?.((newPos) => {
        if (!movementRef.current?.getIsMoving()) {
          setPositionInternal(newPos);
          movementRef.current?.setPosition(newPos);
        }
      });

      const unsubShortcut = window.electronAPI.onShortcutWake?.(() => {
        wake();
        setInteractOpen(true);
      });

      const unsubDeal = window.electronAPI.onShowDealOverlay?.((data: any) => {
        wake();
        const q = typeof data === 'string' ? data : data?.query || 'deals';
        const d = typeof data === 'object' ? data?.dealData : null;
        setDealQuery(q);
        setActiveDealData(d || null);
        setDealOverlayOpen(true);
      });

      const unsubVoiceStatus = window.electronAPI.onVoiceStatus?.((status: string) => {
        if (status === 'LISTENING') {
          movementRef.current?.stop();
          setState('LISTENING', 'Listening');
        } else {
          if (stateMachineRef.current?.getState() === 'LISTENING') {
            setState('IDLE', 'Idle');
          }
        }
      });

      const unsubVoiceWake = window.electronAPI.onVoiceWake?.(() => {
        wake();
      });

      const unsubVoiceHeard = window.electronAPI.onVoiceHeard?.(() => {
        wake();
      });

      const unsubTray = window.electronAPI.onTrayAction?.((action: string) => {
        switch (action) {
          case 'wake':
            wake();
            break;
          case 'sleep':
            sleep();
            break;
          case 'toggle-wander':
            toggleWandering();
            break;
          case 'center':
            moveToCenter();
            break;
          case 'settings':
            setSettingsOpen(true);
            break;
          case 'debug':
            setDebugOpen(true);
            break;
        }
      });

      return () => {
        unsubMoved?.();
        unsubShortcut?.();
        unsubDeal?.();
        unsubVoiceStatus?.();
        unsubVoiceWake?.();
        unsubVoiceHeard?.();
        unsubTray?.();
      };
    }
  }, [settings.wanderingEnabled]);

  // Subscribe to EventBus
  useEffect(() => {
    const unsub = eventBus.onEvent('*', (event) => {
      if (event.type === 'assistant.wake') {
        wake();
      } else if (event.type === 'assistant.sleep') {
        sleep();
      } else if (event.type === 'assistant.deal_found') {
        setDirectionInternal('south');
        stateMachineRef.current?.transition('SUCCESS', 'StarStruck');
        if (event.payload) {
          setDealQuery(event.payload.query || 'deals');
          setActiveDealData(event.payload.dealData || event.payload);
          setDealOverlayOpen(true);
        }
      } else if (event.type === 'assistant.open_arena') {
        setDirectionInternal('south');
        stateMachineRef.current?.transition('INTERACTING', 'StarStruck');
        if (event.payload) {
          if (event.payload.query) {
            setDealQuery(event.payload.query);
          }
          if (event.payload.dealData) {
            setActiveDealData(event.payload.dealData);
          }
        }
        setIsArenaOpen(true);
        setDealOverlayOpen(false);
      } else if (event.type === 'assistant.approval_required') {
        setDirectionInternal('south');
        stateMachineRef.current?.transition('INTERACTING', 'Pleading');
      } else if (event.type === 'assistant.payment_started') {
        stateMachineRef.current?.transition('WORKING', 'Tapping');
      } else if (event.type === 'assistant.payment_failed') {
        setDirectionInternal('south');
        stateMachineRef.current?.transition('ERROR', 'Frustrated');
      }
    });

    return () => unsub();
  }, []);

  const setState = (newState: AssistantState, customEmotion?: EmotionType) => {
    stateMachineRef.current?.transition(newState, customEmotion);
  };

  const setEmotion = (emo: EmotionType) => {
    stateMachineRef.current?.setEmotion(emo);
  };

  const setDirection = (dir: Direction) => {
    setDirectionInternal(dir);
    movementRef.current?.setDirection(dir);
  };

  // Fetch fixed dock position and custom accent color on initial startup, and sync via WebSocket + Fast Polling Fallback
  useEffect(() => {
    let lastColor = '';
    const fetchCurrentSettings = async () => {
      try {
        const [dockRes, settingsRes] = await Promise.allSettled([
          fetch('http://127.0.0.1:8000/api/pet/dock-position'),
          fetch('http://127.0.0.1:8000/api/buyer/settings?user_id=user_buyer_default'),
        ]);

        if (dockRes.status === 'fulfilled' && dockRes.value.ok) {
          const data = await dockRes.value.json();
          if (data?.dock) {
            const newPos = { xPercent: data.dock.x_percent, yPercent: data.dock.y_percent };
            setDockPosition(newPos);
            window.electronAPI?.setDockPosition?.(newPos.xPercent, newPos.yPercent);
          }
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
          const sData = await settingsRes.value.json();
          if (sData?.accent_color) {
            lastColor = sData.accent_color;
            setSettings((prev) => (prev.accentColor === sData.accent_color ? prev : { ...prev, accentColor: sData.accent_color }));
          }
        }
      } catch (e) {
        // quiet fallback
      }
    };
    fetchCurrentSettings();

    // 1. Real-time synchronization when user customizes color or position in browser
    const unsubSettings = wsClient.on('pet.settings_updated', (data: any) => {
      if (data?.accent_color) {
        lastColor = data.accent_color;
        setSettings((prev) => ({ ...prev, accentColor: data.accent_color }));
      }
    });

    const unsubDock = wsClient.on('pet.dock_updated', (data: any) => {
      if (data?.x_percent !== undefined && data?.y_percent !== undefined) {
        const newPos = { xPercent: data.x_percent, yPercent: data.y_percent };
        setDockPosition(newPos);
        window.electronAPI?.setDockPosition?.(newPos.xPercent, newPos.yPercent);
      }
    });

    // 2. High-speed 1.2s fallback interval ensuring updates reflect instantly even if a WS packet is missed
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/buyer/settings?user_id=user_buyer_default');
        if (res.ok) {
          const s = await res.json();
          if (s?.accent_color && s.accent_color !== lastColor) {
            lastColor = s.accent_color;
            setSettings((prev) => ({ ...prev, accentColor: s.accent_color }));
          }
        }
      } catch {}
    }, 1200);

    return () => {
      unsubSettings();
      unsubDock();
      clearInterval(pollInterval);
    };
  }, []);

  const inactivityTimerRef = useRef<any>(null);

  const sleep = useCallback(() => {
    // Stop roaming when sleeping
    movementRef.current?.setWanderingEnabled(false);
    movementRef.current?.stop();

    // Glide smoothly to the fixed custom dock position
    if (window.electronAPI?.moveToDockPosition) {
      window.electronAPI.moveToDockPosition();
    } else if (window.electronAPI?.moveToBottomCenter) {
      window.electronAPI.moveToBottomCenter();
    }

    setDirectionInternal('south');
    movementRef.current?.setDirection('south');
    stateMachineRef.current?.sleep();
    speechToSpeech.isSleeping = true;
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Exactly 2 Minutes (120,000 ms) of roaming with no messages -> glide to fixed dock & sleep
    inactivityTimerRef.current = setTimeout(() => {
      console.log('💤 [OMNI SLEEP]: 2 minutes of roaming complete with no messages, returning to fixed dock.');
      sleep();
    }, 120_000);
  }, [sleep]);

  const wake = useCallback(() => {
    setDirectionInternal('south');
    movementRef.current?.setDirection('south');
    stateMachineRef.current?.wake();
    speechToSpeech.isSleeping = false;
    speechToSpeech.startListening();
    resetInactivityTimer();

    // Re-enable roaming across the desktop when awake
    movementRef.current?.setWanderingEnabled(true);
    setTimeout(() => {
      movementRef.current?.scheduleNextWander();
    }, 1500);
  }, [resetInactivityTimer]);

  // Wire Speech-to-Speech Continuous Engine
  useEffect(() => {
    speechToSpeech.setStatusListener((status, _text) => {
      if (status === 'HEARING' || status === 'LISTENING') {
        resetInactivityTimer();
        // Pause movement while listening to user
        movementRef.current?.stop();
        stateMachineRef.current?.transition('WORKING', 'Listening');
      } else if (status === 'THINKING') {
        resetInactivityTimer();
        stateMachineRef.current?.transition('WORKING', 'Thinking');
      } else if (status === 'SPEAKING') {
        resetInactivityTimer();
        stateMachineRef.current?.transition('INTERACTING', 'Happy');
      } else if (status === 'IDLE') {
        stateMachineRef.current?.transition('IDLE', 'Idle');
        // If awake and wandering enabled, continue roaming
        if (stateMachineRef.current?.getState() !== 'SLEEPING') {
          movementRef.current?.scheduleNextWander();
        }
      }
    });

    // Full-Duplex Interruption Listener: stop speech immediately when user talks
    const unsubInterrupted = window.electronAPI?.onVoiceInterrupted?.(() => {
      console.log('🛑 [BARGE-IN]: Interrupted Omni speech by user audio!');
      speechToSpeech.stopSpeaking();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stateMachineRef.current?.transition('WORKING', 'Listening');
      resetInactivityTimer();
    });

    speechToSpeech.onWakeTrigger = () => {
      wake();
    };

    speechToSpeech.startListening();
    resetInactivityTimer();

    return () => {
      speechToSpeech.stopListening();
      unsubInterrupted?.();
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [wake, resetInactivityTimer]);

  const pokeCountRef = useRef(0);
  const poke = useCallback(() => {
    resetInactivityTimer();
    setDirectionInternal('south');
    movementRef.current?.setDirection('south');
    stateMachineRef.current?.poke();

    pokeCountRef.current = (pokeCountRef.current + 1) % 6;
    const pokeReplies = [
      "Omni is locked on to savings!",
      "Looking sharp! All systems ready.",
      "Always on duty for you!",
      "Aww, glad to help!",
      "Found top deals today!",
      "Hey! Careful with the titanium armor!",
    ];
    const reply = pokeReplies[pokeCountRef.current];
    speechToSpeech.speakReply(reply);
  }, [resetInactivityTimer]);

  const startDragging = useCallback(() => {
    resetInactivityTimer();
    stateMachineRef.current?.startDragging();
    movementRef.current?.stop();
  }, [resetInactivityTimer]);

  const stopDragging = useCallback(() => {
    stateMachineRef.current?.stopDragging();
  }, []);

  const syncPositionAfterDrag = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.getWindowPosition?.().then((winPos) => {
        if (winPos) {
          setPositionInternal(winPos);
          movementRef.current?.setPosition(winPos);
        }
      });
      window.electronAPI.getScreenBounds?.().then((screenBounds) => {
        if (screenBounds) {
          setBoundsInternal(screenBounds);
          movementRef.current?.setBounds(screenBounds);
        }
      });
    }
  }, []);

  const speak = (
    text: string,
    durationMs: number = 4000,
    quickReplies?: Array<{ label: string; action: string }>,
    emotion?: EmotionType
  ) => {
    setDirectionInternal('south');
    movementRef.current?.setDirection('south');
    if (emotion) {
      setEmotion(emotion);
    }
    // Pure voice speech aloud via speakers
    speechToSpeech.speakReply(text);
  };

  const dismissSpeech = () => {
    setSpeechMessage(null);
  };

  const updateSettings = (newSettings: AssistantSettings) => {
    setSettings(newSettings);
  };

  const toggleWandering = () => {
    setSettings((prev) => ({ ...prev, wanderingEnabled: !prev.wanderingEnabled }));
  };

  const moveToCenter = () => {
    const snugSize = Math.round(72 * settings.scale + 16);
    const centerWinX = bounds.x + (bounds.width / 2) - (snugSize / 2);
    const centerWinY = bounds.y + (bounds.height / 2) - (snugSize / 2);
    movementRef.current?.moveTo({ x: centerWinX, y: centerWinY });
  };

  const triggerRandomWander = () => {
    movementRef.current?.wanderRandomly();
  };

  const openContextMenu = (x: number, y: number) => {
    setContextMenu({ isOpen: true, position: { x, y } });
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AssistantContext.Provider
      value={{
        state,
        emotion,
        direction,
        position,
        bounds,
        isMoving,
        settings,
        speechMessage,
        isInteractOpen,
        isSettingsOpen,
        isDebugOpen,
        isDealOverlayOpen,
        setDealOverlayOpen,
        isArenaOpen,
        setIsArenaOpen,
        dealQuery,
        setDealQuery,
        activeDealData,
        setActiveDealData,
        contextMenu,
        setState,
        setEmotion,
        setDirection,
        wake,
        sleep,
        poke,
        startDragging,
        stopDragging,
        syncPositionAfterDrag,
        speak,
        dismissSpeech,
        updateSettings,
        toggleWandering,
        moveToCenter,
        triggerRandomWander,
        setInteractOpen,
        setSettingsOpen,
        setDebugOpen,
        openContextMenu,
        closeContextMenu,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
};
