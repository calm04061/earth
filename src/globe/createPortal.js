import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export function createPortalMarker(scene, controls, onPortalClickCb) {
  const portalCanvas = document.createElement('canvas');
  portalCanvas.width = 96;
  portalCanvas.height = 96;
  const pCtx = portalCanvas.getContext('2d');
  const pGrad = pCtx.createRadialGradient(48, 48, 0, 48, 48, 48);
  pGrad.addColorStop(0, 'rgba(0,255,200,1)');
  pGrad.addColorStop(0.15, 'rgba(0,255,200,0.6)');
  pGrad.addColorStop(0.4, 'rgba(0,200,255,0.2)');
  pGrad.addColorStop(0.7, 'rgba(0,100,255,0.05)');
  pGrad.addColorStop(1, 'rgba(0,0,0,0)');
  pCtx.fillStyle = pGrad;
  pCtx.fillRect(0, 0, 96, 96);
  pCtx.strokeStyle = 'rgba(0,255,200,0.8)';
  pCtx.lineWidth = 2;
  pCtx.beginPath();
  pCtx.arc(48, 48, 30, 0, Math.PI * 2);
  pCtx.stroke();

  const portalMarker = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(portalCanvas),
    blending: THREE.AdditiveBlending, transparent: true, depthTest: true,
  }));
  portalMarker.scale.set(0.6, 0.6, 1);
  scene.add(portalMarker);

  const portalLabelDiv = document.createElement('div');
  portalLabelDiv.className = 'tool-label portal-label';
  portalLabelDiv.innerHTML = '<span class="label-icon">🚀</span><span class="label-name">星际旅行</span>';
  const portalLabel = new CSS2DObject(portalLabelDiv);
  scene.add(portalLabel);
  portalLabelDiv.addEventListener('click', (e) => {
    e.stopPropagation();
    controls.autoRotate = false;
    if (typeof onPortalClickCb === 'function') onPortalClickCb();
  });

  return { portalMarker, portalLabel };
}
