import React, { useRef } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { AssistantAnimation } from './AssistantAnimation';
import { MiniInteractionPanel } from './MiniInteractionPanel';
import { DealComparisonOverlay } from './DealComparisonOverlay';
import { speechToSpeech } from '../voice/SpeechToSpeechService';

export const Assistant: React.FC = () => {
  const {
    state,
    emotion,
    direction,
    isMoving,
    position,
    settings,
    isInteractOpen,
    isDealOverlayOpen,
    setDealOverlayOpen,
    dealQuery,
    setDealQuery,
    activeDealData,
    setActiveDealData,
    poke,
    wake,
    sleep,
    speak,
    startDragging,
    stopDragging,
    syncPositionAfterDrag,
    setInteractOpen,
    setSettingsOpen,
    setDebugOpen,
    setIsArenaOpen,
    openContextMenu,
  } = useAssistant();

  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 });
  const hasMovedRef = useRef(false);

  const enableInteractivity = () => {
    window.electronAPI?.setIgnoreMouseEvents?.(false);
  };

  const disableInteractivity = () => {
    if (!isDraggingRef.current && !isInteractOpen) {
      window.electronAPI?.setIgnoreMouseEvents?.(true, true);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click drags
    enableInteractivity();
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startPosRef.current = {
      mouseX: e.screenX,
      mouseY: e.screenY,
      winX: position.x,
      winY: position.y,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    startDragging();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.screenX - startPosRef.current.mouseX;
    const dy = e.screenY - startPosRef.current.mouseY;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      hasMovedRef.current = true;
      const newX = Math.round(startPosRef.current.winX + dx);
      const newY = Math.round(startPosRef.current.winY + dy);
      if (window.electronAPI?.setWindowPosition) {
        window.electronAPI.setWindowPosition(newX, newY);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    stopDragging();
    syncPositionAfterDrag();

    // If tapped without dragging -> Wake or Poke!
    if (!hasMovedRef.current) {
      if (state === 'SLEEPING') {
        wake();
        speak("I'm awake and ready to help! What deals can I find?", 3000, undefined, 'Happy');
      } else {
        poke();
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    enableInteractivity();
    if (state === 'SLEEPING') {
      wake();
    }
    setInteractOpen(!isInteractOpen);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    enableInteractivity();
    openContextMenu(e.clientX, e.clientY);
  };

  const handleUserMessage = (text: string) => {
    speechToSpeech.handleUserSpeechFast(text);
  };

  return (
    <div
      className="relative flex flex-col items-center justify-end w-full h-full select-none pb-1"
      onMouseEnter={enableInteractivity}
      onMouseLeave={disableInteractivity}
    >
      {/* Autonomous Multi-Platform Deal Comparison HUD */}
      <div className="app-no-drag mb-1 z-30" onMouseEnter={enableInteractivity}>
        <DealComparisonOverlay
          isOpen={isDealOverlayOpen}
          searchQuery={dealQuery}
          dealData={activeDealData}
          onClose={() => {
            setDealOverlayOpen(false);
            setActiveDealData(null);
            disableInteractivity();
            // Inform backend that this deal session is closed & returned to normal state
            fetch('http://localhost:8000/api/voice/close-deal-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: 'USER_CLOSED_POPUP', deal_query: dealQuery }),
            }).catch(() => {});
          }}
          onOpenArena={() => {
            setIsArenaOpen(true);
            setDealOverlayOpen(false);
          }}
          on1ClickCheckout={(productName, price, store) => {
            speak(`Placing 1-click order for ${productName} on ${store} at Rupees ${price.toLocaleString()}!`, 4000, undefined, 'Happy');
          }}
        />
      </div>

      {/* Mini Interaction Panel (Only when explicitly opened via double click or menu) */}
      <div className="app-no-drag" onMouseEnter={enableInteractivity}>
        <MiniInteractionPanel
          isOpen={isInteractOpen}
          name={settings.name}
          accentColor={settings.accentColor || '#00F0FF'}
          state={state}
          onClose={() => {
            setInteractOpen(false);
            disableInteractivity();
          }}
          onSendMessage={handleUserMessage}
          onToggleVoice={() => {
            speak("Listening to your voice...", 4000, undefined, 'Touched');
          }}
          onSleep={() => {
            sleep();
            setInteractOpen(false);
            disableInteractivity();
          }}
          onOpenSettings={() => {
            setSettingsOpen(true);
            setInteractOpen(false);
          }}
          onOpenDebug={() => {
            setDebugOpen(true);
            setInteractOpen(false);
          }}
        />
      </div>

      {/* Omni Character Sprite (Pure Visual Companion, Talks through Speakers) */}
      <div
        onMouseEnter={enableInteractivity}
        onMouseLeave={disableInteractivity}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className="cursor-grab active:cursor-grabbing transition-transform active:scale-95 touch-none"
      >
        <AssistantAnimation
          emotion={emotion}
          direction={direction}
          state={state}
          scale={settings.scale}
          isMoving={isMoving}
          reduceMotion={settings.reduceMotion}
          accentColor={settings.accentColor || '#00F0FF'}
        />
      </div>
    </div>
  );
};
