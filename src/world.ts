import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { Runner, LANE_WIDTH } from './game';
import { createCotia } from './cotia';

export function createWorld(canvas: HTMLCanvasElement, game: Runner) {
  const engine = new Engine(canvas, true, { stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false }, false);
  const resize = () => { engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio, 1.5)); engine.resize(); };
  resize();
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.69, 0.82, 0.72, 1);
  scene.fogMode = Scene.FOGMODE_LINEAR; scene.fogStart = 30; scene.fogEnd = 95;
  scene.fogColor = new Color3(0.69, 0.82, 0.72);
  const camera = new FreeCamera('camera', new Vector3(0, 6.6, -11.5), scene);
  camera.setTarget(new Vector3(0, 1.15, 14)); camera.fov = 0.9; camera.minZ = 0.1; camera.maxZ = 120;
  const ambient = new HemisphericLight('daylight', new Vector3(0.2, 1, -0.4), scene);
  ambient.intensity = 0.72; ambient.groundColor = Color3.FromHexString('#506947');
  const sunlight = new DirectionalLight('sunlight', new Vector3(-0.5, -1, 0.5), scene);
  sunlight.intensity = 0.38;
  const material = (name: string, hex: string) => {
    const m = new StandardMaterial(name, scene); m.diffuseColor = Color3.FromHexString(hex);
    m.specularColor = Color3.Black(); return m;
  };
  const grass = material('grass', '#72975b');
  const path = material('warm earth', '#dbbe8d');
  const edge = material('path edges', '#a6b574');
  const dash = material('lane markers', '#eee0b6');
  const bark = material('bark', '#80563b');
  const cut = material('cut wood', '#e7ba79');
  const ring = material('wood rings', '#ac7747');
  const foliage = ['#426d48', '#628c4a', '#7d9d53', '#315d43'].map((c, i) => material(`leaves${i}`, c));
  //const foliage = ['#4b426d', '#0b109d', '#0b109d', '#0b109d'].map((c, i) => material(`leaves${i}`, c));

  const gold = material('gold', '#ffd35a'); gold.emissiveColor = new Color3(0.14, 0.07, 0);
  const goldCenter = material('gold inset', '#efad32');
  const shadowMat = material('soft contact', '#667449'); shadowMat.alpha = 0.23;
  const box = (name: string, size: number[], at: number[], mat: StandardMaterial, parent?: TransformNode) => {
    const m = CreateBox(name, { width: size[0], height: size[1], depth: size[2] }, scene);
    m.position.set(at[0], at[1], at[2]); m.material = mat; if (parent) m.parent = parent; return m;
  };
  const sphere = (name: string, size: number[], at: number[], mat: StandardMaterial, parent?: TransformNode) => {
    const m = CreateSphere(name, { diameter: 1, segments: 3 }, scene);
    m.scaling.set(size[0], size[1], size[2]); m.position.set(at[0], at[1], at[2]);
    m.material = mat; if (parent) m.parent = parent; return m;
  };
  box('forest floor', [160, 0.2, 130], [0, -0.28, 45], grass);
  box('verge', [8.2, 0.13, 130], [0, -0.12, 45], edge);
  box('trail', [7.25, 0.1, 130], [0, -0.045, 45], path);
  const markers: Mesh[] = [];
  for (let z = -10; z < 100; z += 5) for (const x of [-1.125, 1.125]) {
    markers.push(box('trail mark', [0.055, 0.014, 1.25], [x, 0.02, z], dash));
  }
  // Recycle scenery and gameplay meshes; memory does not grow with distance.
  const trees: TransformNode[] = [];
  for (let i = 0; i < 40; i++) {
    const root = new TransformNode('tree', scene);
    const side = i % 2 === 0 ? -1 : 1;
    root.position.set(side * (5 + (i * 7 % 11)), 0, (i >> 1) * 5 - 10);
    const height = 3.5 + (i % 5) * 0.7;
    const trunk = CreateCylinder('trunk', { height, diameterTop: 0.3, diameterBottom: 0.55, tessellation: 6 }, scene);
    trunk.position.y = height / 2; trunk.material = bark; trunk.parent = root;
    sphere('crown', [3.4, 3.9, 3.3], [0, height + 0.1, 0], foliage[i % 4], root);
    sphere('crown side', [2.7, 2.5, 2.6], [1, height - 0.2, 0.25], foliage[(i + 1) % 4], root);
    sphere('tree shade', [4.2, 0.02, 3.1], [0.5, 0.015, 0], shadowMat, root);
    trees.push(root);
  }
  const plants: TransformNode[] = [];
  for (let i = 0; i < 44; i++) {
    const root = new TransformNode('undergrowth', scene);
    root.position.set((i % 2 ? 1 : -1) * (4 + (i * 3 % 8) * 0.6), 0, i * 2.5 - 10);
    for (let j = 0; j < 3; j++) {
      const leaf = sphere('leaf', [0.32, 0.9 + j * 0.25, 0.2], [(j - 1) * 0.23, 0.35, 0], foliage[(i + 2) % 4], root);
      leaf.rotation.z = (j - 1) * -0.55;
    }
    if (i % 5 === 0) sphere('pebble', [0.8, 0.45, 0.6], [0.4, 0.16, 0.7], edge, root);
    plants.push(root);
  }
  const character = createCotia(scene);
  const cotia = character.root;
  const shadow = sphere('cotia shadow', [1.1, 0.015, 0.95], [0, 0.025, 0], shadowMat);
  const makeLog = () => {
    const root = new TransformNode('fallen log', scene);
    const cylinder = (name: string, diameter: number, length: number, x: number, mat: StandardMaterial) => {
      const mesh = CreateCylinder(name, { diameter, height: length, tessellation: 9 }, scene);
      mesh.rotation.z = Math.PI / 2; mesh.position.set(x, 0.48, 0); mesh.material = mat; mesh.parent = root;
    };
    cylinder('log bark', 0.94, 1.65, 0, bark);
    for (const side of [-1, 1]) {
      cylinder('wood end', 0.78, 0.022, side * 0.837, cut);
      cylinder('growth ring', 0.5, 0.025, side * 0.851, ring);
      cylinder('wood core', 0.36, 0.026, side * 0.87, cut);
    }
    box('bark ridge', [1.55, 0.07, 0.07], [0, 0.91, -0.05], ring, root);
    return root;
  };
  const makeCoin = () => {
    const root = new TransformNode('coin', scene);
    const coin = CreateCylinder('coin rim', { diameter: 0.62, height: 0.13, tessellation: 12 }, scene);
    coin.rotation.x = Math.PI / 2; coin.material = gold; coin.parent = root;
    const center = CreateCylinder('coin center', { diameter: 0.43, height: 0.145, tessellation: 12 }, scene);
    center.rotation.x = Math.PI / 2; center.material = goldCenter; center.parent = root;
    box('coin stamp', [0.09, 0.25, 0.15], [0, 0, 0], gold, root); return root;
  };
  const logs = Array.from({ length: 10 }, makeLog);
  const coins = Array.from({ length: 40 }, makeCoin);
  [...logs, ...coins].forEach(m => m.setEnabled(false));
  scene.meshes.forEach(m => { m.isPickable = false; });
  let time = 0;
  let previousDistance = 0;
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  return {
    ready: () => scene.whenReadyAsync(),
    run(tick: (dt: number) => void) {
      engine.runRenderLoop(() => {
        const dt = Math.min(engine.getDeltaTime() / 1000, 0.1);
        tick(dt);
        const running = game.phase === 'running';
        const idle = game.phase === 'ready';
        if (running || idle) time += dt;
        const movement = running ? Math.max(0, game.distance - previousDistance) : idle ? dt * 2 : 0;
        previousDistance = game.distance;
        for (const node of [...trees, ...plants, ...markers]) {
          node.position.z -= movement;
          if (node.position.z < -13) node.position.z += 110;
        }
        cotia.scaling.setAll(idle ? 1.6 : 0.87);
        cotia.position.set(game.x, game.y, idle ? 8 : 0);
        cotia.rotation.y = idle ? Math.PI + 0.45 + Math.sin(time * 0.6) * 0.12 : (game.lane * LANE_WIDTH - game.x) * 0.12;
        cotia.rotation.z = running ? -(game.lane * LANE_WIDTH - game.x) * 0.07 : 0;
        character.animate(dt, running, idle, game.y > 0, game.speed);
        shadow.position.x = game.x; shadow.position.z = idle ? 8 : 0; shadow.scaling.x = (idle ? 1.8 : 1.3) - game.y * 0.18; shadowMat.alpha = 0.23;
        let li = 0; let ci = 0;
        for (const entity of game.entities) {
          const mesh = entity.kind === 'log' ? logs[li++] : coins[ci++];
          if (!mesh) continue;
          mesh.setEnabled(true); mesh.position.set(entity.lane * LANE_WIDTH, entity.kind === 'coin' ? 1.02 + Math.sin(time * 3 + entity.z) * 0.09 : 0, entity.z);
          if (entity.kind === 'coin') mesh.rotation.y = time * 2.5;
        }
        logs.forEach((m, i) => { if (i >= li) m.setEnabled(false); });
        coins.forEach((m, i) => { if (i >= ci) m.setEnabled(false); });
        scene.render();
      });
    },
    dispose() { observer.disconnect(); scene.dispose(); engine.dispose(); },
  };
}
