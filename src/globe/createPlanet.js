// 星球创建模块 — 负责生成中心星球和轨道星球的 3D 模型
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { getOrbitPos, getGlowTexture, hexToThreeColor } from './helpers.js';

// 生成星环渐变纹理（Canvas 水平渐变 → 中间亮两端透明）
function createRingTexture(colorHex, opacity) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const c = new THREE.Color(colorHex);
  const r = c.r * 255 | 0;
  const g = c.g * 255 | 0;
  const b = c.b * 255 | 0;
  const g2 = ctx.createLinearGradient(0, 0, canvas.width, 0);
  g2.addColorStop(0, `rgba(${r},${g},${b},0)`);
  g2.addColorStop(0.1, `rgba(${r},${g},${b},${opacity * 0.6})`);
  g2.addColorStop(0.3, `rgba(${r},${g},${b},${opacity})`);
  g2.addColorStop(0.5, `rgba(${r * 0.7 | 0},${g * 0.7 | 0},${b * 0.7 | 0},${opacity * 0.3})`);
  g2.addColorStop(0.7, `rgba(${r},${g},${b},${opacity * 0.8})`);
  g2.addColorStop(0.85, `rgba(${r},${g},${b},${opacity * 0.4})`);
  g2.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return new THREE.CanvasTexture(canvas);
}

// 生成默认星球纹理（纯色背景 + 随机噪点方块）
function generateDefaultTexture(color, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = new THREE.Color(color);
  const r = c.r * 255 | 0;
  const g = c.g * 255 | 0;
  const b = c.b * 255 | 0;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const sz = 2 + Math.random() * 8;
    const br = 0.6 + Math.random() * 0.8;
    ctx.fillStyle = `rgba(${r * br | 0},${g * br | 0},${b * br | 0},${0.3 + Math.random() * 0.5})`;
    ctx.fillRect(x, y, sz, sz);
  }
  return new THREE.CanvasTexture(canvas);
}

// 统一加载星球纹理：有配置则异步加载，无配置则生成默认纹理
function loadPlanetTexture(cfg, mat, textureLoader) {
  if (cfg.texture) {
    const url = cfg.texture.startsWith('data:') ? cfg.texture : import.meta.env.BASE_URL + cfg.texture;
    textureLoader.load(url, (tex) => {
      mat.map = tex; mat.color.set(0xffffff); mat.emissiveIntensity = cfg.atmosphere !== false ? 0.05 : 0;
      mat.needsUpdate = true;
    }, undefined, () => {});
  } else {
    const tex = generateDefaultTexture(cfg.color || '#1a2a4a', 512);
    mat.map = tex;
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
  }
}

// 创建星环（RingGeometry + 渐变纹理 + AdditiveBlending）
function addPlanetRing(scene, cfg, radius) {
  if (!cfg.ringEnabled) return null;
  const inner = radius * 1.1;
  const outer = radius * (cfg.ringSize || 1.8);
  const geo = new THREE.RingGeometry(inner, outer, 64);
  const tex = createRingTexture(cfg.ringColor || '#a0c4ff', 0.6);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    opacity: 0.7, blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = Math.PI / 2 + (cfg.ringTilt || 0.3);
  scene.add(ring);
  return ring;
}

// 创建中心星球（位于原点，含经纬线和环）
export function createCenterPlanet(scene, cfg, textureLoader) {
  const radius = cfg.radius || 1.0;
  const color = new THREE.Color(cfg.color || '#1a2a4a');
  const emissive = new THREE.Color(cfg.emissive || '#0a1525');
  const wfColor = new THREE.Color(cfg.wireframeColor || '#4FC3F7');
  const hasAtmo = cfg.atmosphere !== false;
  // 球体网格：半透明物理材质，大气层控制透明度
  const geo = new THREE.SphereGeometry(radius, 48, 48);
  const mat = new THREE.MeshPhysicalMaterial({
    color, emissive, emissiveIntensity: hasAtmo ? 0.1 : 0,
    metalness: 0.05, roughness: 0.5,
    transparent: hasAtmo, opacity: hasAtmo ? 0.92 : 1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.position.set(0, 0, 0);
  scene.add(mesh);

  loadPlanetTexture(cfg, mat, textureLoader);

  // 极细线框叠加层（增强科技感）
  const wireGeo = new THREE.SphereGeometry(radius * 1.005, 28, 18);
  const wireMat = new THREE.MeshBasicMaterial({
    color: wfColor, wireframe: true, transparent: true, opacity: 0.025,
  });
  const wireframe = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wireframe);

  // 纬线（每 20° 一条）
  const latLonLines = [];
  const addRing = (lat, clr, opacity) => {
    const y = Math.sin(lat);
    const r = Math.cos(lat) * radius * 1.006;
    if (r < 0.01) return;
    const curve = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0);
    const pts = curve.getPoints(48);
    const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p.x, y * radius * 1.006, p.y)));
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: clr, transparent: true, opacity }));
    scene.add(line);
    latLonLines.push(line);
  };
  for (let i = -80; i <= 80; i += 20) addRing(i * Math.PI / 180, wfColor, i === 0 ? 0.05 : 0.02);

  // 经线（每 30° 一条）
  const meridians = [];
  for (let i = 0; i < 360; i += 30) {
    const rad = i * Math.PI / 180;
    const pts = [];
    for (let j = 0; j <= 180; j += 4) {
      const lat = j * Math.PI / 180;
      pts.push(new THREE.Vector3(
        Math.cos(lat) * Math.cos(rad) * radius * 1.006,
        Math.sin(lat) * radius * 1.006,
        Math.cos(lat) * Math.sin(rad) * radius * 1.006
      ));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: wfColor, transparent: true, opacity: 0.015 }));
    scene.add(line);
    meridians.push(line);
  }

  // 可选星环
  const ring = addPlanetRing(scene, cfg, radius);

  return { mesh, latLonLines, wireframe, meridians, ring, satellites: [] };
}

