import { AssistantState, EmotionType } from '../types/assistant';

export interface StateTransitionListener {
  (fromState: AssistantState, toState: AssistantState, emotion: EmotionType): void;
}

export class AssistantStateMachine {
  private currentState: AssistantState = 'IDLE';
  private currentEmotion: EmotionType = 'Idle';
  private idleTimer: any = null;
  private sleepTimeoutMs: number = 300000; // 5 minutes of inactivity -> sleep
  private listeners: StateTransitionListener[] = [];
  private lockState: boolean = false;

  constructor() {
    this.resetIdleTimer();
  }

  public getState(): AssistantState {
    return this.currentState;
  }

  public getEmotion(): EmotionType {
    return this.currentEmotion;
  }

  public subscribe(listener: StateTransitionListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(fromState: AssistantState, toState: AssistantState, emotion: EmotionType) {
    this.listeners.forEach((listener) => {
      try {
        listener(fromState, toState, emotion);
      } catch (err) {
        console.error('Error in state transition listener:', err);
      }
    });
  }

  public transition(nextState: AssistantState, customEmotion?: EmotionType) {
    if (this.lockState && nextState !== 'DRAGGING' && nextState !== 'IDLE') {
      return;
    }

    const fromState = this.currentState;
    this.currentState = nextState;

    // Determine default emotion for the state if not provided
    if (customEmotion) {
      this.currentEmotion = customEmotion;
    } else {
      this.currentEmotion = this.getDefaultEmotionForState(nextState);
    }

    this.notify(fromState, nextState, this.currentEmotion);

    // Reset sleep timer if not sleeping
    if (nextState !== 'SLEEPING') {
      this.resetIdleTimer();
    } else if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  public setEmotion(emotion: EmotionType) {
    this.currentEmotion = emotion;
    this.notify(this.currentState, this.currentState, emotion);
  }

  public setLock(lock: boolean) {
    this.lockState = lock;
  }

  public wake(reason: string = 'user') {
    if (this.currentState === 'SLEEPING') {
      this.transition('WAKING', 'Surprised');
      setTimeout(() => {
        if (this.currentState === 'WAKING') {
          this.transition('IDLE', 'Happy');
        }
      }, 1200);
    } else {
      this.transition('IDLE', 'Happy');
    }
  }

  public sleep() {
    this.transition('SLEEPING', 'Sleepy');
  }

  public startDragging() {
    this.transition('DRAGGING', 'Squeeze');
  }

  public stopDragging() {
    if (this.currentState === 'DRAGGING') {
      this.transition('IDLE', 'SweatSmile');
      setTimeout(() => {
        if (this.currentState === 'IDLE') {
          this.setEmotion('Idle');
        }
      }, 1500);
    }
  }

  public poke() {
    if (this.currentState === 'SLEEPING') {
      this.wake('poke');
    } else {
      const reactions: EmotionType[] = ['HeartEyes', 'Blush', 'StarStruck', 'Happy', 'Wink', 'Angry'];
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      this.setEmotion(randomReaction);
      setTimeout(() => {
        if (this.currentState === 'IDLE' || this.currentState === 'INTERACTING') {
          this.setEmotion('Idle');
        }
      }, 2500);
    }
  }

  public resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.idleTimer = setTimeout(() => {
      if (this.currentState === 'IDLE') {
        this.sleep();
      }
    }, this.sleepTimeoutMs);
  }

  public setSleepTimeout(ms: number) {
    this.sleepTimeoutMs = ms;
    this.resetIdleTimer();
  }

  public getDefaultEmotionForState(state: AssistantState): EmotionType {
    switch (state) {
      case 'IDLE':
        return 'Idle';
      case 'WALKING':
        return 'Walking';
      case 'SLEEPING':
        return 'Sleepy';
      case 'WAKING':
        return 'Surprised';
      case 'LISTENING':
        return 'Touched';
      case 'THINKING':
        return 'Thinking';
      case 'WORKING':
        return 'Tapping';
      case 'SUCCESS':
        return 'Happy';
      case 'ERROR':
        return 'Frustrated';
      case 'DRAGGING':
        return 'Squeeze';
      case 'INTERACTING':
        return 'Talking';
      default:
        return 'Idle';
    }
  }

  public destroy() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.listeners = [];
  }
}
