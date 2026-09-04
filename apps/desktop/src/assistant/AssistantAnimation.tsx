import React, { useEffect, useState } from 'react';
import { Direction, EmotionType, AssistantState } from '../types/assistant';
import { motion, TargetAndTransition } from 'framer-motion';

interface AssistantAnimationProps {
  emotion: EmotionType;
  direction: Direction;
  state: AssistantState;
  scale?: number;
  isMoving?: boolean;
  reduceMotion?: boolean;
  onSpriteClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  accentColor?: string;
}

export const AssistantAnimation: React.FC<AssistantAnimationProps> = ({
  emotion,
  direction,
  state,
  scale = 1.35,
  reduceMotion = false,
  onSpriteClick,
  onDoubleClick,
  onContextMenu,
  accentColor = '#00F0FF',
}) => {
  const [blink, setBlink] = useState(false);
  const [gaze, setGaze] = useState<'CENTER' | 'LEFT' | 'RIGHT'>('CENTER');

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3600);

    const gazeInterval = setInterval(() => {
      const dirs: ('CENTER' | 'LEFT' | 'RIGHT')[] = ['CENTER', 'LEFT', 'RIGHT', 'CENTER'];
      setGaze(dirs[Math.floor(Math.random() * dirs.length)]);
    }, 4200);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(gazeInterval);
    };
  }, []);

  const headOffsetX = direction.includes('east') ? 2 : direction.includes('west') ? -2 : 0;
  const visorOffsetX = direction.includes('east') ? 3 : direction.includes('west') ? -3 : 0;
  const isFacingNorth = direction.includes('north');

  const isAngry = emotion === 'Angry' || emotion === 'Frustrated';
  const isCute = emotion === 'HeartEyes' || emotion === 'Blush' || emotion === 'Touched';
  const isStarStruck = emotion === 'StarStruck' || emotion === 'MindBlown';
  const isWink = emotion === 'Wink';
  const isHappy = emotion === 'Happy' || emotion === 'Surprised' || emotion === 'Yummy' || emotion === 'TearsOfJoy';
  const isAnxious = emotion === 'Anxious' || emotion === 'Terrified' || emotion === 'Confused' || emotion === 'SweatSmile';
  const isSleeping = state === 'SLEEPING' || emotion === 'Sleepy';
  const isListening = emotion === 'Listening' || state === 'LISTENING';

  const currentGlowColor = isAngry
    ? '#EF4444'
    : isCute
    ? '#F43F5E'
    : isStarStruck
    ? '#FBBF24'
    : isAnxious
    ? '#F59E0B'
    : accentColor;

  const visorColor = currentGlowColor;

  const getMotionAnimation = (): TargetAndTransition => {
    if (reduceMotion) return {};

    switch (state) {
      case 'SLEEPING':
        return {
          y: [0, 2, 0],
          transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'WALKING':
        return {
          y: [0, -3, 0],
          rotate: direction.includes('east') ? [0, 2, 0] : direction.includes('west') ? [0, -2, 0] : [-1.5, 1.5, -1.5],
          transition: { duration: 0.28, repeat: Infinity, ease: 'linear' },
        };
      case 'DRAGGING':
        return {
          scale: 1.05,
          rotate: [-2, 2, -2],
          transition: { rotate: { duration: 0.25, repeat: Infinity } },
        };
      case 'LISTENING':
        return {
          y: [0, -4, 0],
          scale: [1, 1.03, 1],
          transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'IDLE':
      default:
        return {
          y: [0, -3.5, 0],
          transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
        };
    }
  };

  return (
    <div
      className="relative flex items-center justify-center select-none"
      onClick={onSpriteClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      style={{
        width: `${96 * scale}px`,
        height: `${96 * scale}px`,
      }}
    >
      {/* 1. LUXURIOUS DIFFUSED VOLUMETRIC GLOW HALO & SOUNDWAVE RING (ONLY WHEN LISTENING) */}
      {isListening && (
        <>
          <div
            className="absolute inset-0 rounded-full pointer-events-none transition-all duration-300"
            style={{
              background: `radial-gradient(circle, ${accentColor}AA 0%, ${accentColor}44 55%, rgba(0, 0, 0, 0) 80%)`,
              filter: 'blur(10px)',
              transform: 'scale(1.15)',
            }}
          />
          <motion.div
            animate={{ scale: [0.9, 1.25, 0.9], opacity: [0.9, 0.25, 0.9] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-2 rounded-full border pointer-events-none"
            style={{
              borderColor: accentColor,
              boxShadow: `0 0 24px ${accentColor}`,
            }}
          />
        </>
      )}

      {/* 3. FULL CHIBI ROBOT CHARACTER WITH ZERO CUTOFF */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        animate={getMotionAnimation()}
        style={{
          width: `${84 * scale}px`,
          height: `${84 * scale}px`,
          filter: `drop-shadow(0 4px 16px ${currentGlowColor}88)`,
        }}
      >
        <svg
          viewBox="0 0 76 76"
          className="w-full h-full [image-rendering:pixelated]"
        >
          {isFacingNorth ? (
            /* BACK PERSPECTIVE VIEW (Complete with full 3D body and jetpack) */
            <g transform="translate(6, 4)">
              {/* Back Cyber Ears */}
              <polygon points={`${14 + headOffsetX},10 ${22 + headOffsetX},3 ${24 + headOffsetX},11`} fill="#94A3B8" />
              <polygon points={`${50 + headOffsetX},10 ${42 + headOffsetX},3 ${40 + headOffsetX},11`} fill="#64748B" />

              {/* Head Dome Back */}
              <rect x={14 + headOffsetX} y="8" width="36" height="28" fill="#E2E8F0" rx="4" />
              <rect x={44 + headOffsetX} y="8" width="6" height="28" fill="#64748B" rx="2" />
              <rect x={24 + headOffsetX} y="16" width="16" height="6" fill="#0F172A" rx="2" />
              <rect x={26 + headOffsetX} y="18" width="12" height="2" fill={visorColor} />

              {/* Lower Body Group (Back Perspective) */}
              <g
                className="transition-all duration-500 ease-out"
                style={{
                  opacity: isSleeping ? 0 : 1,
                  transform: isSleeping ? 'translateY(18px) scale(0.95)' : 'translateY(0px) scale(1)',
                }}
              >
                {/* 3D Lower Torso Back */}
                <rect x="14" y="39" width="36" height="15" fill="#CBD5E1" />
                <rect x="12" y="39" width="4" height="15" fill="#94A3B8" />
                <rect x="46" y="39" width="4" height="15" fill="#475569" />

                {/* Back Jetpack Core / Cooling Radiator */}
                <rect x="22" y="42" width="20" height="9" fill="#1E293B" rx="2" />
                <rect x="25" y="44" width="14" height="2" fill={accentColor} opacity="0.9" />
                <rect x="25" y="48" width="14" height="2" fill={accentColor} opacity="0.9" />

                {/* 3D Hover Thruster Pods Back */}
                <polygon points="16,55 24,55 20,63" fill="#64748B" />
                <polygon points="28,55 36,55 32,63" fill="#94A3B8" />
                <polygon points="40,55 48,55 44,63" fill="#475569" />

                {/* Jet Particles */}
                {!isSleeping && (
                  <>
                    <circle cx="32" cy="66" r="3" fill={accentColor} opacity="0.95" />
                    <circle cx="20" cy="65" r="2.5" fill={accentColor} opacity="0.8" />
                    <circle cx="44" cy="65" r="2.5" fill={accentColor} opacity="0.8" />
                  </>
                )}
              </g>
            </g>
          ) : (
            /* FRONT PERSPECTIVE VIEW (Exact Full Match with Image) */
            <g transform="translate(6, 4)">
              {/* Cyber Ears */}
              <polygon points={`${13 + headOffsetX},9 ${21 + headOffsetX},2 ${25 + headOffsetX},10`} fill="#FFFFFF" />
              <polygon points={`${15 + headOffsetX},8 ${21 + headOffsetX},4 ${24 + headOffsetX},9`} fill={accentColor} />
              <polygon points={`${51 + headOffsetX},9 ${43 + headOffsetX},2 ${39 + headOffsetX},10`} fill="#94A3B8" />
              <polygon points={`${49 + headOffsetX},8 ${43 + headOffsetX},4 ${40 + headOffsetX},9`} fill={accentColor} />

              {/* 3D Head Dome */}
              <rect x={24 + headOffsetX} y="3" width="16" height="4" fill="#FFFFFF" />
              <rect x={18 + headOffsetX} y="5" width="28" height="4" fill="#F8FAFC" />
              <rect x={14 + headOffsetX} y="9" width="36" height="28" fill="#FFFFFF" rx="4" />
              <rect x={12 + headOffsetX} y="11" width="4" height="24" fill="#F1F5F9" />
              <rect x={46 + headOffsetX} y="11" width="6" height="24" fill="#64748B" />

              {/* 3D Visor Screen Cavity */}
              <rect x={16 + visorOffsetX} y="15" width="32" height="19" fill="#050B18" rx="4" />
              <rect x={18 + visorOffsetX} y="17" width="28" height="15" fill="#02050E" />

              {/* Dynamic Visor Eyes & Expressive Emotions */}
              {isSleeping ? (
                /* SLEEPY EMOTION: Soft Closed Eye Slits */
                <>
                  <rect x={20 + visorOffsetX} y="24" width="8" height="2.5" fill={accentColor} opacity="0.9" rx="1" />
                  <rect x={36 + visorOffsetX} y="24" width="8" height="2.5" fill={accentColor} opacity="0.9" rx="1" />
                </>
              ) : isAngry ? (
                /* ANGER EMOTION: Slanted Red Sharp Visor Eyes + 💢 Anger Mark */
                <>
                  <polygon points={`${18 + visorOffsetX},18 ${30 + visorOffsetX},24 ${28 + visorOffsetX},27 ${18 + visorOffsetX},21`} fill="#EF4444" />
                  <polygon points={`${46 + visorOffsetX},18 ${34 + visorOffsetX},24 ${36 + visorOffsetX},27 ${46 + visorOffsetX},21`} fill="#EF4444" />
                  <rect x={22 + visorOffsetX} y="22" width="4" height="3" fill="#FCA5A5" />
                  <rect x={38 + visorOffsetX} y="22" width="4" height="3" fill="#FCA5A5" />
                  <text x={44 + visorOffsetX} y="11" fill="#EF4444" fontSize="11" fontWeight="black" fontFamily="sans-serif">💢</text>
                </>
              ) : isCute ? (
                /* CUTE / HEART EYES: Glowing Pink Hearts + Cute Rosy Blush Cheeks */
                <>
                  <polygon points={`${21 + visorOffsetX},18 ${24 + visorOffsetX},16 ${27 + visorOffsetX},18 ${27 + visorOffsetX},22 ${24 + visorOffsetX},25 ${21 + visorOffsetX},22`} fill="#F43F5E" />
                  <polygon points={`${37 + visorOffsetX},18 ${40 + visorOffsetX},16 ${43 + visorOffsetX},18 ${43 + visorOffsetX},22 ${40 + visorOffsetX},25 ${37 + visorOffsetX},22`} fill="#F43F5E" />
                  <rect x={18 + visorOffsetX} y="26" width="4" height="2" fill="#FB7185" opacity="0.85" rx="1" />
                  <rect x={42 + visorOffsetX} y="26" width="4" height="2" fill="#FB7185" opacity="0.85" rx="1" />
                </>
              ) : isStarStruck ? (
                /* STARSTRUCK: Sparkling Gold 4-Pointed Stars */
                <>
                  <polygon points={`${24 + visorOffsetX},16 ${26 + visorOffsetX},20 ${30 + visorOffsetX},21 ${26 + visorOffsetX},22 ${24 + visorOffsetX},26 ${22 + visorOffsetX},22 ${18 + visorOffsetX},21 ${22 + visorOffsetX},20`} fill="#FBBF24" />
                  <polygon points={`${40 + visorOffsetX},16 ${42 + visorOffsetX},20 ${46 + visorOffsetX},21 ${42 + visorOffsetX},22 ${40 + visorOffsetX},26 ${38 + visorOffsetX},22 ${34 + visorOffsetX},21 ${38 + visorOffsetX},20`} fill="#FBBF24" />
                  <circle cx={24 + visorOffsetX} cy="21" r="1.5" fill="#FFFFFF" />
                  <circle cx={40 + visorOffsetX} cy="21" r="1.5" fill="#FFFFFF" />
                </>
              ) : isWink ? (
                /* WINK: Playful curved arc on left, open sparkling eye on right */
                <>
                  <path d={`M ${19 + visorOffsetX} 23 Q ${23 + visorOffsetX} 17 ${27 + visorOffsetX} 23`} fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
                  <polygon points={`${37 + visorOffsetX},21 ${45 + visorOffsetX},19 ${47 + visorOffsetX},25 ${40 + visorOffsetX},27`} fill={accentColor} />
                  <rect x={38 + visorOffsetX} y="21" width="2" height="3" fill="#FFFFFF" />
                  <rect x={18 + visorOffsetX} y="26" width="4" height="2" fill="#FB7185" opacity="0.8" rx="1" />
                </>
              ) : isHappy ? (
                /* HAPPY: Upturned Joyful Curved Eyes + Accent Blush */
                <>
                  <path d={`M ${19 + visorOffsetX} 23 Q ${23 + visorOffsetX} 17 ${27 + visorOffsetX} 23`} fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
                  <path d={`M ${37 + visorOffsetX} 23 Q ${41 + visorOffsetX} 17 ${45 + visorOffsetX} 23`} fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
                  <rect x={18 + visorOffsetX} y="26" width="4" height="2" fill={accentColor} opacity="0.6" rx="1" />
                  <rect x={42 + visorOffsetX} y="26" width="4" height="2" fill={accentColor} opacity="0.6" rx="1" />
                </>
              ) : isAnxious ? (
                /* ANXIOUS / WORRIED: Wavy lines + sweat drop */
                <>
                  <path d={`M ${19 + visorOffsetX} 22 Q ${22 + visorOffsetX} 19 ${24 + visorOffsetX} 22 T ${27 + visorOffsetX} 22`} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <path d={`M ${37 + visorOffsetX} 22 Q ${40 + visorOffsetX} 19 ${42 + visorOffsetX} 22 T ${45 + visorOffsetX} 22`} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx={47 + visorOffsetX} cy="15" r="1.5" fill="#38BDF8" />
                </>
              ) : isListening ? (
                /* LISTENING: Soundwave concentric rings */
                <>
                  <circle cx={24 + visorOffsetX} cy="24" r="4.5" fill="none" stroke={accentColor} strokeWidth="2" />
                  <circle cx={40 + visorOffsetX} cy="24" r="4.5" fill="none" stroke={accentColor} strokeWidth="2" />
                  <rect x={23 + visorOffsetX} y="22" width="2" height="4" fill="#FFFFFF" />
                  <rect x={39 + visorOffsetX} y="22" width="2" height="4" fill="#FFFFFF" />
                </>
              ) : blink ? (
                <>
                  <rect x={20 + visorOffsetX} y="24" width="8" height="2" fill={visorColor} />
                  <rect x={36 + visorOffsetX} y="24" width="8" height="2" fill={visorColor} />
                </>
              ) : (
                /* LIVELY GLOWING VOXEL EYES WITH DIRECTIONAL TRACKING */
                <>
                  <polygon
                    points={
                      gaze === 'LEFT'
                        ? `${18 + visorOffsetX},19 ${26 + visorOffsetX},21 ${24 + visorOffsetX},27 ${17 + visorOffsetX},25`
                        : gaze === 'RIGHT'
                        ? `${21 + visorOffsetX},19 ${29 + visorOffsetX},21 ${27 + visorOffsetX},27 ${20 + visorOffsetX},25`
                        : `${19 + visorOffsetX},19 ${27 + visorOffsetX},21 ${25 + visorOffsetX},27 ${18 + visorOffsetX},25`
                    }
                    fill={accentColor}
                  />
                  <polygon
                    points={
                      gaze === 'LEFT'
                        ? `${35 + visorOffsetX},21 ${43 + visorOffsetX},19 ${45 + visorOffsetX},25 ${38 + visorOffsetX},27`
                        : gaze === 'RIGHT'
                        ? `${38 + visorOffsetX},21 ${46 + visorOffsetX},19 ${48 + visorOffsetX},25 ${41 + visorOffsetX},27`
                        : `${37 + visorOffsetX},21 ${45 + visorOffsetX},19 ${47 + visorOffsetX},25 ${40 + visorOffsetX},27`
                    }
                    fill={accentColor}
                  />
                  {/* Specular Highlights */}
                  <rect x={(gaze === 'LEFT' ? 19 : gaze === 'RIGHT' ? 22 : 20) + visorOffsetX} y="21" width="2" height="4" fill="#FFFFFF" />
                  <rect x={(gaze === 'LEFT' ? 36 : gaze === 'RIGHT' ? 39 : 37) + visorOffsetX} y="21" width="2" height="4" fill="#FFFFFF" />
                </>
              )}

              {/* Lower Body Group (Submerged inside Charging Base when Sleeping, Pops Up when Called Out) */}
              <g
                className="transition-all duration-500 ease-out"
                style={{
                  opacity: isSleeping ? 0 : 1,
                  transform: isSleeping ? 'translateY(18px) scale(0.95)' : 'translateY(0px) scale(1)',
                }}
              >
                {/* 3D Lower Torso */}
                <rect x="14" y="39" width="36" height="15" fill="#FFFFFF" />
                <rect x="12" y="39" width="4" height="15" fill="#E2E8F0" />
                <rect x="46" y="39" width="4" height="15" fill="#64748B" />

                {/* Chest Reactor Core */}
                <rect x="28" y="43" width="8" height="7" fill={accentColor} rx="2" />
                <rect x="30" y="45" width="4" height="3" fill="#FFFFFF" opacity="0.9" />

                {/* 3D Hover Thruster Pods */}
                <polygon points="16,55 24,55 20,63" fill="#CBD5E1" />
                <polygon points="28,55 36,55 32,63" fill="#FFFFFF" />
                <polygon points="40,55 48,55 44,63" fill="#94A3B8" />

                {/* Jet Particles */}
                {!isSleeping && (
                  <>
                    <circle cx="32" cy="66" r="3" fill={accentColor} opacity="0.95" />
                    <circle cx="20" cy="65" r="2.5" fill={accentColor} opacity="0.8" />
                    <circle cx="44" cy="65" r="2.5" fill={accentColor} opacity="0.8" />
                  </>
                )}
              </g>
            </g>
          )}
        </svg>
      </motion.div>

      {/* 4. HIGH-TECH MAGNETIC CHARGING DOCK BASE */}
      <motion.div
        initial={false}
        animate={{
          opacity: isSleeping ? 1 : 0.35,
          scale: isSleeping ? 1 : 0.85,
          y: isSleeping ? 0 : 12,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="absolute -bottom-2 z-0 pointer-events-none flex flex-col items-center select-none"
        style={{ width: `${84 * scale}px` }}
      >
        <div
          className="relative flex items-center justify-center w-full h-6 rounded-xl border transition-all duration-500 backdrop-blur-sm"
          style={{
            backgroundColor: isSleeping ? '#050811' : 'rgba(15, 23, 42, 0.3)',
            borderColor: isSleeping ? accentColor : 'rgba(51, 65, 85, 0.4)',
            boxShadow: isSleeping ? `0 0 24px ${accentColor}88` : 'none',
          }}
        >
          <div className="flex items-center gap-1.5 px-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isSleeping ? accentColor : '#475569' }}
            />
            <span
              className="text-[8.5px] font-mono font-bold tracking-wider"
              style={{ color: isSleeping ? accentColor : '#94A3B8' }}
            >
              {isSleeping ? '⚡ DOCKED • CHARGING' : 'BASE STANDBY'}
            </span>
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isSleeping ? accentColor : '#475569' }}
            />
          </div>
        </div>
      </motion.div>

      {/* 5. SLEEP ZZZ */}
      {isSleeping && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [-2, -16, -28],
            x: [4, 10, 18],
            scale: [0.6, 1, 1.2],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
          className="absolute top-2 right-4 text-xs font-black pointer-events-none select-none drop-shadow font-mono"
          style={{ color: accentColor }}
        >
          Zzz
        </motion.div>
      )}
    </div>
  );
};
