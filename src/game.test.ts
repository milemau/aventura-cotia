import { describe, expect, it } from 'vitest';
import { Runner, MAX_SPEED, LANE_WIDTH } from './game';

const advance = (game: Runner, seconds: number, fps = 60) => {
  for (let i = 0; i < seconds * fps; i++) game.update(1 / fps);
};
describe('runner rules', () => {
  it('runs automatically, progresses in speed and stays within three lanes', () => {
    const game = new Runner(); game.start();
    game.move(-1); game.move(-1); advance(game, 1);
    expect(game.lane).toBe(-1); expect(game.x).toBeCloseTo(-LANE_WIDTH);
    expect(game.distance).toBeGreaterThan(9); expect(game.speed).toBeGreaterThan(9);
    game.distance = 10000; game.update(1 / 60); expect(game.speed).toBe(MAX_SPEED);
  });
  it('ends on a log collision and freezes the score', () => {
    const game = new Runner(); game.start();
    game.entities.push({ kind: 'log', lane: 0, z: 2, active: true });
    advance(game, 1); expect(game.phase).toBe('over');
    const score = game.score; advance(game, 1); expect(game.score).toBe(score);
  });
  it('can jump over a log, disallows double jumps and lands', () => {
    const game = new Runner(); game.start(); game.jump();
    advance(game, 0.15); const vy = game.vy; game.jump(); expect(game.vy).toBe(vy);
    game.entities.push({ kind: 'log', lane: 0, z: 0.8, active: true });
    advance(game, 0.8); expect(game.phase).toBe('running'); expect(game.y).toBe(0);
  });
  it('can change lanes to avoid a log', () => {
    const game = new Runner(); game.start();
    game.entities.push({ kind: 'log', lane: 0, z: 6, active: true });
    game.move(1); advance(game, 1); expect(game.phase).toBe('running');
  });
  it('collects each coin once and adds ten points', () => {
    const game = new Runner(); game.start();
    game.entities.push({ kind: 'coin', lane: 0, z: 0.8, active: true });
    advance(game, 0.5); expect(game.coins).toBe(1);
    expect(game.score).toBe(Math.floor(game.distance) + 10);
  });
  it('freezes on pause and fully resets on restart', () => {
    const game = new Runner(); game.start(); game.jump(); advance(game, 0.2);
    game.togglePause(); const snapshot = JSON.stringify(game); advance(game, 1);
    expect(JSON.stringify(game)).toBe(snapshot); game.togglePause(); advance(game, 0.2);
    expect(game.distance).toBeGreaterThan(2); game.start();
    expect(game.distance).toBe(0); expect(game.coins).toBe(0); expect(game.y).toBe(0); expect(game.entities).toHaveLength(0);
  });
  it('is consistent at 30, 60 and 120 fps', () => {
    const distances = [30, 60, 120].map(fps => { const game = new Runner(() => 0); game.start(); advance(game, 8, fps); return game.distance; });
    expect(Math.max(...distances) - Math.min(...distances)).toBeLessThan(0.01);
  });
  it('generates a safe lane and bounds entity count on long runs', () => {
    for (const random of [0, 0.49, 0.9999]) {
      const game = new Runner(() => random); game.start();
      let maxCount = 0;
      for (let i = 0; i < 36000; i++) {
        game.entities.filter(e => e.kind === 'log' && e.z < 5).forEach(e => { e.active = false; });
        game.update(1 / 60); maxCount = Math.max(maxCount, game.entities.length);
        const log = game.entities.find(e => e.kind === 'log');
        if (log) expect(game.entities.filter(e => e.kind === 'coin').every(e => e.lane !== log.lane)).toBe(true);
      }
      expect(game.phase).toBe('running'); expect(maxCount).toBeLessThan(45);
    }
  });
});
