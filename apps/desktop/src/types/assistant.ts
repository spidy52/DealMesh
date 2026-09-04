export type Direction = 
  | 'north' 
  | 'north-east' 
  | 'east' 
  | 'south-east' 
  | 'south' 
  | 'south-west' 
  | 'west' 
  | 'north-west';

export type EmotionType =
  | 'Angry'
  | 'Anxious'
  | 'Blush'
  | 'Confused'
  | 'Crying'
  | 'Dizzy'
  | 'Exhausted'
  | 'Fever'
  | 'Frustrated'
  | 'Ghost'
  | 'Happy'
  | 'HeartEyes'
  | 'Hungry'
  | 'Idle'
  | 'Listening'
  | 'MindBlown'
  | 'Pleading'
  | 'Sad'
  | 'Sick'
  | 'Sleepy'
  | 'Smug'
  | 'Squeeze'
  | 'StarStruck'
  | 'Surprised'
  | 'SweatSmile'
  | 'Talking'
  | 'Tapping'
  | 'TearsOfJoy'
  | 'Terrified'
  | 'Thinking'
  | 'Tired'
  | 'Touched'
  | 'Walking'
  | 'Wink'
  | 'Yummy';

export type AssistantState =
  | 'IDLE'
  | 'WALKING'
  | 'SLEEPING'
  | 'WAKING'
  | 'LISTENING'
  | 'THINKING'
  | 'WORKING'
  | 'SUCCESS'
  | 'ERROR'
  | 'DRAGGING'
  | 'INTERACTING';

export interface AssistantSettings {
  name: string;
  scale: number; // 1 to 3
  personality: 'friendly' | 'sassy' | 'hyper' | 'stoic';
  alwaysOnTop: boolean;
  startWithWindows: boolean;
  wanderingEnabled: boolean;
  wanderingInterval: number; // in seconds
  walkSpeed: number; // pixels per second
  clickThroughWhileSleeping: boolean;
  reduceMotion: boolean;
  soundEnabled: boolean;
  accentColor?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface ScreenBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DisplayInfo {
  id: number;
  bounds: ScreenBounds;
  workArea: ScreenBounds;
  scaleFactor: number;
  isPrimary: boolean;
}

// AI Decoupled Event Interfaces
export interface AssistantEvent {
  type: string;
  payload?: any;
  timestamp: number;
}

export interface AssistantCommand {
  action: 'wake' | 'sleep' | 'set_state' | 'set_emotion' | 'speak' | 'move_to' | 'walk_random';
  params?: any;
}

export interface SpeechMessage {
  id: string;
  text: string;
  durationMs?: number;
  quickReplies?: Array<{ label: string; action: string }>;
  emotion?: EmotionType;
}
