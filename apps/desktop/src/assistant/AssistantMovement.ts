import { Direction, Position, ScreenBounds } from '../types/assistant';
import { vectorToDirection } from './assetLoader';

export interface MovementUpdateCallback {
  (pos: Position, direction: Direction, isMoving: boolean): void;
}

export class AssistantMovement {
  private currentPos: Position = { x: 400, y: 400 };
  private targetPos: Position = { x: 400, y: 400 };
  private currentDirection: Direction = 'south';
  private isMoving: boolean = false;
  private walkSpeed: number = 80;
  private bounds: ScreenBounds = {
    x: 0,
    y: 0,
    width: typeof window !== 'undefined' ? window.screen.availWidth || 1366 : 1366,
    height: typeof window !== 'undefined' ? window.screen.availHeight || 768 : 768,
  };

  private wanderingTimer: any = null;
  private wanderingEnabled: boolean = false;
  private wanderingInterval: number = 6;
  private animFrameId: number | null = null;
  private lastTimestamp: number = 0;

  private onUpdate: MovementUpdateCallback | null = null;
  private onArrival: (() => void) | null = null;

  constructor(
    initialPos: Position = { x: 400, y: 400 },
    bounds?: ScreenBounds,
    onUpdate?: MovementUpdateCallback
  ) {
    this.currentPos = { ...initialPos };
    this.targetPos = { ...initialPos };
    if (bounds && bounds.width > 0) {
      this.bounds = bounds;
    }
    if (onUpdate) {
      this.onUpdate = onUpdate;
    }
  }

  public setBounds(bounds: ScreenBounds) {
    if (bounds && bounds.width > 0) {
      this.bounds = bounds;
    }
  }

  public setPosition(pos: Position) {
    this.currentPos = { ...pos };
    this.targetPos = { ...pos };
    this.isMoving = false;
    this.notify();
  }

  public setDirection(dir: Direction) {
    this.currentDirection = dir;
    this.notify();
  }

  public getPosition(): Position {
    return { ...this.currentPos };
  }

  public getDirection(): Direction {
    return this.currentDirection;
  }

  public getIsMoving(): boolean {
    return this.isMoving;
  }

  public setSpeed(speed: number) {
    this.walkSpeed = Math.max(30, Math.min(250, speed));
  }

  public setScale(_scale: number) {
    // Movement scale handler
  }

  public setWanderingEnabled(enabled: boolean) {
    this.wanderingEnabled = enabled;
    if (enabled) {
      this.scheduleNextWander();
    } else {
      if (this.wanderingTimer) {
        clearTimeout(this.wanderingTimer);
        this.wanderingTimer = null;
      }
      this.stop();
    }
  }

  public setWanderingInterval(seconds: number) {
    this.wanderingInterval = Math.max(3, seconds);
  }

  public setOnUpdate(cb: MovementUpdateCallback) {
    this.onUpdate = cb;
  }

  public setOnArrival(cb: () => void) {
    this.onArrival = cb;
  }

  private getMovementLimits() {
    const screenW = (this.bounds && this.bounds.width > 0) ? this.bounds.width : (typeof window !== 'undefined' ? window.screen.availWidth : 1366);
    const screenH = (this.bounds && this.bounds.height > 0) ? this.bounds.height : (typeof window !== 'undefined' ? window.screen.availHeight : 768);
    const originX = this.bounds ? this.bounds.x : 0;
    const originY = this.bounds ? this.bounds.y : 0;

    return {
      minX: originX + 180,           // 180px safe distance from left edge
      maxX: originX + screenW - 320, // 320px safe distance from right edge
      minY: originY + 160,           // 160px safe distance from top edge
      maxY: originY + screenH - 280, // 280px safe distance from bottom taskbar
    };
  }

  public moveTo(target: Position, onArrival?: () => void) {
    const { minX, maxX, minY, maxY } = this.getMovementLimits();

    this.targetPos = {
      x: Math.max(minX, Math.min(maxX, target.x)),
      y: Math.max(minY, Math.min(maxY, target.y)),
    };

    if (onArrival) {
      this.onArrival = onArrival;
    }

    const dx = this.targetPos.x - this.currentPos.x;
    const dy = this.targetPos.y - this.currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      this.isMoving = false;
      this.currentDirection = 'south';
      this.notify();
      if (this.onArrival) {
        const arrivalCb = this.onArrival;
        this.onArrival = null;
        arrivalCb();
      }
      this.scheduleNextWander();
      return;
    }

