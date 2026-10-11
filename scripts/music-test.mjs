import { chromium, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const url = process.env.TEST_URL || 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Math.random = () => 0.5;
    const NativeAudioContext = window.AudioContext;
    window.audioProbe = { contexts: [], analysers: [], active: 0, peakVoices: 0 };
    window.AudioContext = class extends NativeAudioContext {
      constructor(...args) { super(...args); window.audioProbe.contexts.push(this); }
      createGain() {
        const gain = super.createGain();
        if (!window.audioProbe.analysers.length) {
          const analyser = this.createAnalyser();
          analyser.fftSize = 2048;
          gain.connect(analyser);
          window.audioProbe.analysers.push(analyser);
        }
        return gain;
      }
      track(source) {
        const probe = window.audioProbe;
        probe.active++;
        probe.peakVoices = Math.max(probe.peakVoices, probe.active);
        source.addEventListener('ended', () => probe.active--);
        return source;
      }
      createOscillator() { return this.track(super.createOscillator()); }
      createBufferSource() { return this.track(super.createBufferSource()); }
    };
  });
  await page.goto(url);
  await expect(page.locator('#loading')).toBeHidden();
  expect(await page.evaluate(() => window.audioProbe.contexts.length)).toBe(0);
  const rms = () => page.evaluate(() => {
    const analyser = window.audioProbe.analysers[0];
    if (!analyser) return 0;
    const samples = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(samples);
    return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
  });
  const audible = () => expect.poll(rms).toBeGreaterThan(0.002);
  const silent = () => expect.poll(rms).toBeLessThan(0.00001);
  await page.locator('#start').click();
  await page.keyboard.press('ArrowLeft');
  await audible();
  await page.locator('#sound').click();
  await silent();
  await expect.poll(() => page.evaluate(() => window.audioProbe.active)).toBe(0);
  await page.locator('#sound').click();
  await audible();
  await page.locator('#pause').click();
  await silent();
  await page.locator('#start').click();
  await audible();
  await page.locator('#about').click();
  await expect(page.locator('#paused')).toBeVisible();
  await silent();
  await page.locator('#close-about').click();
  await page.locator('#start').click();
  await audible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#result')).toBeVisible({ timeout: 20000 });
  await silent();
  await expect.poll(() => page.evaluate(() => window.audioProbe.active)).toBe(0);
  await page.locator('#start').click();
  await audible();
  await page.locator('#pause').click();
  await silent();
  const live = await page.evaluate(() => ({ contexts: window.audioProbe.contexts.length, peakVoices: window.audioProbe.peakVoices }));
  expect(live.contexts).toBe(1);
  expect(live.peakVoices).toBeLessThan(24);

  // Render the entire score with real Web Audio nodes, using a virtual scheduler
  // clock so loop and headroom checks do not require a 77-second real-time wait.
  const source = ts.transpileModule(await readFile('src/music.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  const render = await page.evaluate(async source => {
    const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    const { ForestMusic } = await import(moduleUrl);
    URL.revokeObjectURL(moduleUrl);
    const sampleRate = 24000;
    const offline = new OfflineAudioContext(1, sampleRate * 78, sampleRate);
    let currentTime = 0;
    let tick;
    const clock = {
      get currentTime() { return currentTime; },
      state: 'running', sampleRate, destination: offline.destination,
    };
    for (const method of ['createGain', 'createPeriodicWave', 'createBuffer', 'createOscillator', 'createBufferSource', 'createBiquadFilter']) {
      clock[method] = offline[method].bind(offline);
    }
    const nativeSetInterval = window.setInterval;
    const nativeClearInterval = window.clearInterval;
    window.setInterval = callback => { tick = callback; return 1; };
    window.clearInterval = () => {};
    try {
      const music = new ForestMusic(clock);
      music.setPlaying(true);
      for (currentTime = 0.05; currentTime < 78; currentTime += 0.05) tick();
    } finally {
      window.setInterval = nativeSetInterval;
      window.clearInterval = nativeClearInterval;
    }
    const samples = (await offline.startRendering()).getChannelData(0);
    let peak = 0;
    let sum = 0;
    let finite = true;
    for (const sample of samples) {
      peak = Math.max(peak, Math.abs(sample));
      sum += sample * sample;
      finite &&= Number.isFinite(sample);
    }
    const energy = (start, end) => {
      const section = samples.subarray(Math.floor(start * sampleRate), Math.floor(end * sampleRate));
      return Math.sqrt(section.reduce((sum, sample) => sum + sample * sample, 0) / section.length);
    };
    return {
      finite, peak, rms: Math.sqrt(sum / samples.length),
      barRms: Array.from({ length: 32 }, (_, bar) => energy(bar * 2.4 + 0.035, (bar + 1) * 2.4 + 0.035)),
      beforeLoop: energy(76.4, 76.8), afterLoop: energy(76.835, 77.235),
    };
  }, source);
  expect(render.finite).toBe(true);
  expect(render.peak).toBeLessThan(0.9);
  expect(render.rms).toBeGreaterThan(0.01);
  expect(Math.min(...render.barRms)).toBeGreaterThan(0.005);
  // The phrase ends quietly; check for signal rather than demanding a loud tail.
  expect(render.beforeLoop).toBeGreaterThan(0.0005);
  expect(render.afterLoop).toBeGreaterThan(0.005);
  expect(errors).toEqual([]);
  console.log(`Music playback, mute, pause, teaching dialog, game over, restart and full loop passed. Peak ${render.peak.toFixed(3)}, RMS ${render.rms.toFixed(3)}, max ${live.peakVoices} concurrent voices.`);
} finally { await browser.close(); }
