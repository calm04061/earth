import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ORBIT_LAYOUTS } from './helpers.js';

export function createToolSatellites(scene, cfg, allTools, markerTexture, controls, onToolClick, toolToPlanet) {
  const satellites = [];
  let orbitLayoutIdx = 0;
  let satIdx = 0;
  const assignedTools = [];

  (cfg.tools || []).forEach((toolId) => {
    const tool = allTools.find(t => t.id === toolId);
    if (tool) assignedTools.push(tool);
  });

  while (satIdx < assignedTools.length && orbitLayoutIdx < ORBIT_LAYOUTS.length) {
    const layout = ORBIT_LAYOUTS[orbitLayoutIdx];
    for (let i = 0; i < layout.count && satIdx < assignedTools.length; i++) {
      const tool = assignedTools[satIdx];
      const startAngle = (i / layout.count) * Math.PI * 2 + 0.3;

      const markMat = new THREE.SpriteMaterial({
        map: markerTexture, blending: THREE.AdditiveBlending, depthTest: true,
        transparent: true, opacity: 0.9, color: new THREE.Color(tool.color),
      });
      const marker = new THREE.Sprite(markMat);
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

      const labelDiv = document.createElement('div');
      labelDiv.className = 'tool-label';
      labelDiv.dataset.toolIndex = allTools.findIndex(t => t.id === tool.id);
      const toolName = tool.name || tool.label || tool.id;
      labelDiv.innerHTML = `<span class="label-icon">${tool.icon}</span><span class="label-name">${toolName}</span>`;
      const label = new CSS2DObject(labelDiv);
      scene.add(label);

      labelDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        controls.autoRotate = false;
        const idx = parseInt(e.currentTarget.dataset.toolIndex);
        toolToPlanet[tool.id] = cfg.id;
        if (!isNaN(idx)) {
          onToolClick(idx);
        }
      });

      satellites.push({ layout, startAngle, marker, dot, tether, linePos, lineGeo, label });
      satIdx++;
    }
    orbitLayoutIdx++;
  }

  return satellites;
}
