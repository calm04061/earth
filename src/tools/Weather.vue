<template>
  <div class="tool-weather">
    <div class="weather-search">
      <input v-model="cityQuery" placeholder="输入城市名..." @keyup.enter="searchCity" />
      <button @click="searchCity">搜索</button>
    </div>
    <div class="weather-3d-wrap" ref="sceneRef"></div>
    <div v-if="loading" class="weather-loading">加载中...</div>
    <div v-else class="weather-info">
      <div class="weather-temp">{{ temp }}<span>°C</span></div>
      <div class="weather-desc">{{ icon }} {{ desc }} · {{ cityName }}</div>
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
const cityQuery = ref('北京');
const cityName = ref('北京');
const loading = ref(true);
const temp = ref('--');
const humidity = ref('--');
const wind = ref('--');
const rain = ref('--');
const icon = ref('☀️');
const desc = ref('--');
const weatherType = ref(0);
const error = ref(null);

let scene3d = null;

const WMO_MAP = {
  0:  { icon: '☀️', desc: '晴朗', type: 0 },
  1:  { icon: '🌤️', desc: '晴转多云', type: 2 },
  2:  { icon: '⛅', desc: '多云', type: 2 },
  3:  { icon: '☁️', desc: '阴天', type: 1 },
  45: { icon: '🌫️', desc: '雾', type: 6 },
  48: { icon: '🌫️', desc: '雾', type: 6 },
  51: { icon: '🌦️', desc: '小毛毛雨', type: 3 },
  53: { icon: '🌦️', desc: '毛毛雨', type: 3 },
  55: { icon: '🌧️', desc: '大毛毛雨', type: 3 },
  61: { icon: '🌧️', desc: '小雨', type: 3 },
  63: { icon: '🌧️', desc: '中雨', type: 3 },
  65: { icon: '🌧️', desc: '大雨', type: 4 },
  71: { icon: '❄️', desc: '小雪', type: 5 },
  73: { icon: '❄️', desc: '中雪', type: 5 },
  75: { icon: '❄️', desc: '大雪', type: 5 },
  80: { icon: '🌦️', desc: '阵雨', type: 3 },
  81: { icon: '🌧️', desc: '阵雨', type: 3 },
  82: { icon: '🌧️', desc: '暴雨', type: 4 },
  95: { icon: '⛈️', desc: '雷阵雨', type: 4 },
  96: { icon: '⛈️', desc: '雷阵雨', type: 4 },
  99: { icon: '⛈️', desc: '雷阵雨', type: 4 },
};

function wmoToUI(code) {
  return WMO_MAP[code] || { icon: '🌤️', desc: '未知', type: 0 };
}

async function geocode(query) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=zh`);
  if (!r.ok) throw new Error('城市搜索失败');
  const d = await r.json();
  if (!d.results || d.results.length === 0) throw new Error('未找到该城市');
  const result = d.results[0];
  return { lat: result.latitude, lon: result.longitude, name: result.name + (result.admin1 ? ', ' + result.admin1 : '') };
}

async function fetchWeather(lat, lon) {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m`
  );
  if (!r.ok) throw new Error('获取天气失败');
  return r.json();
}

async function searchCity() {
  const q = cityQuery.value.trim();
  if (!q) return;
  loading.value = true;
  try {
    const geo = await geocode(q);
    cityName.value = geo.name;
    const data = await fetchWeather(geo.lat, geo.lon);
    const cur = data.current;
    temp.value = Math.round(cur.temperature_2m);
    humidity.value = cur.relative_humidity_2m;
    wind.value = cur.wind_speed_10m.toFixed(1);
    rain.value = cur.precipitation_probability ?? '--';
    const w = wmoToUI(cur.weather_code);
    icon.value = w.icon;
    desc.value = w.desc;
    weatherType.value = w.type;
    rebuildScene();
  } catch (e) {
    icon.value = '⚠️';
    desc.value = e.message;
  } finally {
    loading.value = false;
  }
}

// ─── 3D Scene ───

function disposeScene() {
  if (!scene3d) return;
  cancelAnimationFrame(scene3d.animId);
  scene3d.renderer.dispose();
  if (sceneRef.value && scene3d.renderer.domElement.parentNode === sceneRef.value) {
    sceneRef.value.removeChild(scene3d.renderer.domElement);
  }
  scene3d = null;
}

function createCloud(s, x, y, z, sc, type) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: type >= 3 && type <= 5 ? 0x445566 : 0xffffff,
    roughness: 0.6, metalness: 0,
    transparent: true, opacity: 0.75,
  });
  const body = new THREE.SphereGeometry(0.3, 7, 7);
  const parts = [[0,0,0,1],[0.22,0.04,0.08,0.7],[-0.22,0,-0.08,0.7],
    [0.12,0.06,-0.15,0.5],[-0.12,0.02,0.15,0.5]];
  parts.forEach(([px, py, pz, scl]) => {
    const m = new THREE.Mesh(body, mat);
    m.position.set(px, py, pz);
    m.scale.set(scl, scl * 0.65, scl);
    g.add(m);
  });
  g.position.set(x, y, z);
  g.scale.set(sc, sc, sc);
  s.add(g);
  return g;
}

