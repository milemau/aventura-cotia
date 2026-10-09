import { Scene } from '@babylonjs/core/scene';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';

type Triple = [number, number, number];

// AJUSTES DO ROSTO: tamanho relativo, profundidade e distância entre os olhos.
// eyeScale menor = olhos menores; eyeDepth menor = olhos menos salientes.
export const COTIA_FACE = {
  eyeScale: 0.64,
  eyeDepth: 0.5,
  eyeSpacing: 0.29,
  mouthWidth: 0.37,       // Largura da linha da boca fechada.
  smileCurve: 0.035,     // Quanto os cantos do sorriso sobem.
  mouthLineRadius: 0.009,
};

/** Small, articulated 3D interpretation of the school-backpack character reference. */
export function createCotia(scene: Scene) {
  const root = new TransformNode('cotia', scene);
  const mat = (name: string, color: string) => {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = Color3.FromHexString(color);
    material.specularColor = Color3.Black();
    return material;
  };
  const fur = mat('cotia • honey fur', '#ba7137');
  const golden = mat('cotia • golden cheeks', '#d89649');
  const cream = mat('cotia • cream belly', '#f0ce96');
  const earPink = mat('cotia • ears and toes', '#c67e64');
  const brown = mat('cotia • brows', '#724025');
  const nose = mat('cotia • cocoa nose', '#63352c');
  const mouth = mat('cotia • smile', '#4b2423');
  const white = mat('cotia • eye whites', '#fff6df');
  const iris = mat('cotia • amber iris', '#9a511f');
  const pupil = mat('cotia • pupil', '#211a17');
  pupil.specularColor.set(0.45, 0.4, 0.32); pupil.specularPower = 64;
  const sparkle = mat('cotia • eye sparkle', '#ffffff');
  sparkle.emissiveColor.set(0.35, 0.35, 0.35);
  const teal = mat('backpack • turquoise', '#229f9d');
  const tealDark = mat('backpack • piping', '#17736e');
  const pink = mat('backpack • pink zip', '#ec7693');
  const yellow = mat('backpack • sunny yellow', '#ffd365');

  const sphere = (name: string, size: Triple, at: Triple, material: StandardMaterial, parent = root) => {
    const mesh = CreateSphere(name, { diameter: 1, segments: 10 }, scene);
    mesh.scaling.set(...size); mesh.position.set(...at); mesh.material = material; mesh.parent = parent;
    return mesh;
  };
  const box = (name: string, size: Triple, at: Triple, material: StandardMaterial, parent = root) => {
    const mesh = CreateBox(name, { width: size[0], height: size[1], depth: size[2] }, scene);
    mesh.position.set(...at); mesh.material = material; mesh.parent = parent; return mesh;
  };
  const roundedBox = (name: string, size: Triple, at: Triple, material: StandardMaterial, parent = root) => {
    const mesh = CreateSphere(name, { diameter: 2, segments: 8 }, scene);
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind)!;
    for (let i = 0; i < positions.length; i++) positions[i] = Math.sign(positions[i]) * Math.pow(Math.abs(positions[i]), 0.55);
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, mesh.getIndices()!, normals);
    mesh.setVerticesData(VertexBuffer.PositionKind, positions);
    mesh.setVerticesData(VertexBuffer.NormalKind, normals);
    mesh.scaling.set(size[0] / 2, size[1] / 2, size[2] / 2);
    mesh.position.set(...at); mesh.material = material; mesh.parent = parent; return mesh;
  };

  const torso = new TransformNode('cotia torso', scene); torso.parent = root; torso.position.y = 0.82;
  sphere('upright pear-shaped body', [0.92, 1.35, 0.74], [0, 0.56, 0], fur, torso);
  sphere('soft cream belly', [0.69, 1.08, 0.2], [0, 0.53, 0.34], cream, torso);
  sphere('neck', [0.66, 0.42, 0.63], [0, 1.12, 0.04], golden, torso);

  const head = new TransformNode('cotia head', scene); head.parent = torso; head.position.set(0, 1.47, 0.04);
  sphere('big friendly head', [1.16, 1.1, 1.02], [0, 0, 0], fur, head);
  sphere('soft lower face', [0.99, 0.65, 0.84], [0, -0.24, 0.11], golden, head);
  for (const side of [-1, 1]) {
    const outer = sphere('short rounded ear', [0.33, 0.43, 0.23], [side * 0.48, 0.46, -0.04], fur, head);
    outer.rotation.z = side * -0.25;
    const inner = sphere('warm ear center', [0.22, 0.29, 0.08], [side * 0.49, 0.48, 0.073], earPink, head);
    inner.rotation.z = side * -0.25;
    sphere('soft cheek', [0.35, 0.4, 0.4], [side * 0.37, -0.23, 0.25], golden, head);
    // OLHOS: as camadas acompanham os parâmetros COTIA_FACE acima.
    const eye = new TransformNode('small inset eye', scene); eye.parent = head;
    eye.position.set(side * COTIA_FACE.eyeSpacing, 0.1, 0.428);
    eye.scaling.set(COTIA_FACE.eyeScale, COTIA_FACE.eyeScale, COTIA_FACE.eyeDepth);
    sphere('golden eye surround', [0.46, 0.55, 0.11], [0, 0, 0], golden, eye);
    sphere('small eye white', [0.36, 0.43, 0.1], [0, 0, 0.057], white, eye);
    sphere('amber iris', [0.285, 0.35, 0.075], [0, -0.014, 0.111], iris, eye);
    sphere('dark pupil', [0.19, 0.265, 0.05], [0, -0.006, 0.146], pupil, eye);
    sphere('soft eye glint', [0.057, 0.069, 0.025], [-0.041, 0.072, 0.174], sparkle, eye);
    const eyebrow = sphere('relaxed eyebrow', [0.26, 0.048, 0.07], [side * COTIA_FACE.eyeSpacing, 0.295, 0.407], brown, head);
    eyebrow.rotation.z = side * -0.06;
  }
  // BOCA FECHADA: focinho contínuo e uma linha curva, sem dentes ou língua.
  sphere('closed cream muzzle', [0.67, 0.35, 0.4], [0, -0.21, 0.52], cream, head);
  const smilePath = Array.from({ length: 17 }, (_, i) => {
    const t = i / 8 - 1;
    const x = t * COTIA_FACE.mouthWidth / 2;
    const y = -0.28 + COTIA_FACE.smileCurve * t * t;
    // A linha segue a superfície elipsoidal do focinho.
    const z = 0.52 + 0.2 * Math.sqrt(Math.max(0, 1 - (x / 0.335) ** 2 - ((y + 0.21) / 0.175) ** 2));
    return new Vector3(x, y, z + 0.003);
  });
  const smile = CreateTube('closed gentle smile', { path: smilePath, radius: COTIA_FACE.mouthLineRadius, tessellation: 6 }, scene);
  smile.material = mouth; smile.parent = head;
  const noseMesh = sphere('rounded cocoa nose', [0.24, 0.16, 0.18], [0, -0.098, 0.704], nose, head);
  noseMesh.rotation.z = -0.08;
  sphere('nose highlight', [0.06, 0.022, 0.018], [-0.04, -0.054, 0.784], earPink, head);
  for (let i = 0; i < 3; i++) {
    const tuft = sphere('swept hair tuft', [0.15, 0.37 - i * 0.04, 0.25], [-0.16 + i * 0.13, 0.53 + i * 0.015, 0.045], i === 1 ? golden : fur, head);
    tuft.rotation.z = -0.48 - i * 0.13;
  }

  const backpack = new TransformNode('school backpack', scene); backpack.parent = torso; backpack.position.set(0, 0.63, -0.48);
  roundedBox('backpack pink piping', [0.97, 1.14, 0.47], [0, 0, -0.04], pink, backpack);
  roundedBox('turquoise backpack body', [0.93, 1.1, 0.47], [0, 0.015, -0.075], teal, backpack);
  roundedBox('front pocket piping', [0.76, 0.47, 0.2], [0, -0.255, -0.325], pink, backpack);
  roundedBox('yellow pocket top', [0.69, 0.39, 0.2], [0, -0.249, -0.357], yellow, backpack);
  roundedBox('turquoise pocket', [0.7, 0.29, 0.2], [0, -0.314, -0.38], teal, backpack);
  box('pocket zipper', [0.67, 0.027, 0.026], [0, -0.193, -0.491], pink, backpack);
  roundedBox('zipper pull', [0.055, 0.105, 0.04], [0.27, -0.24, -0.516], yellow, backpack);
  roundedBox('backpack carry handle', [0.3, 0.15, 0.13], [0, 0.6, 0], tealDark, backpack);
  roundedBox('handle opening', [0.16, 0.075, 0.14], [0, 0.6, -0.01], brown, backpack);
  for (const side of [-1, 1]) {
    sphere('padded shoulder strap', [0.18, 0.83, 0.16], [side * 0.355, 0.89, 0.32], teal, torso).rotation.z = side * 0.15;
    sphere('strap over shoulder', [0.2, 0.21, 0.63], [side * 0.335, 1.23, -0.025], teal, torso);
    roundedBox('pink lower strap', [0.12, 0.4, 0.105], [side * 0.38, 0.34, 0.23], pink, torso).rotation.z = side * -0.5;
    roundedBox('gold strap buckle', [0.15, 0.15, 0.12], [side * 0.39, 0.4, 0.26], yellow, torso);
    roundedBox('side pocket', [0.2, 0.48, 0.34], [side * 0.47, -0.21, -0.065], tealDark, backpack);
  }
  const star = (name: string, x: number, y: number, radius: number, material: StandardMaterial) => {
    const positions = [0, 0, 0]; const indices: number[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 2 + i * Math.PI / 5;
      const r = i % 2 ? radius * 0.45 : radius;
      positions.push(Math.cos(angle) * r, Math.sin(angle) * r, 0);
      indices.push(0, i + 1, (i + 1) % 10 + 1);
    }
    const mesh = new Mesh(name, scene); const data = new VertexData();
    data.positions = positions; data.indices = indices;
    data.normals = positions.map((_, i) => i % 3 === 2 ? -1 : 0);
    data.uvs = Array(positions.length / 3 * 2).fill(0);
    data.applyToMesh(mesh); mesh.material = material; mesh.parent = backpack;
    // The camera views the backpack from -Z.
    mesh.position.set(x, y, -0.318);
  };
  star('pink star sticker', -0.22, 0.3, 0.13, pink);
  star('yellow star sticker', 0.2, 0.19, 0.095, yellow);
  star('cream tiny star sticker', 0.04, 0.41, 0.06, white);
  sphere('smiley badge', [0.185, 0.185, 0.035], [-0.13, -0.33, -0.494], yellow, backpack);
  for (const x of [-0.163, -0.099]) sphere('badge eye', [0.018, 0.027, 0.016], [x, -0.313, -0.515], brown, backpack);
  sphere('badge smile', [0.064, 0.033, 0.016], [-0.131, -0.355, -0.516], brown, backpack);
  sphere('acorn charm cord', [0.028, 0.26, 0.025], [0.48, -0.46, -0.29], yellow, backpack);
  sphere('acorn charm', [0.14, 0.2, 0.13], [0.48, -0.64, -0.29], golden, backpack);
  sphere('acorn cap', [0.17, 0.08, 0.15], [0.48, -0.56, -0.29], brown, backpack);

  const arms: TransformNode[] = []; const legs: TransformNode[] = []; const knees: TransformNode[] = [];
  for (const side of [-1, 1]) {
    const arm = new TransformNode('arm shoulder', scene); arm.parent = torso; arm.position.set(side * 0.49, 0.99, 0);
    sphere('upper arm', [0.3, 0.51, 0.33], [side * 0.025, -0.18, 0], fur, arm);
    sphere('bent forearm', [0.255, 0.3, 0.46], [side * 0.015, -0.37, 0.15], golden, arm);
    sphere('soft hand', [0.255, 0.24, 0.26], [0, -0.34, 0.34], fur, arm);
    for (let i = 0; i < 3; i++) sphere('hand fingers', [0.059, 0.12, 0.075], [side * (-0.07 + i * 0.063), -0.36, 0.445], golden, arm);
    arms.push(arm);
    const leg = new TransformNode('leg hip', scene); leg.parent = root; leg.position.set(side * 0.265, 0.82, 0);
    sphere('round thigh', [0.39, 0.58, 0.44], [0, -0.18, 0], fur, leg);
    const knee = new TransformNode('knee', scene); knee.parent = leg; knee.position.set(0, -0.4, 0);
    sphere('lower leg', [0.255, 0.36, 0.29], [0, -0.12, 0], golden, knee);
    sphere('bare foot', [0.31, 0.19, 0.47], [0, -0.315, 0.115], fur, knee);
    for (let i = 0; i < 3; i++) sphere('round bare toes', [0.083, 0.095, 0.13], [-0.095 + i * 0.09, -0.313, 0.314], earPink, knee);
    legs.push(leg); knees.push(knee);
  }

  // Bake static pieces together per joint/material to keep draw calls small.
  // Detaching without preserving world transforms makes the merge joint-local.
  const groups = new Map<string, Mesh[]>();
  for (const mesh of root.getChildMeshes()) {
    if (!(mesh instanceof Mesh) || !mesh.material || !mesh.parent) continue;
    const key = `${mesh.parent.uniqueId}:${mesh.material.uniqueId}`;
    const group = groups.get(key) ?? []; group.push(mesh); groups.set(key, group);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const parent = group[0].parent;
    group.forEach(mesh => { mesh.parent = null; });
    const merged = Mesh.MergeMeshes(group, true, true);
    if (merged) merged.parent = parent;
    else group.forEach(mesh => { mesh.parent = parent; });
  }

  let stride = 0;
  let idleTime = 0;
  return {
    root,
    animate(dt: number, running: boolean, idle: boolean, airborne: boolean, speed: number) {
      if (!running && !idle) return; // Freeze the pose during pause/game over.
      if (running) stride += dt * (12 + (speed - 9) * 0.35);
      if (idle) idleTime += dt;
      torso.rotation.x = running ? 0.09 : 0;
      torso.rotation.z = running ? Math.sin(stride) * 0.035 : Math.sin(idleTime * 1.5) * 0.018;
      torso.position.y = 0.82 + (running && !airborne ? Math.abs(Math.sin(stride)) * 0.055 : Math.sin(idleTime * 2) * 0.008);
      head.rotation.y = idle ? Math.sin(idleTime * 0.75) * 0.1 : Math.sin(stride) * 0.025;
      head.rotation.z = idle ? -0.07 : 0;
      backpack.rotation.x = running ? Math.sin(stride * 2) * 0.035 : 0;
      for (let i = 0; i < 2; i++) {
        const swing = Math.sin(stride + i * Math.PI);
        legs[i].rotation.x = !running ? 0 : airborne ? -0.45 : swing * 0.64;
        knees[i].rotation.x = !running ? 0 : airborne ? 0.95 : Math.max(0, -swing) * 0.95;
        arms[i].rotation.x = !running ? -0.25 : airborne ? -0.85 : -swing * 0.55 - 0.12;
        arms[i].rotation.z = (i === 0 ? 1 : -1) * (airborne ? 0.3 : 0.1);
      }
    },
  };
}