    this.isMoving = true;
    this.currentDirection = vectorToDirection(dx, dy);
    this.startAnimationLoop();
  }

  public stop() {
    this.isMoving = false;
    this.targetPos = { ...this.currentPos };
    this.currentDirection = 'south';
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.notify();
  }

  public wanderRandomly() {
    const { minX, maxX, minY, maxY } = this.getMovementLimits();

    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 240;

    let targetX = this.currentPos.x + Math.cos(angle) * distance;
    let targetY = this.currentPos.y + Math.sin(angle) * distance;

    targetX = Math.max(minX, Math.min(maxX, targetX));
    targetY = Math.max(minY, Math.min(maxY, targetY));

    this.moveTo({ x: targetX, y: targetY });
  }

  public moveToBottomCenter(onArrival?: () => void) {
    const screenW = (this.bounds && this.bounds.width > 0) ? this.bounds.width : (typeof window !== 'undefined' ? window.screen.availWidth : 1366);
    const screenH = (this.bounds && this.bounds.height > 0) ? this.bounds.height : (typeof window !== 'undefined' ? window.screen.availHeight : 768);
    const originX = this.bounds ? this.bounds.x : 0;
    const originY = this.bounds ? this.bounds.y : 0;

    // Center horizontally, position comfortably above Windows taskbar (safe bottom margin)
    const targetX = Math.round(originX + (screenW - 200) / 2);
    const targetY = Math.round(originY + screenH - 340);

    this.targetPos = { x: targetX, y: targetY };
    if (onArrival) {
      this.onArrival = onArrival;
    }

    const dx = this.targetPos.x - this.currentPos.x;
    const dy = this.targetPos.y - this.currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 8) {
      this.isMoving = false;
      this.currentDirection = 'south';
      this.notify();
      if (this.onArrival) {
        const cb = this.onArrival;
        this.onArrival = null;
        cb();
      }
      return;
    }

    this.isMoving = true;
    this.currentDirection = vectorToDirection(dx, dy);
    this.startAnimationLoop();
  }

  public scheduleNextWander() {
    if (this.wanderingTimer) {
      clearTimeout(this.wanderingTimer);
      this.wanderingTimer = null;
    }

    if (!this.wanderingEnabled) return;

    const delay = (this.wanderingInterval * 0.7 + Math.random() * this.wanderingInterval * 0.6) * 1000;

    this.wanderingTimer = setTimeout(() => {
      if (this.wanderingEnabled && !this.isMoving) {
        this.wanderRandomly();
      }
    }, delay);
  }

  private startAnimationLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.lastTimestamp = performance.now();
    this.animFrameId = requestAnimationFrame(this.updateLoop.bind(this));
  }

  private updateLoop(timestamp: number) {
    if (!this.isMoving) {
      this.animFrameId = null;
      return;
    }

    const dt = Math.min(0.08, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    const dx = this.targetPos.x - this.currentPos.x;
    const dy = this.targetPos.y - this.currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const step = this.walkSpeed * dt;

    if (distance <= step || distance < 2) {
      this.currentPos = { ...this.targetPos };
      this.isMoving = false;
      this.currentDirection = 'south';
      this.animFrameId = null;
      this.notify();

      if (this.onArrival) {
        const cb = this.onArrival;
        this.onArrival = null;
        cb();
      }

      this.scheduleNextWander();
      return;
    }

    const ratio = step / distance;
    this.currentPos.x += dx * ratio;
    this.currentPos.y += dy * ratio;

    // Strict boundary enforcement on every frame
    const { minX, maxX, minY, maxY } = this.getMovementLimits();
    this.currentPos.x = Math.max(minX, Math.min(maxX, this.currentPos.x));
    this.currentPos.y = Math.max(minY, Math.min(maxY, this.currentPos.y));

    this.currentDirection = vectorToDirection(dx, dy);

    this.notify();

    this.animFrameId = requestAnimationFrame(this.updateLoop.bind(this));
  }

  private notify() {
    if (this.onUpdate) {
      this.onUpdate({ ...this.currentPos }, this.currentDirection, this.isMoving);
    }
  }

  public destroy() {
    if (this.wanderingTimer) {
      clearTimeout(this.wanderingTimer);
      this.wanderingTimer = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.onUpdate = null;
    this.onArrival = null;
  }
}
