import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { getOrbitPos, getGlowTexture, hexToThreeColor } from './helpers.js';

export function createCenterPlanet(scene, cfg, textureLoader) {
  const radius = cfg.radius || 1.0;
  const color = new THREE.Color(cfg.color || '#1a2a4a');
  const emissive = new THREE.Color(cfg.emissive || '#0a1525');
  const wfColor = new THREE.Color(cfg.wireframeColor || '#4FC3F7');

  const geo = new THREE.SphereGeometry(radius, 48, 48);
  const mat = new THREE.MeshPhysicalMaterial({
    color, emissive, emissiveIntensity: 0.1,
    metalness: 0.05, roughness: 0.5,
    transparent: true, opacity: 0.92,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.position.set(0, 0, 0);
  scene.add(mesh);

  if (cfg.texture) {
    const url = cfg.texture.startsWith('data:') ? cfg.texture : import.meta.env.BASE_URL + cfg.texture;
    textureLoader.load(
      url,
      (tex) => { mat.map = tex; mat.color.set(0xffffff); mat.emissiveIntensity = 0.05; mat.needsUpdate = true; },
      undefined, () => {}
    );
  }

  const wireGeo = new THREE.SphereGeometry(radius * 1.005, 28, 18);
  const wireMat = new THREE.MeshBasicMaterial({
    color: wfColor, wireframe: true, transparent: true, opacity: 0.025,
  });
  scene.add(new THREE.Mesh(wireGeo, wireMat));

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
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: wfColor, transparent: true, opacity: 0.015 })));
  }

  return { mesh, latLonLines, satellites: [] };
}

export function createOrbitingPlanet(scene, cfg, textureLoader) {
  const radius = cfg.radius || 1.0;
  const color = new THREE.Color(cfg.color || '#1a2a4a');
  const emissive = new THREE.Color(cfg.emissive || '#0a1525');
  const planetColor = hexToThreeColor(cfg.wireframeColor || '#4FC3F7');

  const geo = new THREE.SphereGeometry(radius, 48, 48);
  const mat = new THREE.MeshPhysicalMaterial({
    color, emissive, emissiveIntensity: 0.1,
    metalness: 0.05, roughness: 0.5,
    transparent: true, opacity: 0.92,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  scene.add(mesh);

  if (cfg.texture) {
    const url = cfg.texture.startsWith('data:') ? cfg.texture : import.meta.env.BASE_URL + cfg.texture;
    textureLoader.load(url, (tex) => { mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true; }, undefined, () => {});
  }

  const pData = {
    config: cfg, mesh,
    angle: Math.random() * Math.PI * 2,
    satellites: [],
    objects: [mesh],
    label: null,
    orbitRing: null, orbitDotsGeo: null, orbitDots: null,
  };

  const wire2 = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.008, 20, 12),
    new THREE.MeshBasicMaterial({ color: planetColor, wireframe: true, transparent: true, opacity: 0.15 })
  );
  scene.add(wire2);
  pData.objects.push(wire2);

  const glowTex = getGlowTexture(`rgba(${planetColor.r*255|0},${planetColor.g*255|0},${planetColor.b*255|0},1)`);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.5,
  }));
  glow.scale.set(radius * 3, radius * 3, 1);
  scene.add(glow);
  pData.objects.push(glow);

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

  const labelDiv = document.createElement('div');
  labelDiv.className = 'tool-label dev-planet-label';
  labelDiv.innerHTML = `<span class="label-icon">🪐</span><span class="label-name">${cfg.name}</span>`;
  const label = new CSS2DObject(labelDiv);
  scene.add(label);
  pData.label = label;

  pData.objects.forEach(o => o.visible = false);
  label.visible = false;

  return pData;
}