function buildScene(el, type) {
  const w = el.clientWidth;
  const h = Math.min(w * 0.55, 220);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(type >= 3 && type <= 5 ? 0x1a2535 : 0x1e3a5f);

  const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
  camera.position.set(0, 0.6, 3.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  el.appendChild(renderer.domElement);

  // Lights
  scene.add(new THREE.AmbientLight(type >= 4 ? 0x334466 : 0x8899bb, 0.6));
  const sunLight = new THREE.DirectionalLight(0xffeedd, 1.5);
  sunLight.position.set(3, 4, 2);
  scene.add(sunLight);
  const bl = new THREE.DirectionalLight(0x4488ff, 0.3);
  bl.position.set(-2, -1, -3);
  scene.add(bl);

  // Fog disc
  const fogMat = new THREE.MeshBasicMaterial({
    color: type === 6 ? 0x889999 : 0x1a2a3a,
    transparent: true, opacity: type === 6 ? 0.6 : 0.2,
    side: THREE.DoubleSide,
  });
  const fogDisc = new THREE.Mesh(new THREE.CircleGeometry(2.5, 24), fogMat);
  fogDisc.rotation.x = -Math.PI / 2;
  fogDisc.position.y = -0.6;
  scene.add(fogDisc);

  // Clouds
  const clouds = [];
  const cloudPositions = [
    [0, 0.8, 0, 0.7], [-0.6, 0.6, 0.3, 0.5], [0.5, 0.5, -0.2, 0.4],
    [-0.3, 0.7, -0.4, 0.35], [0.7, 0.4, 0.4, 0.3],
  ];
  if (type !== 0) {
    cloudPositions.forEach(([x, y, z, s]) => {
      clouds.push(createCloud(scene, x, y, z, s, type));
    });
  }
  if (type >= 3) {
    [{x:0.2,y:0.55,z:0.1,s:0.55},{x:-0.5,y:0.45,z:-0.1,s:0.45},{x:0.3,y:0.4,z:-0.3,s:0.35}].forEach(p => {
      clouds.push(createCloud(scene, p.x, p.y, p.z, p.s, type));
    });
  }

  // Sun
  let sunMesh = null;
  if (type <= 2) {
    const sunGeo = new THREE.SphereGeometry(0.35, 16, 16);
    sunMesh = new THREE.Mesh(sunGeo, new THREE.MeshBasicMaterial({ color: 0xffdd55 }));
    sunMesh.position.set(0.8, 0.9, -0.8);
    scene.add(sunMesh);

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64; glowCanvas.height = 64;
    const gctx = glowCanvas.getContext('2d');
    const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0,'rgba(255,221,85,1)');
    grad.addColorStop(0.2,'rgba(255,221,85,0.4)');
    grad.addColorStop(1,'rgba(255,221,85,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0,0,64,64);
    const glowSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCanvas), blending: THREE.AdditiveBlending, transparent: true, opacity: 0.5 })
    );
    glowSprite.scale.set(1.2, 1.2, 1);
    glowSprite.position.copy(sunMesh.position);
    scene.add(glowSprite);
  }

  // Particles
  let particles = null;
  if (type >= 3) {
    const count = type >= 4 ? 500 : 200;
    const isSnow = type === 5;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = Math.random() * 3 - 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    particles = new THREE.Points(geo, new THREE.PointsMaterial({
      color: isSnow ? 0xffffff : 0x8899cc,
      size: isSnow ? 0.04 : 0.02,
      transparent: true, opacity: isSnow ? 0.7 : 0.4,
      sizeAttenuation: true,
    }));
    particles.userData = { isSnow, speed: type >= 4 ? 3 : 1.5 };
    scene.add(particles);
  }

  let animId;
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
      const p = particles.geometry.attributes.position.array;
      const { isSnow, speed } = particles.userData;
      for (let i = 0; i < p.length; i += 3) {
        p[i + 1] -= 0.008 * speed;
        if (isSnow) p[i] += Math.sin(t + i) * 0.003;
        if (p[i + 1] < -0.6) {
          p[i + 1] = 2.5;
          p[i] = (Math.random() - 0.5) * 4;
          p[i + 2] = (Math.random() - 0.5) * 3;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }
  animate();

  return { renderer, camera, animId, dispose: () => { cancelAnimationFrame(animId); renderer.dispose(); } };
}

function rebuildScene() {
  if (!sceneRef.value) return;
  if (scene3d) {
    scene3d.dispose();
    if (scene3d.renderer.domElement.parentNode === sceneRef.value) {
      sceneRef.value.removeChild(scene3d.renderer.domElement);
    }
  }
  scene3d = buildScene(sceneRef.value, weatherType.value);
}

function onResize() {
  if (!scene3d || !sceneRef.value) return;
  const w = sceneRef.value.clientWidth;
  const h = Math.min(w * 0.55, 220);
  scene3d.camera.aspect = w / h;
  scene3d.camera.updateProjectionMatrix();
  scene3d.renderer.setSize(w, h);
}

onMounted(async () => {
  if (sceneRef.value) {
    scene3d = buildScene(sceneRef.value, 0);
    window.addEventListener('resize', onResize);
  }
  await searchCity();
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  if (scene3d) scene3d.dispose();
});
</script>
