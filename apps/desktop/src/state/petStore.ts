export type PetState =
  | 'SLEEPING'
  | 'IDLE'
  | 'WALK'
  | 'WAKING'
  | 'LISTENING'
  | 'THINKING'
  | 'SEARCHING'
  | 'BROWSING'
  | 'NEGOTIATING'
  | 'COMPARING'
  | 'FOUND_DEAL'
  | 'ASKING_APPROVAL'
  | 'PAYING'
  | 'SUCCESS'
  | 'ERROR'
  | 'RECOVERING'
  | 'RETURNING_TO_SLEEP';

export type PetSpecies = 'Fox' | 'Cat' | 'Dog' | 'Custom';
export type PetPersonality = 'Playful' | 'Professional' | 'Friendly' | 'Minimal';
export type PetDirection = 'south' | 'north' | 'east' | 'west' | 'south-east' | 'south-west' | 'north-east' | 'north-west';

export interface DealData {
  title: string;
  originalPrice: number;
  agreedPrice: number;
  savings: number;
  merchantName: string;
  trustScore: number;
  imageUrl?: string;
  offerId: string;
}

export interface HudStats {
  storesChecked: number;
  productsFound: number;
  aiMerchants: number;
  negotiating: number;
  currentThought: string;
}

export interface PetConfig {
  name: string;
  species: PetSpecies;
  personality: PetPersonality;
  size: 'Small' | 'Medium' | 'Large';
  alwaysOnTop: boolean;
  allowClickThroughWhileSleeping: boolean;
  startWithWindows: boolean;
  backendUrl: string;
}

export const DEFAULT_CONFIG: PetConfig = {
  name: 'Omni',
  species: 'Fox',
  personality: 'Playful',
  size: 'Medium',
  alwaysOnTop: true,
  allowClickThroughWhileSleeping: true,
  startWithWindows: true,
  backendUrl: 'ws://localhost:8000/ws/pet',
};
