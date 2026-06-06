<template>
  <div class="tool-calculator">
    <div class="calc-3d-wrap" ref="sceneRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const sceneRef = ref(null);

let scene, camera, renderer, raycaster, pointer, animId;
let calcGroup, screen, buttonMeshes = [], displayCanvas, displayCtx, displayTexture;
let expr = '';
let displayText = '0';

const btnW = 0.72;
const btnH = 0.54;
const gap = 0.08;
const pad = 0.15;
const bodyW = 4 * btnW + 3 * gap + 2 * pad;
const displayH = 0.48;
const bodyH = pad + displayH + gap + 5 * btnH + 4 * gap + pad;
const bodyD = 0.35;

const BUTTONS = [
  { row:0, col:0, label:'7', val:'7', type:'num', bg:'#37474f' },
  { row:0, col:1, label:'8', val:'8', type:'num', bg:'#37474f' },
  { row:0, col:2, label:'9', val:'9', type:'num', bg:'#37474f' },
  { row:0, col:3, label:'÷', val:'/', type:'op', bg:'#1565C0' },
  { row:1, col:0, label:'4', val:'4', type:'num', bg:'#37474f' },
  { row:1, col:1, label:'5', val:'5', type:'num', bg:'#37474f' },
  { row:1, col:2, label:'6', val:'6', type:'num', bg:'#37474f' },
  { row:1, col:3, label:'×', val:'*', type:'op', bg:'#1565C0' },
  { row:2, col:0, label:'1', val:'1', type:'num', bg:'#37474f' },
  { row:2, col:1, label:'2', val:'2', type:'num', bg:'#37474f' },
  { row:2, col:2, label:'3', val:'3', type:'num', bg:'#37474f' },
  { row:2, col:3, label:'−', val:'-', type:'op', bg:'#1565C0' },
  { row:3, col:0, label:'0', val:'0', type:'num', bg:'#37474f' },
  { row:3, col:1, label:'.', val:'.', type:'num', bg:'#37474f' },
  { row:3, col:2, label:'=', val:'=', type:'eq', bg:'#0d6efd' },
  { row:3, col:3, label:'+', val:'+', type:'op', bg:'#1565C0' },
  { row:4, col:0, label:'C', val:'clear', type:'clear', bg:'#c62828', span:2 },
];

function btnCenter(row, col, span) {
  const sw = span ? span * btnW + (span - 1) * gap : btnW;
  const x = -bodyW / 2 + pad + col * (btnW + gap) + sw / 2;
  const y = bodyH / 2 - pad - displayH - gap - row * (btnH + gap) - btnH / 2;
  return { x, y, w: sw };
}