// 创建轨道星球（环绕中心星球公转）
export function createOrbitingPlanet(scene, cfg, textureLoader) {
  const radius = cfg.radius || 1.0;
  const color = new THREE.Color(cfg.color || '#1a2a4a');
  const emissive = new THREE.Color(cfg.emissive || '#0a1525');
  const planetColor = hexToThreeColor(cfg.wireframeColor || '#4FC3F7');
  const hasAtmo = cfg.atmosphere !== false;

  const geo = new THREE.SphereGeometry(radius, 48, 48);
  const mat = new THREE.MeshPhysicalMaterial({
    color, emissive, emissiveIntensity: hasAtmo ? 0.1 : 0,
    metalness: 0.05, roughness: 0.5,
    transparent: hasAtmo, opacity: hasAtmo ? 0.92 : 1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  scene.add(mesh);

  loadPlanetTexture(cfg, mat, textureLoader);

  // 轨道星球数据容器
  const pData = {
    config: cfg, mesh,
    angle: Math.random() * Math.PI * 2,
    satellites: [],
    objects: [mesh],
    label: null,
    orbitRing: null, orbitDotsGeo: null, orbitDots: null,
  };

  // 线框覆盖层
  const wire2 = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.008, 20, 12),
    new THREE.MeshBasicMaterial({ color: planetColor, wireframe: true, transparent: true, opacity: 0.15 })
  );
  scene.add(wire2);
  pData.objects.push(wire2);

  // 大气层辉光精灵
  if (hasAtmo) {
    const glowTex = getGlowTexture(`rgba(${planetColor.r*255|0},${planetColor.g*255|0},${planetColor.b*255|0},1)`);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.5,
    }));
    glow.scale.set(radius * 3, radius * 3, 1);
    scene.add(glow);
    pData.objects.push(glow);
  }

  // 轨道指示环（半透明圆圈）
  const oR = cfg.orbitRadius || 4;
  const oI = cfg.orbitInclination || 0;
  const ringPts = [];
  for (let i = 0; i <= 80; i++) {
    ringPts.push(getOrbitPos(oR, oI, (i / 80) * Math.PI * 2));
  }
  const ringLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(ringPts),
    new THREE.LineBasicMaterial({ color: planetColor, transparent: true, opacity: 0.08 })
  );
  scene.add(ringLine);
  pData.objects.push(ringLine);

  // 轨道移动圆点（沿轨道运动的小光点）
  const dotCount = 60;
  const dotPos = new Float32Array(dotCount * 3);
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
  const dotPoints = new THREE.Points(dotGeo, new THREE.PointsMaterial({
    color: planetColor, size: 0.04, transparent: true, opacity: 0.2, sizeAttenuation: true,
  }));
  scene.add(dotPoints);
  pData.objects.push(dotPoints);
  pData.orbitDotsGeo = dotGeo;

  // 可选星环（类似土星环）
  const ring = addPlanetRing(scene, cfg, radius);
  if (ring) {
    pData.objects.push(ring);
    pData.ring = ring;
  }

  // CSS2D 标签（星球名称）
  const labelDiv = document.createElement('div');
  labelDiv.className = 'tool-label dev-planet-label';
  labelDiv.innerHTML = `<span class="label-icon">🪐</span><span class="label-name">${cfg.name}</span>`;
  const label = new CSS2DObject(labelDiv);
  scene.add(label);
  pData.label = label;

  // 初始隐藏（页面加载时只显示地球）
  pData.objects.forEach(o => o.visible = false);
  label.visible = false;

  return pData;
}
