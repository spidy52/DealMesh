import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelPet, PetEmotion } from './PixelPet';
import { EyeBeamGhostHologram } from '../Hologram/EyeBeamGhostHologram';
import { PetData, RankedProductData, api } from '../../services/api';
import { wsClient } from '../../services/websocket';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface FreeRoamingPetProps {
  pet: PetData;
  onPetUpdate: (pet: PetData) => void;
  onVoiceTrigger: () => void;
  onOpenPolicy: () => void;
  isHologramActive: boolean;
  onToggleHologram: () => void;
  isVoiceListening?: boolean;
  products?: RankedProductData[];
  onStartNegotiation?: (product: RankedProductData) => void;
  onProceedToBuy?: (product: RankedProductData) => void;
  accentColor?: string;
  dockCoords?: { xPercent: number; yPercent: number };
}

export const FreeRoamingPet: React.FC<FreeRoamingPetProps> = ({
  pet,
  onPetUpdate,
  onVoiceTrigger,
  onOpenPolicy,
  isHologramActive,
  onToggleHologram,
  isVoiceListening = false,
  products = [],
  onStartNegotiation,
  onProceedToBuy,
  accentColor = '#00F0FF',
  dockCoords,
}) => {
  const [emotion, setEmotion] = useState<PetEmotion>('SLEEPY');
  const [speechBubble, setSpeechBubble] = useState<string>('Zzz...');
  const [isAngry, setIsAngry] = useState(false);
  const [isCute, setIsCute] = useState(false);
  const { speak } = useSpeechSynthesis();

  // Map state to emotion & speech
  useEffect(() => {
    if (isAngry) {
      setEmotion('ANGRY');
      return;
    }
    if (isCute) {
      setEmotion('CUTE');
      return;
    }
    if (isVoiceListening) {
      setEmotion('CURIOUS');
      setSpeechBubble('Listening...');
      return;
    }

    switch (pet.state) {
      case 'SLEEPING':
        setEmotion('SLEEPY');
        setSpeechBubble('Zzz...');
        break;
      case 'LISTENING':
        setEmotion('CURIOUS');
        setSpeechBubble('Listening...');
        break;
      case 'SEARCHING':
        setEmotion('THINKING');
        setSpeechBubble('Scanning 12 stores...');
        break;
      case 'NEGOTIATING':
        setEmotion('EXCITED');
        setSpeechBubble('Negotiating price...');
        break;
      case 'COMPLETED':
        setEmotion('DEAL_LOCKED');
        setSpeechBubble('Deal locked! 📜');
        break;
      default:
        setEmotion('HAPPY');
        setSpeechBubble('Say Hey Omni');
    }
  }, [pet.state, isVoiceListening, isAngry, isCute]);

  // Sync WebSocket state
  useEffect(() => {
    const unsubState = wsClient.on('pet.state_changed', (data: any) => {
      onPetUpdate({ ...pet, state: data.state, current_thought: data.current_thought || pet.current_thought });
    });
    const unsubSearch = wsClient.on('search.started', () => {
      onPetUpdate({ ...pet, state: 'SEARCHING', current_thought: 'Projecting 12-store scan...' });
      setSpeechBubble('Projecting scan!');
    });
    const unsubNegot = wsClient.on('negotiation.started', () => {
      onPetUpdate({ ...pet, state: 'NEGOTIATING', current_thought: 'Negotiating via DMCP...' });
      setSpeechBubble('Negotiating...');
    });
    const unsubSuccess = wsClient.on('payment.succeeded', () => {
      onPetUpdate({ ...pet, state: 'COMPLETED', current_thought: 'Passport verified!' });
      setSpeechBubble('Deal locked! ✨');
    });

    return () => {
      unsubState();
      unsubSearch();
      unsubNegot();
      unsubSuccess();
    };
  }, [pet, onPetUpdate]);

  // Handle Drag Start (Unconstrained movement anywhere across screen)
  const handleDragStart = () => {
    setIsCute(true);
    setEmotion('CUTE');
    setSpeechBubble('Listening to you...');
    speak("I'm awake and listening. What deals can I find for you?");

    onPetUpdate({ ...pet, state: 'LISTENING', current_thought: 'Listening to your command...' });
    onVoiceTrigger();

    setTimeout(() => {
      setIsCute(false);
    }, 4500);
  };

  // Handle Click / Poke
  const handleClick = () => {
    if (pet.state === 'SLEEPING') {
      setIsAngry(true);
      setEmotion('ANGRY');
      const angryLines = [
        'Hey! What do you want now?!',
        'I was charging! What deal do you need?!',
        'Do not poke me! Say Hey Omni if you want a search!',
      ];
      const picked = angryLines[Math.floor(Math.random() * angryLines.length)];
      setSpeechBubble(picked);
      speak(picked);

      setTimeout(() => {
        setIsAngry(false);
        setEmotion('HAPPY');
        setSpeechBubble('Say Hey Omni');
      }, 4500);
    } else {
      handleDragStart();
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={false} // 100% UNCONSTRAINED DRAG ANYWHERE ON SCREEN
      dragElastic={0}
      onDragStart={handleDragStart}
      whileDrag={{ scale: 1.25, cursor: 'grabbing', zIndex: 9999 }}
      className="fixed bottom-12 right-12 z-50 flex flex-col items-center select-none cursor-grab pointer-events-auto"
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* 1. EYE-BEAM GHOST HOLOGRAM WINDOW (Appears directly above pet on-demand) */}
      <AnimatePresence>
        {isHologramActive && products.length > 0 && (
          <EyeBeamGhostHologram
            isOpen={isHologramActive}
            onClose={onToggleHologram}
            products={products}
            onStartNegotiation={onStartNegotiation || (() => {})}
            onProceedToBuy={onProceedToBuy || (() => {})}
          />
        )}
      </AnimatePresence>

      {/* 2. 3D VOXEL PIXEL PET CHARACTER WITH CUTE & ANGER EMOTIONS */}
      <motion.div
        animate={{
          y: pet.state === 'SLEEPING' && !isVoiceListening ? [0, 2, 0] : [0, -8, 0],
          rotate: isAngry ? [-4, 4, -4] : isVoiceListening ? [-2, 2, -2] : [0, 1.5, -1.5, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: isAngry ? 0.35 : pet.state === 'SLEEPING' && !isVoiceListening ? 3.5 : 2.2,
          ease: 'easeInOut',
        }}
        className="relative flex flex-col items-center"
        onClick={handleClick}
      >
        <PixelPet
          emotion={emotion}
          state={isVoiceListening ? 'LISTENING' : pet.state}
          speechText={isVoiceListening ? 'Listening...' : speechBubble}
          isAngry={isAngry}
          isCute={isCute}
          size="md"
          accentColor={accentColor}
        />
      </motion.div>
    </motion.div>
  );
};
