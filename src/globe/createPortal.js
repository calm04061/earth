import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

let sharedTexture = null;
function getPortalTexture() {
  if (sharedTexture) return sharedTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
  g.addColorStop(0, 'rgba(0,255,200,1)');
  g.addColorStop(0.15, 'rgba(0,255,200,0.6)');
  g.addColorStop(0.4, 'rgba(0,200,255,0.2)');
  g.addColorStop(0.7, 'rgba(0,100,255,0.05)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 96, 96);
  ctx.strokeStyle = 'rgba(0,255,200,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(48, 48, 30, 0, Math.PI * 2);
  ctx.stroke();
  sharedTexture = new THREE.CanvasTexture(canvas);
  return sharedTexture;
}

export function createPortalForPlanet(scene, controls, planetConfig, onClick) {
  const texture = getPortalTexture();
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, blending: THREE.AdditiveBlending, transparent: true, depthTest: true,
  }));
  marker.scale.set(0.6, 0.6, 1);
  scene.add(marker);

  const labelDiv = document.createElement('div');
  labelDiv.className = 'tool-label portal-label';
  labelDiv.innerHTML = '<span class="label-icon">🚀</span><span class="label-name">星际旅行</span>';
  const label = new CSS2DObject(labelDiv);
  scene.add(label);

  labelDiv.addEventListener('click', (e) => {
    e.stopPropagation();
    controls.autoRotate = false;
    onClick(planetConfig.id);
  });

  return { marker, label };
}
