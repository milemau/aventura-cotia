import './style.css';
import { Runner } from './game';
import { createWorld } from './world';
import { setupTeaching, teachingMarkup } from './teaching';

const icons: Record<string, string> = {
  leaf: '<path d="M20 4c-9-2-16 3-15 10 1 5 9 7 12 2 2-3 2-7 3-12Z"/><path d="m4 21 10-11"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  jump: '<path d="M12 20V4m-6 6 6-6 6 6"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8m-2-7h3m-3 6h3"/>',
  trophy: '<path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6"/>',
  code: '<path d="m7 6-6 6 6 6m10-12 6 6-6 6M14 3l-4 18"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
};
const icon = (name: string, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const save = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Private browsing may disable persistence. */ } };
let best = Math.max(0, Number(read('cotia-best')) || 0);
let muted = read('cotia-muted') === 'true';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="./" aria-label="Aventura da Cotia, início"><img src="./icon.svg" alt=""/><span>aventura<span class="brand-bottom">da cotia</span></span></a>
    <span class="header-note">FEITO PARA EXPLORAR. E APRENDER.</span>
    <button id="about" class="text-button">${icon('code')}<span>Como isso é feito?</span></button>
  </header>
  <main class="layout">
    <section class="introduction">
      <span class="eyebrow"><span class="dot"></span> UMA AVENTURA NA MATA</span>
      <h1>Aventura<br/>da <span>Cotia<span class="title-dot">.</span></span></h1>
      <p class="intro-copy">Pequenas patas.<br/>Grandes descobertas.</p>
      <p class="intro-description">Entre na trilha, junte moedas e ajude nossa exploradora a ir cada vez mais longe.</p>
      <div class="forest-note">${icon('leaf')}<p>O próximo caminho<br/>começa com um pulo.</p></div>
      <div class="edition"><span>01</span> A TRILHA DA FLORESTA</div>
    </section>
    <section class="game-shell" aria-label="Jogo Aventura da Cotia">
      <canvas id="game" aria-label="Pista 3D com três faixas. Use as setas para desviar e espaço para pular." tabindex="0"></canvas>
      <div class="game-top">
        <span class="location">${icon('leaf')} Trilha da floresta</span>
        <div class="game-actions"><button id="sound" class="round-button" aria-label="Desativar som"></button><button id="pause" class="round-button" aria-label="Pausar jogo" hidden>${icon('pause')}</button></div>
      </div>
      <div id="hud" class="hud" hidden><div><span>PONTOS</span><strong id="score">0000</strong></div><div class="coin-counter">${icon('coin')}<strong id="coins">0</strong></div></div>
      <div id="overlay" class="overlay">
        <div id="welcome" class="welcome"><span class="small-label">A FLORESTA ESTÁ CHAMANDO</span><h2>Vamos nessa?</h2><p>Desvie dos troncos, pegue moedas<br/>e descubra até onde você consegue ir.</p></div>
        <div id="result" hidden><span id="result-label" class="small-label">CADA CORRIDA É UMA DESCOBERTA</span><h2 id="result-title">Boa aventura!</h2><div class="result-stats"><div><strong id="final-score">0</strong><span>pontos</span></div><div><strong id="final-coins">0</strong><span>moedas</span></div><div><strong id="final-distance">0</strong><span>metros</span></div></div></div>
        <div id="paused" hidden><span class="small-label">UMA PAUSA PARA RESPIRAR</span><h2>A trilha espera.</h2><p>Continue quando estiver pronto.</p></div>
        <button id="start" class="primary-button"><span>Começar aventura</span>${icon('arrow')}</button>
        <span id="start-hint" class="start-hint">Sem pressa. A primeira aventura é para aprender.</span>
      </div>
      <div id="touch-controls" class="touch-controls" hidden><button data-move="-1" aria-label="Ir para a esquerda">${icon('arrow', 'flip')}</button><button id="jump" aria-label="Pular">${icon('jump')}<span>PULAR</span></button><button data-move="1" aria-label="Ir para a direita">${icon('arrow')}</button></div>
      <div class="game-bottom"><span class="live-dot"></span><span id="game-caption">Um pequeno salto para uma grande aventura</span></div>
      <div id="loading" class="loading">Preparando a trilha…</div>
    </section>
    <aside class="guide">
      <div class="record-card">${icon('trophy')}<span>SEU RECORDE</span><strong id="best">${best.toLocaleString('pt-BR')}</strong><small>pontos de aventura</small></div>
      <div class="how-to"><span class="eyebrow">GUIA DO EXPLORADOR</span><h2>É só dar<br/>o primeiro passo.</h2><div class="instruction"><span class="instruction-symbol">↔</span><div><strong>Escolha seu caminho</strong><p>Deslize para os lados<br/>ou use ← e →.</p></div></div><div class="instruction"><span class="instruction-symbol">↑</span><div><strong>Pule os troncos</strong><p>Deslize para cima<br/>ou aperte espaço.</p></div></div><div class="instruction"><span class="instruction-symbol gold-symbol">${icon('coin')}</span><div><strong>Colecione descobertas</strong><p>Cada moeda vale<br/>10 pontos extras.</p></div></div></div>
      <div class="tip">${icon('leaf')}<p><strong>Você sabia?</strong> A cotia ajuda a floresta a crescer ao enterrar sementes!</p></div>
    </aside>
  </main>
  <footer><span>Feito com curiosidade <span class="footer-star">✳</span> e um pouquinho de código.</span><span>EXPLORE · APRENDA · DIVIRTA-SE</span><button id="install" class="text-button" hidden>Instalar jogo ↓</button></footer>
  ${teachingMarkup}
  <div id="announcer" class="sr-only" role="status" aria-live="polite"></div>
