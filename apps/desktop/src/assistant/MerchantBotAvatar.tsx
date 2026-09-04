import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MerchantBotAvatarProps {
  scale?: number;
  isTalking?: boolean;
  isHandshaking?: boolean;
  storeName?: string;
}

export const MerchantBotAvatar: React.FC<MerchantBotAvatarProps> = ({
  scale = 1.3,
  isTalking = false,
  isHandshaking = false,
  storeName = 'DealMesh Store',
}) => {
  const [blink, setBlink] = useState(false);
  const [gaze, setGaze] = useState<'CENTER' | 'LEFT'>('LEFT'); // Naturally gazes toward Omni on the left

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3200);

    const gazeInterval = setInterval(() => {
      setGaze((prev) => (prev === 'LEFT' ? 'CENTER' : 'LEFT'));
    }, 4500);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(gazeInterval);
    };
  }, []);

  // TitanBot faces west (towards Omni on the left)
  const headOffsetX = -2;
  const visorOffsetX = -3;

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none pointer-events-none"
      style={{
        width: `${96 * scale}px`,
        height: `${96 * scale}px`,
      }}
    >
      {/* 1. Volumetric Merchant Soundwave Aura (When Talking) */}
      {isTalking && (
        <>
          <div
            className="absolute inset-0 rounded-full pointer-events-none transition-all duration-300"
            style={{
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.6) 0%, rgba(217, 119, 6, 0.25) 55%, rgba(0, 0, 0, 0) 80%)',
              filter: 'blur(10px)',
              transform: 'scale(1.2)',
            }}
          />
          <motion.div
            animate={{ scale: [0.95, 1.28, 0.95], opacity: [0.9, 0.25, 0.9] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-2 rounded-full border border-amber-400 pointer-events-none shadow-[0_0_24px_#F59E0B]"
          />
        </>
      )}

      {/* 2. Floating Chibi Voxel Pet Body (Elegant Obsidian & Sovereign Gold Palette) */}
      <motion.div
        className="relative z-10 flex items-center justify-center filter drop-shadow-[0_6px_20px_rgba(245,158,11,0.45)]"
        animate={{
          y: isTalking ? [0, -5, 0] : [0, -3.5, 0],
          rotate: isTalking ? [0, -1.5, 1.5, 0] : isHandshaking ? [0, -2, 0] : [0, -0.8, 0.8, 0],
        }}
        transition={{
          duration: isTalking ? 0.7 : 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: `${84 * scale}px`,
          height: `${84 * scale}px`,
        }}
      >
        <svg
          viewBox="0 0 76 76"
          className="w-full h-full [image-rendering:pixelated]"
        >
          <g transform="translate(6, 4)">
            {/* Elegant Sovereign Gold Horns / Cyber Ears */}
            <polygon points={`${13 + headOffsetX},9 ${21 + headOffsetX},2 ${25 + headOffsetX},10`} fill="#F59E0B" />
            <polygon points={`${15 + headOffsetX},8 ${21 + headOffsetX},4 ${24 + headOffsetX},9`} fill="#FBBF24" />
            <polygon points={`${51 + headOffsetX},9 ${43 + headOffsetX},2 ${39 + headOffsetX},10`} fill="#D97706" />
            <polygon points={`${49 + headOffsetX},8 ${43 + headOffsetX},4 ${40 + headOffsetX},9`} fill="#F59E0B" />

            {/* 3D Head Dome (Obsidian Black & Deep Slate Armor) */}
            <rect x={24 + headOffsetX} y="3" width="16" height="4" fill="#FBBF24" />
            <rect x={18 + headOffsetX} y="5" width="28" height="4" fill="#1E293B" />
            <rect x={14 + headOffsetX} y="9" width="36" height="28" fill="#0F172A" rx="4" />
            <rect x={12 + headOffsetX} y="11" width="4" height="24" fill="#1E293B" />
            <rect x={46 + headOffsetX} y="11" width="6" height="24" fill="#020617" />

            {/* Sovereign Gold Armor Accent Lines */}
            <rect x={14 + headOffsetX} y="9" width="36" height="2" fill="#F59E0B" />
            <rect x={14 + headOffsetX} y="35" width="36" height="2" fill="#D97706" />

            {/* 3D Visor Screen Cavity (Deep Midnight Obsidian) */}
            <rect x={16 + visorOffsetX} y="15" width="32" height="19" fill="#020617" rx="4" />
            <rect x={18 + visorOffsetX} y="17" width="28" height="15" fill="#090D18" />

            {/* Glowing Amber / Emerald Voxel Eyes */}
            {blink ? (
              <>
                <rect x={20 + visorOffsetX} y="24" width="8" height="2" fill="#F59E0B" />
                <rect x={36 + visorOffsetX} y="24" width="8" height="2" fill="#F59E0B" />
              </>
            ) : isTalking ? (
              /* Expressive Speaking Voxel Eyes with Gold Cheeks */
              <>
                <polygon
                  points={`${20 + visorOffsetX},20 ${26 + visorOffsetX},17 ${28 + visorOffsetX},23 ${22 + visorOffsetX},25`}
                  fill="#FBBF24"
                />
                <polygon
                  points={`${36 + visorOffsetX},20 ${42 + visorOffsetX},17 ${44 + visorOffsetX},23 ${38 + visorOffsetX},25`}
                  fill="#FBBF24"
                />
                {/* Audio Spectrum Mouth Bar */}
                <rect x={26 + visorOffsetX} y="28" width="12" height="2" fill="#F59E0B" />
              </>
            ) : (
              /* Natural Alert Eyes Gazing West Toward Omni */
              <>
                <polygon
                  points={
                    gaze === 'LEFT'
                      ? `${18 + visorOffsetX},19 ${26 + visorOffsetX},20 ${24 + visorOffsetX},26 ${17 + visorOffsetX},24`
                      : `${20 + visorOffsetX},19 ${27 + visorOffsetX},19 ${26 + visorOffsetX},25 ${19 + visorOffsetX},25`
                  }
                  fill="#F59E0B"
                />
                <polygon
                  points={
                    gaze === 'LEFT'
                      ? `${34 + visorOffsetX},19 ${42 + visorOffsetX},20 ${40 + visorOffsetX},26 ${33 + visorOffsetX},24`
                      : `${36 + visorOffsetX},19 ${43 + visorOffsetX},19 ${42 + visorOffsetX},25 ${35 + visorOffsetX},25`
                  }
                  fill="#F59E0B"
                />
                {/* Pupil Sparkles */}
                <rect x={19 + visorOffsetX} y="20" width="2.5" height="2.5" fill="#FFFFFF" />
                <rect x={35 + visorOffsetX} y="20" width="2.5" height="2.5" fill="#FFFFFF" />
              </>
            )}

            {/* 3D Lower Torso with Merchant Armor Plate */}
            <rect x="14" y="39" width="36" height="15" fill="#0F172A" rx="2" />
            <rect x="12" y="39" width="4" height="15" fill="#1E293B" />
            <rect x="46" y="39" width="4" height="15" fill="#020617" />

            {/* Gold Merchant Crest Emblem */}
            <polygon points="32,41 36,46 28,46" fill="#FBBF24" />
            <rect x="29" y="47" width="6" height="5" fill="#F59E0B" rx="1" />

            {/* Robotic Arm (Extending toward Omni during Handshake) */}
            {isHandshaking ? (
              <motion.g
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: -16 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <rect x="2" y="44" width="16" height="5" fill="#F59E0B" rx="2" />
                <circle cx="2" cy="46.5" r="4" fill="#FBBF24" />
              </motion.g>
            ) : (
              <rect x="8" y="43" width="5" height="10" fill="#1E293B" rx="2" />
            )}
            <rect x="51" y="43" width="5" height="10" fill="#0A0F1D" rx="2" />

            {/* 3D Hover Thruster Pods (Floating Jet Exhaust) */}
            <polygon points="16,55 24,55 20,63" fill="#D97706" />
            <polygon points="28,55 36,55 32,63" fill="#F59E0B" />
            <polygon points="40,55 48,55 44,63" fill="#B45309" />

            {/* Animated Luminous Gold Thruster Plasma Particles */}
            <circle cx="32" cy="66" r="3" fill="#FBBF24" opacity="0.95" />
            <circle cx="20" cy="65" r="2.5" fill="#F59E0B" opacity="0.8" />
            <circle cx="44" cy="65" r="2.5" fill="#F59E0B" opacity="0.8" />
            <motion.circle
              cx="32"
              cy="70"
              r="2"
              fill="#FDE68A"
              animate={{ y: [0, 4, 0], opacity: [0.9, 0.2, 0.9] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </g>
        </svg>

        {/* Floating Store Badge */}
        <div className="absolute -bottom-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-[9px] font-bold text-amber-300 tracking-wider uppercase font-mono shadow-md">
          {storeName}
        </div>
      </motion.div>
    </div>
  );
};
