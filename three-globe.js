import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const ORBITS = [
  { inclination: 0, radius: 2.8, speed: 0.12, count: 4, color: 0x4FC3F7 },
  { inclination: Math.PI * 0.4, radius: 3.2, speed: 0.08, count: 4, color: 0xBA68C8 },
  { inclination: Math.PI * 0.85, radius: 3.0, speed: 0.15, count: 4, color: 0xFFB74D },
  { inclination: -Math.PI * 0.32, radius: 3.4, speed: 0.1, count: 4, color: 0x81C784 },
];

function getOrbitPos(radius, inclination, theta) {
  return new THREE.Vector3(
    radius * Math.cos(theta),
    -radius * Math.sin(theta) * Math.sin(inclination),
    radius * Math.sin(theta) * Math.cos(inclination)
  );
}

export function createGlobe(container, tools, onToolClick) {
  const RADIUS = 1.3;
  let w = container.clientWidth;
  let h = container.clientHeight;

  const sceneScale = Math.max(0.55, Math.min(1.3, Math.min(w, h) / 700));

  // Scene
  const scene = new THREE.Scene();
  const fov = 38 + 10 * Math.max(0, Math.min(1, (600 - Math.min(w, h)) / 300));
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 2000);
  const camDist = 5 + 3 * Math.max(0, Math.min(1, (600 - Math.min(w, h)) / 300));
  camera.position.set(0, 0.8 * sceneScale, camDist);

  // WebGL renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);

  // CSS2D renderer for labels
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(w, h);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(labelRenderer.domElement);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;
  controls.minDistance = 2.5;
  controls.maxDistance = 12;
  controls.target.set(0, 0, 0);

  // Lights
  scene.add(new THREE.AmbientLight(0x404080, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 8, 6);
  scene.add(dirLight);
  const backLight = new THREE.DirectionalLight(0x4FC3F7, 0.4);
  backLight.position.set(-5, -3, -6);
  scene.add(backLight);

  // Globe sphere
  const globeGeo = new THREE.SphereGeometry(RADIUS, 64, 64);
  const globeMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a2a4a,
    emissive: 0x0a1525,
    emissiveIntensity: 0.1,
    metalness: 0.05,
    roughness: 0.5,
    transparent: true,
    opacity: 0.92,
  });
  const globeMesh = new THREE.Mesh(globeGeo, globeMat);
  scene.add(globeMesh);

  // Load earth texture
  const loader = new THREE.TextureLoader();
  loader.load(
    import.meta.env.BASE_URL + 'earth-map.jpg',
    (tex) => {
      globeMat.map = tex;
      globeMat.color.set(0xffffff);
      globeMat.emissiveIntensity = 0.05;
      globeMat.needsUpdate = true;
    },
    undefined,
    () => {} // onError - silently keep fallback
  );

  // Wireframe
  const wireGeo = new THREE.SphereGeometry(RADIUS * 1.005, 28, 18);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x4FC3F7, wireframe: true, transparent: true, opacity: 0.025,
  });
  scene.add(new THREE.Mesh(wireGeo, wireMat));

  // Latitude lines
  const addRing = (lat, color, opacity) => {
    const y = Math.sin(lat);
    const r = Math.cos(lat) * RADIUS * 1.006;
    if (r < 0.01) return;
    const curve = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0);
    const pts = curve.getPoints(48);
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p.x, y * RADIUS * 1.006, p.y)));
    scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity })));
  };
  for (let i = -80; i <= 80; i += 20) addRing(i * Math.PI / 180, 0x4FC3F7, i === 0 ? 0.05 : 0.02);

  // Meridians
  for (let i = 0; i < 360; i += 30) {
    const rad = i * Math.PI / 180;
    const pts = [];
    for (let j = 0; j <= 180; j += 4) {
      const lat = j * Math.PI / 180;
      pts.push(new THREE.Vector3(
        Math.cos(lat) * Math.cos(rad) * RADIUS * 1.006,
        Math.sin(lat) * RADIUS * 1.006,
        Math.cos(lat) * Math.sin(rad) * RADIUS * 1.006
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x4FC3F7, transparent: true, opacity: 0.015 })));
  }

  // (atmosphere glow removed per request)

  // Stars
  const starCount = 2000;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 200;
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(starCount).fill(0), 1));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.15, transparent: true, opacity: 0.8, sizeAttenuation: true,
  }));
  scene.add(stars);

  // ─── Marker texture ───
  const markerCanvas = document.createElement('canvas');
  markerCanvas.width = 64;
  markerCanvas.height = 64;
  const mCtx = markerCanvas.getContext('2d');
  const gradient = mCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(79, 195, 247, 1)');
  gradient.addColorStop(0.2, 'rgba(79, 195, 247, 0.6)');
  gradient.addColorStop(0.5, 'rgba(79, 195, 247, 0.2)');
  gradient.addColorStop(1, 'rgba(79, 195, 247, 0)');
  mCtx.fillStyle = gradient;
  mCtx.fillRect(0, 0, 64, 64);
  const markerTexture = new THREE.CanvasTexture(markerCanvas);

  // ─── Orbital rings + satellites ───
  const satelliteData = [];
  let toolIdx = 0;

  ORBITS.forEach((orbit) => {
    // Ring line
    const ringSegs = 80;
    const ringPts = [];
    for (let i = 0; i <= ringSegs; i++) {
      ringPts.push(getOrbitPos(orbit.radius, orbit.inclination, (i / ringSegs) * Math.PI * 2));
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
    scene.add(new THREE.Line(ringGeo, new THREE.LineBasicMaterial({ color: orbit.color, transparent: true, opacity: 0.12 })));

    // Ring dots
    const dotCount = 100;
    const dotPositions = new Float32Array(dotCount * 3);
    for (let i = 0; i < dotCount; i++) {
      const p = getOrbitPos(orbit.radius, orbit.inclination, (i / dotCount) * Math.PI * 2);
      dotPositions[i * 3] = p.x;
      dotPositions[i * 3 + 1] = p.y;
      dotPositions[i * 3 + 2] = p.z;
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
    scene.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({
      color: orbit.color, size: 0.03, transparent: true, opacity: 0.3, sizeAttenuation: true,
    })));

    // Satellites
    for (let i = 0; i < orbit.count; i++) {
      if (toolIdx >= tools.length) break;
      const tool = tools[toolIdx];
      const startAngle = (i / orbit.count) * Math.PI * 2 + 0.3;

      const markerMat = new THREE.SpriteMaterial({
        map: markerTexture, blending: THREE.AdditiveBlending, depthTest: true,
        transparent: true, opacity: 0.9, color: new THREE.Color(tool.color),
      });
      const marker = new THREE.Sprite(markerMat);
      marker.scale.set(0.35, 0.35, 1);
      scene.add(marker);

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 8, 8),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(tool.color) })
      );
      scene.add(dot);

      const linePos = new Float32Array(6);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
      const tether = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({
        color: tool.color, transparent: true, opacity: 0.07, depthWrite: false,
      }));
      scene.add(tether);

      // CSS2D Label
      const labelDiv = document.createElement('div');
      labelDiv.className = 'tool-label';
      labelDiv.dataset.toolIndex = toolIdx;
      labelDiv.innerHTML = `<span class="label-icon">${tool.icon}</span><span class="label-name">${tool.name}</span>`;
      const label = new CSS2DObject(labelDiv);
      scene.add(label);

      labelDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        controls.autoRotate = false;
        onToolClick(Number(e.currentTarget.dataset.toolIndex));
      });

      satelliteData.push({
        orbit, startAngle, marker, dot, tether, linePos, lineGeo, label,
      });

      toolIdx++;
    }
  });

  // ─── Animation ───
  let animId = null;

  function animate() {
    animId = requestAnimationFrame(animate);
    controls.update();
    const t = Date.now() * 0.001;

    satelliteData.forEach((sat) => {
      const theta = sat.startAngle + t * sat.orbit.speed;
      const pos = getOrbitPos(sat.orbit.radius, sat.orbit.inclination, theta);
      sat.marker.position.copy(pos);
      sat.dot.position.copy(pos);

      const dir = pos.clone().normalize();
      sat.linePos[0] = dir.x * RADIUS;
      sat.linePos[1] = dir.y * RADIUS;
      sat.linePos[2] = dir.z * RADIUS;
      sat.linePos[3] = pos.x;
      sat.linePos[4] = pos.y;
      sat.linePos[5] = pos.z;
      sat.lineGeo.attributes.position.needsUpdate = true;

      const labelR = sat.orbit.radius + 0.45;
      sat.label.position.set(dir.x * labelR, dir.y * labelR, dir.z * labelR);

      const pulse = 1 + Math.sin(t * 1.5 + sat.startAngle) * 0.12;
      sat.marker.scale.set(pulse * 0.35, pulse * 0.35, 1);
    });

    stars.rotation.y += 0.0002;
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  animate();

  // ─── Resize ───
  function onResize() {
    w = container.clientWidth;
    h = container.clientHeight;
    const mobile = w < 600;
    camera.fov = mobile ? 46 : 40;
    camera.aspect = w / h;
    camera.position.set(0, 0.8, mobile ? 6.8 : 5.5);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
  }
  const resizeObs = new ResizeObserver(onResize);
  resizeObs.observe(container);

  // ─── Cleanup ───
  function dispose() {
    cancelAnimationFrame(animId);
    resizeObs.disconnect();
    controls.dispose();
    renderer.dispose();
    container.removeChild(renderer.domElement);
    container.removeChild(labelRenderer.domElement);
  }

  return { controls, dispose };
}
