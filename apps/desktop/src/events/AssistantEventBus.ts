import { AssistantCommand, AssistantEvent, EmotionType, AssistantState } from '../types/assistant';

type EventCallback = (event: AssistantEvent) => void;
type CommandCallback = (command: AssistantCommand) => void;

class AssistantEventBus {
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private commandListeners: Set<CommandCallback> = new Set();

  /**
   * Emit an event from anywhere (backend, local simulation, voice engine, etc.)
   */
  public emitEvent(type: string, payload?: any): void {
    const event: AssistantEvent = {
      type,
      payload,
      timestamp: Date.now(),
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`Error handling event "${type}":`, err);
        }
      });
    }

    // Also fire wildcard listeners
    const allListeners = this.eventListeners.get('*');
    if (allListeners) {
      allListeners.forEach((cb) => cb(event));
    }
  }

  /**
   * Listen for specific event types
   */
  public onEvent(type: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);

    return () => {
      this.eventListeners.get(type)?.delete(callback);
    };
  }

  /**
   * Send a direct command to the assistant
   */
  public sendCommand(command: AssistantCommand): void {
    this.commandListeners.forEach((cb) => {
      try {
        cb(command);
      } catch (err) {
        console.error('Error handling assistant command:', err);
      }
    });
  }

  /**
   * Listen for assistant commands
   */
  public onCommand(callback: CommandCallback): () => void {
    this.commandListeners.add(callback);
    return () => {
      this.commandListeners.delete(callback);
    };
  }
}

export const eventBus = new AssistantEventBus();

/**
 * Standard simulated AI event handlers
 */
export function triggerSimulatedAiEvent(eventType: string, payload?: any) {
  eventBus.emitEvent(eventType, payload);
}
