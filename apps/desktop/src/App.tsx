import React, { useEffect, useState } from 'react';
import { AssistantProvider, useAssistant } from './context/AssistantContext';
import { Assistant } from './assistant/Assistant';
import { ContextMenu } from './components/ContextMenu';
import { SettingsModal } from './settings/SettingsModal';
import { DebugPanel } from './debug/DebugPanel';
import { DesktopNegotiationArena } from './assistant/DesktopNegotiationArena';

const AppContent: React.FC = () => {
  const {
    state,
    emotion,
    direction,
    position,
    bounds,
    settings,
    isSettingsOpen,
    isDebugOpen,
    isDealOverlayOpen,
    setDealOverlayOpen,
    isArenaOpen,
    setIsArenaOpen,
    contextMenu,
    setState,
    setEmotion,
    setDirection,
    wake,
    sleep,
    speak,
    updateSettings,
    toggleWandering,
    moveToCenter,
    triggerRandomWander,
    setInteractOpen,
    setSettingsOpen,
    setDebugOpen,
    closeContextMenu,
    activeDealData,
    dealQuery,
    setActiveDealData,
    setDealQuery,
  } = useAssistant();

  const handleExit = () => {
    if (window.electronAPI) {
      window.electronAPI.quitApp?.();
    } else {
      window.close();
    }
  };

  useEffect(() => {
    const unsubArena = window.electronAPI?.onShowNegotiationArena?.((data: any) => {
      wake();
      if (data?.dealData) {
        setActiveDealData(data.dealData);
      }
      if (data?.query) {
        setDealQuery(data.query);
      }
      setIsArenaOpen(true);
      setDealOverlayOpen(false);
    });

    const unsubCloseArena = window.electronAPI?.onCloseNegotiationArena?.(() => {
      setIsArenaOpen(false);
    });

    const unsubCheckout = window.electronAPI?.onExecuteCheckout?.(() => {
      setIsArenaOpen(false);
      setDealOverlayOpen(false);
    });

    const unsubCloseDeal = window.electronAPI?.onCloseDealOverlay?.(() => {
      setDealOverlayOpen(false);
      setActiveDealData(null);
      setState('IDLE', 'Idle');
    });

    return () => {
      unsubArena?.();
      unsubCloseArena?.();
      unsubCloseDeal?.();
      unsubCheckout?.();
    };
  }, [wake, setActiveDealData, setDealQuery, setIsArenaOpen, setDealOverlayOpen, setState]);

  return (
    <main
      id="pet-app-main"
      className="relative w-screen h-screen overflow-hidden select-none bg-transparent flex flex-col justify-end items-center"
    >
      {/* Central Assistant Character */}
      <div className="w-full h-full flex flex-col justify-end items-center">
        <Assistant />
      </div>

      {/* Right-click Context Menu */}
      <div className="app-no-drag">
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          state={state}
          wanderingEnabled={settings.wanderingEnabled}
          name={settings.name}
          accentColor={settings.accentColor || '#00F0FF'}
          onClose={closeContextMenu}
          onWake={wake}
          onSleep={sleep}
          onToggleWander={toggleWandering}
          onMoveToCenter={moveToCenter}
          onOpenInteract={() => setInteractOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenDebug={() => setDebugOpen(true)}
          onOpenArena={() => {
            setIsArenaOpen(true);
            setDealOverlayOpen(false);
          }}
          onSetEmotion={(em) => {
            setEmotion(em);
            setTimeout(() => {
              setEmotion('Idle');
            }, 3500);
          }}
          onExit={handleExit}
        />
      </div>

      {/* Dual-Bot Negotiation Arena */}
      <DesktopNegotiationArena
        isOpen={isArenaOpen}
        productName={activeDealData?.title || dealQuery || 'Single Long-Stem Fresh Dutch Red Rose'}
        listedPrice={activeDealData?.basePrice || 199}
        storeName={activeDealData?.bestStore || 'DealMesh Store'}
        stores={activeDealData?.stores || []}
        userBudget={activeDealData?.user_budget || activeDealData?.userBudget}
        onClose={() => {
          setIsArenaOpen(false);
          setDealOverlayOpen(true);
        }}
        onProceedToCart={(productName, price, store) => {
          setIsArenaOpen(false);
          setDealOverlayOpen(false);
          speak(`Deal sealed! Opening ${store} cart for ${productName} at Rupees ${price.toLocaleString()}...`, 4000, undefined, 'Happy');
          // Open DealMesh Storefront where product inventory and cart are live
          const targetUrl = (activeDealData?.stores?.[0]?.url && activeDealData.stores[0].url.startsWith('http') && !activeDealData.stores[0].url.includes('titan.co.in/product/'))
            ? activeDealData.stores[0].url
            : 'http://localhost:5174/';
          window.electronAPI?.openExternalUrl?.(targetUrl);
        }}
        onExploreOtherStores={() => {
          setIsArenaOpen(false);
          setDealOverlayOpen(true);
          speak("Back to the deals comparison! You can choose any of the other stores.", 4000, undefined, 'Happy');
        }}
        onNegotiationComplete={(finalPrice, savings) => {
          const spoken = `Negotiation complete! The final agreed price is Rupees ${finalPrice.toLocaleString()} saving Rupees ${savings.toLocaleString()}. Would you like to proceed with this deal, or check other deals?`;
          speak(spoken, 6000, undefined, 'Happy');
        }}
      />

      {/* Settings Modal */}
      <div className="app-no-drag">
        <SettingsModal
          isOpen={isSettingsOpen}
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={updateSettings}
        />
      </div>

      {/* Developer Debug Panel */}
      <div className="app-no-drag">
        <DebugPanel
          isOpen={isDebugOpen}
          state={state}
          emotion={emotion}
          direction={direction}
          position={position}
          bounds={bounds}
          alwaysOnTop={settings.alwaysOnTop}
          onClose={() => setDebugOpen(false)}
          onSetState={setState}
          onSetEmotion={setEmotion}
          onSetDirection={setDirection}
          onTriggerWander={triggerRandomWander}
          onSpeak={speak}
        />
      </div>
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <AssistantProvider>
      <AppContent />
    </AssistantProvider>
  );
};

export default App;