function makeTextCanvas(text, fg, bg, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fg;
  ctx.font = `bold ${h * 0.45}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  return c;
}

function initScene(el) {
  const w = el.clientWidth;
  const h = Math.min(w * 0.75, 340);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a1a);

  camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 50);
  camera.position.set(1.5, 0.8, 3.8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);

  // Lights
  scene.add(new THREE.AmbientLight(0x404060, 0.6));
  const dl = new THREE.DirectionalLight(0xffffff, 1.5);
  dl.position.set(3, 5, 4);
  dl.castShadow = true;
  scene.add(dl);
  const rl = new THREE.DirectionalLight(0x6688ff, 0.3);
  rl.position.set(-2, 1, -2);
  scene.add(rl);

  // Ground shadow disc (NOT in group)
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(2, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = -bodyH / 2 - 0.05;
  scene.add(shadowDisc);

  // Calculator group (rotates together)
  calcGroup = new THREE.Group();
  scene.add(calcGroup);

  // Body
  const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e, roughness: 0.4, metalness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = -bodyH * 0.05;
  body.castShadow = true;
  calcGroup.add(body);

  // Bevel edge
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x4FC3F7, transparent: true, opacity: 0.08 });
  const edgeLine = new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo), edgeMat);
  edgeLine.position.copy(body.position);
  calcGroup.add(edgeLine);

  // Display recess
  const dispRecessW = bodyW - 2 * pad;
  const displayY = bodyH / 2 - pad - displayH / 2;
  const displayBg = new THREE.Mesh(
    new THREE.BoxGeometry(dispRecessW, displayH, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x0a0a1a, emissive: 0x1a3a1a, emissiveIntensity: 0.2 })
  );
  displayBg.position.set(0, displayY, bodyD / 2 + 0.005);
  calcGroup.add(displayBg);

  // Screen texture (dynamic canvas)
  displayCanvas = document.createElement('canvas');
  displayCanvas.width = 512;
  displayCanvas.height = 128;
  displayCtx = displayCanvas.getContext('2d');
  displayTexture = new THREE.CanvasTexture(displayCanvas);
  updateDisplayTexture();

  const screenMat = new THREE.MeshBasicMaterial({
    map: displayTexture, emissive: 0x88ff88, emissiveIntensity: 0.3,
  });
  screen = new THREE.Mesh(
    new THREE.BoxGeometry(dispRecessW - 0.1, displayH - 0.06, 0.005),
    screenMat
  );
  screen.position.set(0, displayY, bodyD / 2 + 0.03);
  calcGroup.add(screen);

  // Buttons
  BUTTONS.forEach((btn) => {
    const c = btnCenter(btn.row, btn.col, btn.span);
    const btnDepth = 0.1;

    const texCanvas = makeTextCanvas(btn.label, '#fff', btn.bg, 128, 96);
    const tex = new THREE.CanvasTexture(texCanvas);

    const geo = new THREE.BoxGeometry(c.w - 0.03, btnH - 0.03, btnDepth);
    const mat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.5, metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(c.x, c.y, bodyD / 2 + btnDepth / 2);
    mesh.userData = { btn, origZ: bodyD / 2 + btnDepth / 2 };
    calcGroup.add(mesh);
    buttonMeshes.push(mesh);

    // Button shadow/highlight
    const edgeGeo2 = new THREE.EdgesGeometry(geo);
    const edgeMat2 = new THREE.LineBasicMaterial({
      color: new THREE.Color(btn.bg).multiplyScalar(0.6),
      transparent: true, opacity: 0.4,
    });
    const edgeLine2 = new THREE.LineSegments(edgeGeo2, edgeMat2);
    edgeLine2.position.copy(mesh.position);
    edgeLine2.position.z += 0.001;
    calcGroup.add(edgeLine2);
  });

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  animate(0);
}

function updateDisplayTexture() {
  const ctx = displayCtx;
  const c = displayCanvas;
  ctx.fillStyle = '#0a1a0a';
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.fillStyle = '#33ff33';
  ctx.font = `${c.height * 0.55}px "Courier New", monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const txt = displayText.length > 18 ? displayText.slice(-18) : displayText;
  ctx.fillText(txt, c.width - 16, c.height / 2 + 2);
  displayTexture.needsUpdate = true;
}

function calcInput(val) {
  if (val === 'clear') {
    expr = ''; displayText = '0';
  } else if (val === '=') {
    try {
      const r = Function('"use strict";return (' + expr + ')')();
      expr = String(r); displayText = expr;
    } catch { displayText = 'Error'; expr = ''; }
  } else {
    if (displayText === '0' && !'+-*/'.includes(val) && val !== '.') expr = '';
    if (val === '.' && /\.\d*$/.test(expr)) return;
    expr += val;
    displayText = expr || '0';
  }
  updateDisplayTexture();
}

let pressTimer = null;
function onPointerDown(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(buttonMeshes);
  if (hits.length > 0) {
    const mesh = hits[0].object;
    mesh.position.z = mesh.userData.origZ - 0.04;
    setTimeout(() => { mesh.position.z = mesh.userData.origZ; }, 120);
    calcInput(mesh.userData.btn.val);
  }
}

function animate(time) {
  animId = requestAnimationFrame(animate);
  const t = time * 0.001;
  calcGroup.rotation.y = Math.sin(t * 0.08) * 0.06;
  calcGroup.rotation.x = Math.sin(t * 0.05) * 0.02;
  renderer.render(scene, camera);
}

function onResize() {
  if (!sceneRef.value || !renderer) return;
  const w = sceneRef.value.clientWidth;
  const h = Math.min(w * 0.75, 340);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

onMounted(() => {
  if (sceneRef.value) initScene(sceneRef.value);
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  cancelAnimationFrame(animId);
  window.removeEventListener('resize', onResize);
  if (renderer) {
    renderer.dispose();
    if (sceneRef.value && renderer.domElement.parentNode === sceneRef.value) {
      sceneRef.value.removeChild(renderer.domElement);
    }
  }
});
</script>
