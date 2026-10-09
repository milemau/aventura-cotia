export type Phase = 'ready' | 'running' | 'paused' | 'over';
export type Entity = { kind: 'log' | 'coin'; lane: number; z: number; active: boolean };
export const LANE_WIDTH = 2.25;
export const MAX_SPEED = 22;
export const JUMP_SPEED = 9;
export const GRAVITY = 24;

/** Pure game rules: independent of rendering, frame rate and browser APIs. */
export class Runner {
  phase: Phase = 'ready';
  lane = 0;
  x = 0;
  y = 0;
  vy = 0;
  distance = 0;
  coins = 0;
  speed = 9;
  entities: Entity[] = [];
  private nextRow = 22;
  constructor(private random = Math.random) {}
  get score() { return Math.floor(this.distance) + this.coins * 10; }
  start() {
    this.phase = 'running'; this.lane = 0; this.x = 0; this.y = 0; this.vy = 0;
    this.distance = 0; this.coins = 0; this.speed = 9; this.nextRow = 22;
    this.entities = [];
  }
  move(direction: number) {
    if (this.phase === 'running') this.lane = Math.max(-1, Math.min(1, this.lane + direction));
  }
  jump() {
    if (this.phase === 'running' && this.y === 0) this.vy = JUMP_SPEED;
  }
  togglePause() {
    if (this.phase === 'running') this.phase = 'paused';
    else if (this.phase === 'paused') this.phase = 'running';
  }
  update(dt: number) {
    if (this.phase !== 'running') return;
    // Small steps preserve collision checks even after a slow frame.
    let remaining = Math.min(Math.max(dt, 0), 0.1);
    while (remaining > 0 && this.phase === 'running') {
      const step = Math.min(remaining, 1 / 120);
      this.step(step); remaining -= step;
    }
  }
  private step(dt: number) {
    this.speed = Math.min(MAX_SPEED, 9 + this.distance / 130);
    const travel = this.speed * dt;
    this.distance += travel;
    this.x += (this.lane * LANE_WIDTH - this.x) * (1 - Math.exp(-17 * dt));
    if (this.vy !== 0 || this.y > 0) {
      this.y = Math.max(0, this.y + this.vy * dt - GRAVITY * dt * dt / 2);
      this.vy -= GRAVITY * dt;
      if (this.y === 0) this.vy = 0;
    }
    this.nextRow -= travel;
    if (this.nextRow <= 0) {
      // Exactly one blocked lane per row; spacing grows with speed.
      const lane = Math.floor(this.random() * 3) - 1;
      this.entities.push({ kind: 'log', lane, z: 72, active: true });
      const coinLane = (lane + 1 + Math.floor(this.random() * 2) + 1) % 3 - 1;
      for (let i = 0; i < 4; i++) this.entities.push({ kind: 'coin', lane: coinLane, z: 72 + i * 2.1, active: true });
      this.nextRow = Math.max(15, this.speed * 1.55);
    }
    for (const entity of this.entities) {
      entity.z -= travel;
      if (!entity.active || Math.abs(entity.z) > 0.85) continue;
      const dx = Math.abs(this.x - entity.lane * LANE_WIDTH);
      if (entity.kind === 'log' && dx < 1.02 && this.y < 0.88) this.phase = 'over';
      if (entity.kind === 'coin' && dx < 0.85 && this.y < 1.45) {
        entity.active = false; this.coins++;
      }
    }
    this.entities = this.entities.filter(e => e.z > -9 && e.active);
  }
}
