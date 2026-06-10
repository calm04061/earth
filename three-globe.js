// 3D 地球主入口 — 初始化场景、渲染器、轨道控制、星球、卫星、传送门和动画
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { getGlowTexture } from './src/globe/helpers.js';
import { createCenterPlanet, createOrbitingPlanet } from './src/globe/createPlanet.js';
import { createToolSatellites } from './src/globe/createSatellites.js';
import { createPortalForPlanet } from './src/globe/createPortal.js';
import { createAnimation } from './src/globe/animation.js';

// 创建整个 3D 地球场景
export function createGlobe(container, planetConfigs, allTools, onToolClick, onPortalClickCb) {
  let w = container.clientWidth;
  let h = container.clientHeight;
  const sceneScale = Math.max(0.55, Math.min(1.3, Math.min(w, h) / 700));

  // 场景与摄像机
  const scene = new THREE.Scene();
  const fov = 38 + 10 * Math.max(0, Math.min(1, (600 - Math.min(w, h)) / 300));
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 2000);
  const camDist = 5 + 3 * Math.max(0, Math.min(1, (600 - Math.min(w, h)) / 300));
  camera.position.set(0, 0.8 * sceneScale, camDist);

  // WebGL 渲染器
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);

  // CSS2D 标签渲染器（覆盖在 WebGL 之上，pointer-events: none 让点击穿透）
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(w, h);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(labelRenderer.domElement);

  // 轨道控制器（惯性、自动旋转、距离限制）
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;
  controls.minDistance = 2.5;
  controls.maxDistance = 12;
  controls.target.set(0, 0, 0);

  // 灯光：环境光 + 主方向光 + 补光
  scene.add(new THREE.AmbientLight(0x404080, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 8, 6);
  scene.add(dirLight);
  const backLight = new THREE.DirectionalLight(0x4FC3F7, 0.4);
  backLight.position.set(-5, -3, -6);
  scene.add(backLight);

  // 星空背景（2000 个随机点）
  const starCount = 2000;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 200;
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.15, transparent: true, opacity: 0.8, sizeAttenuation: true,
  }));
  scene.add(stars);

  const centerPlanetGroup = { mesh: null, satellites: [], latLonLines: [] };
  const orbitingPlanets = [];
  const toolToPlanet = {};
  const portals = [];
  const textureLoader = new THREE.TextureLoader();
  const markerTexture = getGlowTexture();

  // 遍历星球配置，创建对应的 3D 对象
  planetConfigs.forEach((cfg) => {
    const isCenter = !cfg.orbitRadius || cfg.orbitRadius === 0;

    if (isCenter) {
      const cpg = createCenterPlanet(scene, cfg, textureLoader);
      centerPlanetGroup.mesh = cpg.mesh;
      centerPlanetGroup.latLonLines = cpg.latLonLines;
      centerPlanetGroup.wireframe = cpg.wireframe;
      centerPlanetGroup.meridians = cpg.meridians;
      centerPlanetGroup.ring = cpg.ring;
    } else {
      const pData = createOrbitingPlanet(scene, cfg, textureLoader);
      orbitingPlanets.push(pData);
    }

    // 创建该星球对应的工具卫星
    const satellites = createToolSatellites(scene, cfg, allTools, markerTexture, controls, onToolClick, toolToPlanet);
    if (isCenter) {
      centerPlanetGroup.satellites.push(...satellites);
    } else {
      orbitingPlanets[orbitingPlanets.length - 1].satellites.push(...satellites);
    }

    // 创建传送门（点击可跃迁到其他星球）
    const portal = createPortalForPlanet(scene, controls, cfg, (planetId) => {
      onPortalClickCb(planetId);
    });
    if (isCenter) {
      portals.push({ ...portal, isCenter: true, offset: 0, planetId: cfg.id });
    } else {
      const pData = orbitingPlanets[orbitingPlanets.length - 1];
      portals.push({
        ...portal, isCenter: false, offset: Math.random() * Math.PI * 2,
        parentData: pData, planetId: cfg.id,
      });
    }
  });

  // 初始隐藏轨道星球的卫星
  orbitingPlanets.forEach(p => {
    p.satellites.forEach(s => { s.marker.visible = false; s.dot.visible = false; s.label.visible = false; });
  });

  // 启动动画循环
  const anim = createAnimation({
    scene, camera, renderer, labelRenderer, controls,
    centerPlanetGroup, orbitingPlanets, portals,
    stars, sceneScale,
  });

  // 窗口尺寸自适应
  const resizeObs = new ResizeObserver(() => {
    w = container.clientWidth;
    h = container.clientHeight;
    anim.onResize(w, h);
  });
  resizeObs.observe(container);

  return {
    controls,
    dispose() {
      anim.cancelFrame();
      resizeObs.disconnect();
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      container.removeChild(labelRenderer.domElement);
    },
    jumpTo: anim.jumpTo,
    currentPlanetId: anim.currentPlanetId,
  };
}
