import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MerchantBotAvatarProps {
  scale?: number;
  isTalking?: boolean;
  isHandshaking?: boolean;
  storeName?: string;
}

export const MerchantBotAvatar: React.FC<MerchantBotAvatarProps> = ({
  scale = 1.2,
  isTalking = false,
  isHandshaking = false,
  storeName = 'TitanBot',
}) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative select-none flex flex-col items-center justify-center pointer-events-none"
      style={{
        width: 120 * scale,
        height: 120 * scale,
      }}
    >
      <motion.div
        animate={{
          y: isTalking ? [0, -3, 0] : [0, -1.5, 0],
          rotate: isTalking ? [0, 1, -1, 0] : 0,
        }}
        transition={{
          duration: isTalking ? 0.6 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.25)]"
        >
          {/* Subtle Ambient Glow */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

          {/* Torso / Luxury Merchant Jacket */}
          <path
            d="M 32 68 L 26 92 L 74 92 L 68 68 Z"
            fill="#1E293B"
            stroke="#F59E0B"
            strokeWidth="1.5"
          />
          {/* Merchant Gold Lapels */}
          <path d="M 36 68 L 50 82 L 44 92 Z" fill="#D97706" />
          <path d="M 64 68 L 50 82 L 56 92 Z" fill="#B45309" />
          {/* Gold Merchant Tie / Crest */}
          <polygon points="47,70 53,70 51,80 49,80" fill="#FBBF24" />

          {/* Shoulders */}
          <circle cx="28" cy="74" r="5" fill="#334155" stroke="#F59E0B" strokeWidth="1" />
          <circle cx="72" cy="74" r="5" fill="#334155" stroke="#F59E0B" strokeWidth="1" />

          {/* Handshake Arm Extending to the Left */}
          {isHandshaking ? (
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
              d="M 28 74 Q 10 70 -4 74"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="4"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M 28 74 Q 22 84 26 90"
              fill="none"
              stroke="#475569"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
          <path
            d="M 72 74 Q 78 84 74 90"
            fill="none"
            stroke="#475569"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Robot Head Frame */}
          <rect
            x="24"
            y="22"
            width="52"
            height="44"
            rx="14"
            fill="#0F172A"
            stroke="#F59E0B"
            strokeWidth="2.5"
          />

          {/* Top Merchant Antenna */}
          <line x1="50" y1="22" x2="50" y2="10" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="50" cy="9" r="3.5" fill="#FBBF24" className="animate-pulse" />

          {/* Visor Area */}
          <rect
            x="28"
            y="30"
            width="44"
            height="26"
            rx="8"
            fill="#020617"
            stroke="#F59E0B"
            strokeWidth="1"
            opacity="0.9"
          />

          {/* Visor Glowing Digital Eyes */}
          {!blink ? (
            <>
              {/* Left Eye */}
              <circle cx="41" cy="43" r="5" fill="#10B981" />
              <circle cx="42" cy="42" r="1.5" fill="#FFFFFF" />
              {/* Right Eye */}
              <circle cx="59" cy="43" r="5" fill="#10B981" />
              <circle cx="60" cy="42" r="1.5" fill="#FFFFFF" />
            </>
          ) : (
            <>
              {/* Blinking line */}
              <line x1="36" y1="43" x2="46" y2="43" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
              <line x1="54" y1="43" x2="64" y2="43" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {/* Mouth / Audio Spectrum Bar */}
          {isTalking ? (
            <motion.line
              animate={{ strokeWidth: [1, 3, 1] }}
              transition={{ duration: 0.3, repeat: Infinity }}
              x1="44"
              y1="51"
              x2="56"
              y2="51"
              stroke="#FBBF24"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <line x1="46" y1="51" x2="54" y2="51" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
          )}

          {/* Store Brand Badge on Chest */}
          <circle cx="50" cy="85" r="4" fill="#FBBF24" />
          <text x="50" y="87" fontSize="5" fontWeight="bold" fill="#0F172A" textAnchor="middle">T</text>
        </svg>

        {/* Floating Store Badge */}
        <div className="absolute -bottom-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-amber-300 tracking-wider uppercase font-mono">
          {storeName}
        </div>
      </motion.div>
    </div>
  );
};
