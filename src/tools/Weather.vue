<template>
  <div class="tool-weather">
    <div class="weather-3d-wrap" ref="sceneRef"></div>
    <div class="weather-info">
      <div class="weather-temp">{{ temp }}<span>°C</span></div>
      <div class="weather-desc">{{ icon }} {{ desc }} · 北京</div>
      <div class="weather-details">
        <div class="weather-detail-item"><span class="label">湿度</span><span class="value">{{ humidity }}%</span></div>
        <div class="weather-detail-item"><span class="label">风速</span><span class="value">{{ wind }}m/s</span></div>
        <div class="weather-detail-item"><span class="label">降水</span><span class="value">{{ rain }}%</span></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const sceneRef = ref(null);
const w = ['☀️', '⛅', '🌤️', '🌧️', '⛈️', '❄️', '🌫️'];
const d = ['晴朗', '多云', '晴转多云', '小雨', '雷阵雨', '小雪', '雾'];
const idx = Math.floor(Math.random() * w.length);

const icon = ref(w[idx]);
const desc = ref(d[idx]);
const temp = ref(Math.floor(Math.random() * 15 + 20));
const humidity = ref(Math.floor(Math.random() * 40 + 40));
const wind = ref(Math.floor(Math.random() * 5 + 1));
const rain = ref(Math.floor(Math.random() * 30));

let scene, camera, renderer, animId;
let clouds = [], particles = null, sunMesh = null;

const weatherType = idx;

function createCloud(scene, x, y, z, s) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: weatherType >= 3 && weatherType <= 5 ? 0x445566 : 0xffffff,
    roughness: 0.6, metalness: 0,
    transparent: true, opacity: 0.75,
  });
  const body = new THREE.SphereGeometry(0.3, 7, 7);
  const parts = [[0,0,0,1],[0.22,0.04,0.08,0.7],[-0.22,0,-0.08,0.7],
    [0.12,0.06,-0.15,0.5],[-0.12,0.02,0.15,0.5]];
  parts.forEach(([px, py, pz, sc]) => {
    const m = new THREE.Mesh(body, mat);
    m.position.set(px, py, pz);
    m.scale.set(sc, sc * 0.65, sc);
    g.add(m);
  });
  g.position.set(x, y, z);
  g.scale.set(s, s, s);
  scene.add(g);
  return g;
}

function initScene(el) {
  const w = el.clientWidth;
  const h = Math.min(w * 0.55, 220);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(weatherType >= 3 && weatherType <= 5 ? 0x1a2535 : 0x1e3a5f);

  camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
  camera.position.set(0, 0.6, 3.5);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  el.appendChild(renderer.domElement);

  // Lights
  scene.add(new THREE.AmbientLight(weatherType >= 4 ? 0x334466 : 0x8899bb, 0.6));
  const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
  sun.position.set(3, 4, 2);
  scene.add(sun);
  scene.add(new THREE.DirectionalLight(0x4488ff, 0.3).position.set(-2, -1, -3));

  // Ground fog layer
  const fogMat = new THREE.MeshBasicMaterial({
    color: weatherType === 6 ? 0x889999 : 0x1a2a3a,
    transparent: true, opacity: weatherType === 6 ? 0.6 : 0.2,
    side: THREE.DoubleSide,
  });
  const fogDisc = new THREE.Mesh(new THREE.CircleGeometry(2.5, 24), fogMat);
  fogDisc.rotation.x = -Math.PI / 2;
  fogDisc.position.y = -0.6;
  scene.add(fogDisc);

  // Clouds
  const cloudColors = [
    [0, 0.8, 0, 0.7], [-0.6, 0.6, 0.3, 0.5], [0.5, 0.5, -0.2, 0.4],
    [-0.3, 0.7, -0.4, 0.35], [0.7, 0.4, 0.4, 0.3],
  ];
  if (weatherType !== 0) {
    cloudColors.forEach(([x, y, z, s]) => {
      clouds.push(createCloud(scene, x, y, z, s));
    });
  }
  if (weatherType >= 3) {
    [{x:0.2,y:0.55,z:0.1,s:0.55},{x:-0.5,y:0.45,z:-0.1,s:0.45},{x:0.3,y:0.4,z:-0.3,s:0.35}].forEach(p => {
      clouds.push(createCloud(scene, p.x, p.y, p.z, p.s));
    });
  }

  // Sun
  if (weatherType <= 2) {
    const sunGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd55 });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(0.8, 0.9, -0.8);
    scene.add(sunMesh);

    const glowMat = new THREE.SpriteMaterial({
      map: glowTexture(0xffdd55), blending: THREE.AdditiveBlending, transparent: true, opacity: 0.5,
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(1.2, 1.2, 1);
    glow.position.copy(sunMesh.position);
    scene.add(glow);
  }

  // Particles (rain/snow)
  if (weatherType >= 3) {
    const count = weatherType >= 4 ? 500 : 200;
    const isSnow = weatherType === 5;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = Math.random() * 3 - 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({
      color: isSnow ? 0xffffff : 0x8899cc,
      size: isSnow ? 0.04 : 0.02,
      transparent: true, opacity: isSnow ? 0.7 : 0.4,
      sizeAttenuation: true,
    });
    particles = new THREE.Points(geo, pMat);
    particles.userData = { isSnow, speed: weatherType >= 4 ? 3 : 1.5 };
    scene.add(particles);
  }

  animate();
}

function glowTexture(color) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  const r = (color >> 16) & 255, g2 = (color >> 8) & 255, b = color & 255;
  g.addColorStop(0, `rgba(${r},${g2},${b},1)`);
  g.addColorStop(0.2, `rgba(${r},${g2},${b},0.4)`);
  g.addColorStop(1, `rgba(${r},${g2},${b},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function animate() {
  animId = requestAnimationFrame(animate);
  const t = Date.now() * 0.001;

  clouds.forEach((cloud, i) => {
    cloud.position.x += Math.sin(t * 0.1 + i * 2) * 0.0008;
    cloud.position.y += Math.sin(t * 0.08 + i * 3) * 0.0004;
    cloud.rotation.y += 0.002;
  });

  if (sunMesh) {
    sunMesh.position.x = 0.8 + Math.sin(t * 0.05) * 0.05;
    sunMesh.position.y = 0.9 + Math.cos(t * 0.04) * 0.03;
  }

  if (particles) {
    const pos = particles.geometry.attributes.position.array;
    const { isSnow, speed } = particles.userData;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] -= 0.008 * speed;
      if (isSnow) {
        pos[i] += Math.sin(t + i) * 0.003;
      }
      if (pos[i + 1] < -0.6) {
        pos[i + 1] = 2.5;
        pos[i] = (Math.random() - 0.5) * 4;
        pos[i + 2] = (Math.random() - 0.5) * 3;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

function onResize() {
  if (!sceneRef.value || !renderer) return;
  const w = sceneRef.value.clientWidth;
  const h = Math.min(w * 0.55, 220);
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
