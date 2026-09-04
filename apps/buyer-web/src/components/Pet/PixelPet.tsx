import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type PetEmotion = 'HAPPY' | 'EXCITED' | 'THINKING' | 'SLEEPY' | 'CURIOUS' | 'TALKING' | 'BLINKING' | 'DEAL_LOCKED' | 'ANGRY' | 'CHARGING' | 'CUTE';

export type PetDirection = 'south' | 'north' | 'east' | 'west' | 'south-east' | 'south-west' | 'north-east' | 'north-west';

interface PixelPetProps {
  emotion?: PetEmotion;
  state?: string;
  speechText?: string;
  direction?: PetDirection;
  isRoaming?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  isAngry?: boolean;
  isCharging?: boolean;
  isCute?: boolean;
  accentColor?: string;
}

export const PixelPet: React.FC<PixelPetProps> = ({
  emotion = 'HAPPY',
  state = 'SLEEPING',
  speechText,
  direction,
  isRoaming = false,
  onClick,
  size = 'md',
  isAngry = false,
  isCharging = false,
  isCute = false,
  accentColor = '#00F0FF',
}) => {
  const [currentDirection, setCurrentDirection] = useState<PetDirection>(direction || 'south');
  const [blink, setBlink] = useState(false);
  const [eyeDirection, setEyeDirection] = useState<'CENTER' | 'LEFT' | 'RIGHT' | 'UP'>('CENTER');

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3800);

    const lookInterval = setInterval(() => {
      const dirs: ('CENTER' | 'LEFT' | 'RIGHT' | 'UP')[] = ['CENTER', 'LEFT', 'RIGHT', 'UP', 'CENTER'];
      setEyeDirection(dirs[Math.floor(Math.random() * dirs.length)]);
    }, 4200);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(lookInterval);
    };
  }, []);

  // Autonomous 8-directional gaze shifting
  useEffect(() => {
    if (direction) {
      setCurrentDirection(direction);
      return;
    }

    if (emotion === 'ANGRY' || isAngry) {
      setCurrentDirection('south');
      return;
    }

    if (state === 'WALK' || isRoaming) {
      const walkDirs: PetDirection[] = ['east', 'west', 'south-east', 'south-west'];
      setCurrentDirection(walkDirs[Math.floor(Math.random() * walkDirs.length)]);
      return;
    }

    const gazeInterval = setInterval(() => {
      if (state !== 'SLEEPING' && emotion !== 'SLEEPY') {
        const idleRotations: PetDirection[] = ['south', 'south-east', 'south-west', 'south', 'east', 'west'];
        setCurrentDirection(idleRotations[Math.floor(Math.random() * idleRotations.length)]);
      } else {
        setCurrentDirection('south');
      }
    }, 4500);

    return () => clearInterval(gazeInterval);
  }, [direction, state, emotion, isRoaming, isAngry]);

  const isSleeping = state === 'SLEEPING' || emotion === 'SLEEPY' || isCharging;
  const showAngry = isAngry || emotion === 'ANGRY';
  const showCute = isCute || emotion === 'CUTE';

  // 3D Voxel Lighting Colors (Cyan, Lemon Green, Violet, Rose, Amber, Emerald, etc.)
  const eyeColor = showAngry ? '#EF4444' : showCute ? '#F43F5E' : isCharging ? '#10B981' : accentColor;
  const eyeGlow = showAngry ? 'rgba(239,68,68,0.9)' : showCute ? 'rgba(244,63,94,0.9)' : accentColor;

  const scale = size === 'sm' ? 0.8 : size === 'lg' ? 1.35 : 1.05;

  // Compute 3D isometric perspective offsets based on currentDirection
  const headOffsetX = currentDirection.includes('east') ? 3 : currentDirection.includes('west') ? -3 : 0;
  const visorOffsetX = currentDirection.includes('east') ? 4 : currentDirection.includes('west') ? -4 : 0;

  return (
    <div className="relative flex flex-col items-center select-none" onClick={onClick}>
      {/* Dynamic Pop-up Speech Bubble */}
      <AnimatePresence>
        {speechText && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.8 }}
            className={`mb-2 px-3.5 py-1.5 rounded-2xl font-black font-mono text-[11px] shadow-[0_8px_30px_rgba(0,0,0,0.7)] border-2 relative z-30 max-w-[220px] text-center ${
              showAngry
                ? 'bg-rose-50 text-rose-950 border-rose-600'
                : showCute
                ? 'bg-pink-50 text-pink-950 border-pink-500'
                : isCharging
                ? 'bg-emerald-50 text-emerald-950 border-emerald-600'
                : 'bg-white text-slate-950 border-slate-900'
            }`}
          >
            <span>{speechText}</span>
            <div
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 border-r-2 border-b-2 rotate-45 ${
                showAngry
                  ? 'bg-rose-50 border-rose-600'
                  : showCute
                  ? 'bg-pink-50 border-pink-500'
                  : isCharging
                  ? 'bg-emerald-50 border-emerald-600'
                  : 'bg-white border-slate-900'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ORIGINAL 3D-VOXEL CHIBI PIXEL COMPANION */}
      <motion.div
        animate={{
          y: isSleeping ? [0, 2, 0] : showAngry ? [-3, 3, -3] : [0, -8, 0],
          rotate: showAngry ? [-4, 4, -4] : [0, 1.5, -1.5, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: showAngry ? 0.35 : isSleeping ? 3.5 : 2.4,
          ease: 'easeInOut',
        }}
        className="relative cursor-grab active:cursor-grabbing flex flex-col items-center"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Luminous Volumetric Holographic Glow Aura */}
        <div
          className="absolute -inset-4 rounded-full blur-2xl pointer-events-none transition-colors duration-300"
          style={{ background: eyeGlow, opacity: 0.35 }}
        />

        {/* 3D Isometric Voxel Chibi SVG */}
        <svg
          viewBox="0 0 64 72"
          className="w-20 h-24 filter drop-shadow-[0_0_14px_rgba(56,189,248,0.85)] [image-rendering:pixelated]"
        >
          {/* 1. 3D CHIBI DOME ARMOR (Light left, shadow right for 3D depth) */}
          <rect x={24 + headOffsetX} y="2" width="16" height="4" fill="#FFFFFF" />
          <rect x={20 + headOffsetX} y="4" width="24" height="4" fill="#F8FAFC" />
          <rect x={18 + headOffsetX} y="4" width="4" height="4" fill="#E2E8F0" />
          <rect x={42 + headOffsetX} y="4" width="4" height="4" fill="#94A3B8" />

          {/* CHIBI CAT/ROBOT CORNER EARS */}
          <polygon points={`${16 + headOffsetX},8 ${22 + headOffsetX},2 ${24 + headOffsetX},8`} fill="#FFFFFF" />
          <polygon points={`${18 + headOffsetX},7 ${22 + headOffsetX},3 ${23 + headOffsetX},7`} fill={accentColor} />
          <polygon points={`${48 + headOffsetX},8 ${42 + headOffsetX},2 ${40 + headOffsetX},8`} fill="#94A3B8" />
          <polygon points={`${46 + headOffsetX},7 ${42 + headOffsetX},3 ${41 + headOffsetX},7`} fill={accentColor} />

          {/* 3D HEAD SHELL */}
          <rect x={14 + headOffsetX} y="8" width="36" height="26" fill="#FFFFFF" rx="4" />
          <rect x={12 + headOffsetX} y="10" width="4" height="22" fill="#F1F5F9" />
          <rect x={14 + headOffsetX} y="8" width="4" height="24" fill="#E2E8F0" />
          <rect x={46 + headOffsetX} y="10" width="6" height="22" fill="#64748B" />
          <rect x={42 + headOffsetX} y="8" width="4" height="24" fill="#94A3B8" />

          {/* 2. DEEP 3D VISOR CAVITY */}
          <rect x={16 + visorOffsetX} y="14" width="32" height="18" fill="#060913" rx="4" />
          <rect x={18 + visorOffsetX} y="16" width="28" height="14" fill="#02040A" />

          {/* 3. EMOTIONS & FACIAL EXPRESSIONS */}
          {showAngry ? (
            /* ANGER EMOTION: Slanted Red Sharp Visor Eyes + Furrowed Brow */
            <>
              <polygon points={`${18 + visorOffsetX},18 ${30 + visorOffsetX},24 ${28 + visorOffsetX},27 ${18 + visorOffsetX},21`} fill="#EF4444" />
              <polygon points={`${46 + visorOffsetX},18 ${34 + visorOffsetX},24 ${36 + visorOffsetX},27 ${46 + visorOffsetX},21`} fill="#EF4444" />
              <rect x={22 + visorOffsetX} y="22" width="4" height="3" fill="#FCA5A5" />
              <rect x={38 + visorOffsetX} y="22" width="4" height="3" fill="#FCA5A5" />
              {/* Anger Spark Mark */}
              <text x={44 + visorOffsetX} y="11" fill="#EF4444" fontSize="11" fontWeight="black" fontFamily="sans-serif">💢</text>
            </>
          ) : showCute || emotion === 'EXCITED' ? (
            /* CUTE EMOTION: Glowing Pink Heart Sparkle Eyes + Blush Cheeks */
            <>
              <polygon points={`${21 + visorOffsetX},18 ${24 + visorOffsetX},16 ${27 + visorOffsetX},18 ${27 + visorOffsetX},22 ${24 + visorOffsetX},25 ${21 + visorOffsetX},22`} fill="#F43F5E" />
              <polygon points={`${37 + visorOffsetX},18 ${40 + visorOffsetX},16 ${43 + visorOffsetX},18 ${43 + visorOffsetX},22 ${40 + visorOffsetX},25 ${37 + visorOffsetX},22`} fill="#F43F5E" />
              {/* Cute Blush Cheeks */}
              <rect x={18 + visorOffsetX} y="26" width="4" height="2" fill="#FB7185" opacity="0.8" />
              <rect x={42 + visorOffsetX} y="26" width="4" height="2" fill="#FB7185" opacity="0.8" />
            </>
          ) : isSleeping ? (
            /* SLEEPY EMOTION: Soft Closed Eye Slits + Zzz */
            <>
              <rect x={20 + visorOffsetX} y="22" width="8" height="2" fill={accentColor} opacity="0.9" />
              <rect x={36 + visorOffsetX} y="22" width="8" height="2" fill={accentColor} opacity="0.9" />
              <text x={46 + visorOffsetX} y="12" fill={accentColor} fontSize="9" fontFamily="monospace" fontWeight="bold">z</text>
            </>
          ) : blink ? (
            /* BLINKING */
            <>
              <rect x={20 + visorOffsetX} y="22" width="8" height="2" fill={eyeColor} />
              <rect x={36 + visorOffsetX} y="22" width="8" height="2" fill={eyeColor} />
            </>
          ) : (
            /* LIVELY 3D CYAN VISOR PUPILS WITH DIRECTIONAL TRACKING */
            <>
              <polygon
                points={
                  eyeDirection === 'LEFT'
                    ? `${18 + visorOffsetX},18 ${26 + visorOffsetX},20 ${24 + visorOffsetX},26 ${17 + visorOffsetX},24`
                    : eyeDirection === 'RIGHT'
                    ? `${21 + visorOffsetX},18 ${29 + visorOffsetX},20 ${27 + visorOffsetX},26 ${20 + visorOffsetX},24`
                    : `${19 + visorOffsetX},18 ${27 + visorOffsetX},20 ${25 + visorOffsetX},26 ${18 + visorOffsetX},24`
                }
                fill={eyeColor}
              />
              <polygon
                points={
                  eyeDirection === 'LEFT'
                    ? `${35 + visorOffsetX},20 ${43 + visorOffsetX},18 ${45 + visorOffsetX},24 ${38 + visorOffsetX},26`
                    : eyeDirection === 'RIGHT'
                    ? `${38 + visorOffsetX},20 ${46 + visorOffsetX},18 ${48 + visorOffsetX},24 ${41 + visorOffsetX},26`
                    : `${37 + visorOffsetX},20 ${45 + visorOffsetX},18 ${47 + visorOffsetX},24 ${40 + visorOffsetX},26`
                }
                fill={eyeColor}
              />
              {/* Specular Highlights */}
              <rect x={(eyeDirection === 'LEFT' ? 20 : eyeDirection === 'RIGHT' ? 23 : 21) + visorOffsetX} y="20" width="2" height="2" fill="#FFFFFF" />
              <rect x={(eyeDirection === 'LEFT' ? 37 : eyeDirection === 'RIGHT' ? 40 : 38) + visorOffsetX} y="20" width="2" height="2" fill="#FFFFFF" />
            </>
          )}

          {/* 4. 3D LOWER TORSO WITH BEVELED SHADING */}
          <rect x="14" y="36" width="36" height="14" fill="#FFFFFF" />
          <rect x="12" y="36" width="4" height="14" fill="#E2E8F0" />
          <rect x="46" y="36" width="4" height="14" fill="#64748B" />
          <rect x="42" y="36" width="4" height="14" fill="#94A3B8" />

          {/* CHEST CORE POWER CELL (Arc Reactor) */}
          <rect x="28" y="40" width="8" height="6" fill={eyeColor} rx="2" />
          <rect x="30" y="42" width="4" height="2" fill="#FFFFFF" opacity="0.9" />

          {/* 5. 3D HOVER POD THRUSTERS */}
          <polygon points="16,50 24,50 20,58" fill="#CBD5E1" />
          <polygon points="28,50 36,50 32,58" fill="#FFFFFF" />
          <polygon points="40,50 48,50 44,58" fill="#94A3B8" />

          {/* GLOWING BLUE THRUSTER PARTICLES */}
          {!isSleeping && (
            <>
              <circle cx="32" cy="60" r="2.5" fill={eyeColor} opacity="0.9" />
              <circle cx="20" cy="59" r="2" fill={eyeColor} opacity="0.7" />
              <circle cx="44" cy="59" r="2" fill={eyeColor} opacity="0.7" />
            </>
          )}
        </svg>
      </motion.div>
    </div>
  );
};