`;
const get = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const game = new Runner();
let audio: AudioContext | undefined;
function activateAudio() {
  if (muted) return;
  try { audio ??= new AudioContext(); void audio.resume().catch(() => {}); } catch { /* Sound is optional. */ }
}
function tone(frequency: number, duration: number, type: OscillatorType = 'sine') {
  if (muted || !audio || audio.state !== 'running') return;
  const oscillator = audio.createOscillator(); const gain = audio.createGain();
  oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
  gain.gain.setValueAtTime(0.055, audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
function updateSoundButton() {
  get('sound').innerHTML = icon(muted ? 'mute' : 'sound');
  get('sound').setAttribute('aria-label', muted ? 'Ativar som' : 'Desativar som');
  get('sound').setAttribute('aria-pressed', String(!muted));
}
updateSoundButton();
get('sound').onclick = () => { muted = !muted; save('cotia-muted', String(muted)); activateAudio(); updateSoundButton(); };
let lastScore = -1; let lastCoins = 0;
function syncPhase() {
  const playing = game.phase === 'running'; const over = game.phase === 'over'; const paused = game.phase === 'paused';
  get('overlay').hidden = playing; get('welcome').hidden = game.phase !== 'ready';
  get('result').hidden = !over; get('paused').hidden = !paused;
  get('hud').hidden = game.phase === 'ready'; get('pause').hidden = !playing;
  get('touch-controls').hidden = !playing; get('start-hint').hidden = paused;
  get('start').innerHTML = `<span>${paused ? 'Continuar aventura' : over ? 'Tentar de novo' : 'Começar aventura'}</span>${icon('arrow')}`;
  get('start-hint').textContent = over ? 'Cada tentativa é um novo caminho.' : 'Sem pressa. A primeira aventura é para aprender.';
  get('game-caption').textContent = playing ? 'Siga as moedas. Encontre seu caminho.' : 'Um pequeno salto para uma grande aventura';
  if (over) {
    const newRecord = game.score > best;
    best = Math.max(best, game.score); save('cotia-best', String(best));
    get('best').textContent = best.toLocaleString('pt-BR');
    get('final-score').textContent = game.score.toLocaleString('pt-BR');
    get('final-coins').textContent = String(game.coins); get('final-distance').textContent = String(Math.floor(game.distance));
    get('result-title').textContent = newRecord ? 'Novo recorde!' : 'Boa aventura!';
    get('announcer').textContent = `Fim da aventura! ${game.score} pontos e ${game.coins} moedas.`;
    tone(160, 0.25, 'triangle'); get('start').focus({ preventScroll: true });
  }
  if (paused) get('start').focus({ preventScroll: true });
}
function start() {
  activateAudio();
  if (game.phase === 'paused') game.togglePause();
  else { game.start(); lastScore = -1; lastCoins = 0; get('coins').textContent = '0'; }
  syncPhase(); get('game').focus({ preventScroll: true });
}
function pause() { game.togglePause(); syncPhase(); }
function jump() { const canJump = game.phase === 'running' && game.y === 0; game.jump(); if (canJump) tone(390, 0.1, 'triangle'); }
get('start').onclick = start; get('pause').onclick = pause; get('jump').onclick = jump;
document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(button => { button.onclick = () => game.move(Number(button.dataset.move)); });
const dialog = get<HTMLDialogElement>('about-dialog');
setupTeaching(dialog);
get('about').onclick = () => { if (game.phase === 'running') pause(); dialog.showModal(); };
get('close-about').onclick = () => dialog.close();
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
window.addEventListener('keydown', event => {
  if (dialog.open || (event.target instanceof HTMLButtonElement && [' ', 'Enter'].includes(event.key))) return;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'Escape', 'p', 'P', 'a', 'd', 'w'].includes(event.key)) {
    event.preventDefault(); if (event.repeat) return;
    if (event.key === 'ArrowLeft' || event.key === 'a') game.move(-1);
    if (event.key === 'ArrowRight' || event.key === 'd') game.move(1);
    if (['ArrowUp', ' ', 'w'].includes(event.key)) jump();
    if (['Escape', 'p', 'P'].includes(event.key)) pause();
  }
});
const canvas = get<HTMLCanvasElement>('game');
let pointer: { x: number; y: number; id: number } | undefined;
canvas.addEventListener('pointerdown', event => { pointer = { x: event.clientX, y: event.clientY, id: event.pointerId }; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointerup', event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const dx = event.clientX - pointer.x; const dy = event.clientY - pointer.y; pointer = undefined;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) game.move(Math.sign(dx)); else if (dy < 0) jump();
});
canvas.addEventListener('pointercancel', () => { pointer = undefined; });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.phase === 'running') pause(); });
window.addEventListener('blur', () => { if (game.phase === 'running') pause(); });

try {
  const world = createWorld(canvas, game);
  void world.ready().then(() => { get('loading').hidden = true; });
  world.run(dt => {
    const phase = game.phase; game.update(dt);
    if (game.score !== lastScore) { get('score').textContent = String(game.score).padStart(4, '0'); lastScore = game.score; }
    if (game.coins !== lastCoins) { get('coins').textContent = String(game.coins); if (game.coins > lastCoins) tone(880, 0.09); lastCoins = game.coins; }
    if (phase !== game.phase) syncPhase();
  });
  if (import.meta.hot) import.meta.hot.dispose(() => world.dispose());
} catch (error) {
  get('loading').textContent = 'Não foi possível abrir o 3D. Tente um navegador com WebGL e aceleração gráfica ativada.';
  get<HTMLButtonElement>('start').disabled = true; console.error(error);
}

interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
let installPrompt: InstallPrompt | undefined;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event as InstallPrompt; get('install').hidden = false; });
get('install').onclick = async () => { if (!installPrompt) return; await installPrompt.prompt(); await installPrompt.userChoice; installPrompt = undefined; get('install').hidden = true; };
window.addEventListener('appinstalled', () => { get('install').hidden = true; });
