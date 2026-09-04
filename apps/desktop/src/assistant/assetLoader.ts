import { Direction, EmotionType } from '../types/assistant';

// Glob all emotion sprites to guarantee bundler bundling in Vite & Electron
const spriteModules = import.meta.glob<{ default: string }>(
  '/emotions/**/*.png',
  { eager: true }
);

export const ALL_EMOTIONS: EmotionType[] = [
  'Angry',
  'Anxious',
  'Blush',
  'Confused',
  'Crying',
  'Dizzy',
  'Exhausted',
  'Fever',
  'Frustrated',
  'Ghost',
  'Happy',
  'HeartEyes',
  'Hungry',
  'Idle',
  'MindBlown',
  'Pleading',
  'Sad',
  'Sick',
  'Sleepy',
  'Smug',
  'Squeeze',
  'StarStruck',
  'Surprised',
  'SweatSmile',
  'Talking',
  'Tapping',
  'TearsOfJoy',
  'Terrified',
  'Thinking',
  'Tired',
  'Touched',
  'Walking',
  'Wink',
  'Yummy'
];

export const ALL_DIRECTIONS: Direction[] = [
  'north',
  'north-east',
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west'
];

function resolveUrl(mod: any, fallback: string): string {
  if (!mod) return fallback;
  if (typeof mod === 'string') return mod;
  if (mod && typeof mod.default === 'string') return mod.default;
  return fallback;
}

/**
 * Get sprite URL for a static direction rotation
 */
export function getRotationSpriteUrl(emotion: EmotionType, direction: Direction): string {
  const pathKey = `/emotions/${emotion}/rotations/${direction}.png`;
  return resolveUrl(spriteModules[pathKey], pathKey);
}

/**
 * Get sprite URL for an animated frame in a direction
 */
export function getAnimationSpriteUrl(
  emotion: EmotionType,
  direction: Direction,
  frameIndex: number
): string {
  const pathKey = `/emotions/${emotion}/animations/${direction}_frame_${frameIndex}.png`;
  const mod = spriteModules[pathKey];
  if (mod) {
    return resolveUrl(mod, pathKey);
  }
  // Fallback to static rotation
  return getRotationSpriteUrl(emotion, direction);
}

/**
 * Number of animation frames for a given emotion
 * Walking & Tapping have 4 frames (0,1,2,3). All others have 2 frames (0,1).
 */
export function getFrameCount(emotion: EmotionType): number {
  if (emotion === 'Walking' || emotion === 'Tapping') {
    return 4;
  }
  return 2;
}

/**
 * Map angle in radians (or degrees) to one of 8 directions
 * 0 radians = East (moving right)
 * PI/2 radians = South (moving down)
 * PI radians = West (moving left)
 * -PI/2 radians = North (moving up)
 */
export function vectorToDirection(dx: number, dy: number): Direction {
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    return 'south';
  }

  // angle in degrees from -180 to 180
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  if (angle >= -22.5 && angle < 22.5) {
    return 'east';
  } else if (angle >= 22.5 && angle < 67.5) {
    return 'south-east';
  } else if (angle >= 67.5 && angle < 112.5) {
    return 'south';
  } else if (angle >= 112.5 && angle < 157.5) {
    return 'south-west';
  } else if (angle >= 157.5 || angle < -157.5) {
    return 'west';
  } else if (angle >= -157.5 && angle < -112.5) {
    return 'north-west';
  } else if (angle >= -112.5 && angle < -67.5) {
    return 'north';
  } else {
    return 'north-east';
  }
}
