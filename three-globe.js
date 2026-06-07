import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { getGlowTexture } from './src/globe/helpers.js';
import { createCenterPlanet, createOrbitingPlanet } from './src/globe/createPlanet.js';
import { createToolSatellites } from './src/globe/createSatellites.js';
import { createPortalMarker } from './src/globe/createPortal.js';
import { createAnimation } from './src/globe/animation.js';

export function createGlobe(container, planetConfigs, allTools, onToolClick, onPortalClickCb) {
  let w = container.clientWidth;
  let h = container.clientHeight;
  const sceneScale = Math.max(0.55, Math.min(1.3, Math.min(w, h) / 700));

  const scene = new THREE.Scene();
  const fov = 38 + 10 * Math.max(0, Math.min(1, (600 - Math.min(w, h)) / 300));
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 2000);
  const camDist = 5 + 3 * Math.max(0, Math.min(1, (600 - Math.min(w, h)) / 300));
  camera.position.set(0, 0.8 * sceneScale, camDist);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(w, h);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;
  controls.minDistance = 2.5;
  controls.maxDistance = 12;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x404080, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 8, 6);
  scene.add(dirLight);
  const backLight = new THREE.DirectionalLight(0x4FC3F7, 0.4);
  backLight.position.set(-5, -3, -6);
  scene.add(backLight);

  // Stars
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
  const textureLoader = new THREE.TextureLoader();
  const markerTexture = getGlowTexture();

  planetConfigs.forEach((cfg) => {
    const isCenter = !cfg.orbitRadius || cfg.orbitRadius === 0;

    if (isCenter) {
      const cpg = createCenterPlanet(scene, cfg, textureLoader);
      centerPlanetGroup.mesh = cpg.mesh;
      centerPlanetGroup.latLonLines = cpg.latLonLines;
    } else {
      const pData = createOrbitingPlanet(scene, cfg, textureLoader);
      orbitingPlanets.push(pData);
    }

    const satellites = createToolSatellites(scene, cfg, allTools, markerTexture, controls, onToolClick, toolToPlanet);
    if (isCenter) {
      centerPlanetGroup.satellites.push(...satellites);
    } else {
      orbitingPlanets[orbitingPlanets.length - 1].satellites.push(...satellites);
    }
  });

  const { portalMarker, portalLabel } = createPortalMarker(scene, controls, onPortalClickCb);

  const anim = createAnimation({
    scene, camera, renderer, labelRenderer, controls,
    centerPlanetGroup, orbitingPlanets, portalMarker, portalLabel,
    stars, sceneScale,
  });

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
    onDevPlanet: anim.onDevPlanet,
  };
}
