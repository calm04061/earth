import * as THREE from 'three';
import { getOrbitPos, easeInOutCubic } from './helpers.js';

export function createAnimation(ctx) {
  const {
    scene, camera, renderer, labelRenderer, controls,
    centerPlanetGroup, orbitingPlanets, portalMarker, portalLabel,
    stars, sceneScale,
  } = ctx;

  let jumpAnim = null;
  let onDevPlanet = false;
  let mobile = false;

  function targetPlanet() {
    if (orbitingPlanets.length === 0) return null;
    let best = orbitingPlanets[0];
    let maxTools = 0;
    orbitingPlanets.forEach(p => {
      if (p.satellites.length > maxTools) { maxTools = p.satellites.length; best = p; }
    });
    return best;
  }

  function jumpTo(onComplete, isReturn) {
    let endPos, endTarget;
    if (isReturn) {
      endPos = new THREE.Vector3(0, 0.8 * sceneScale, mobile ? 6.8 : 5.5);
      endTarget = new THREE.Vector3(0, 0, 0);
    } else {
      const target = targetPlanet();
      if (!target) { if (onComplete) onComplete(); return; }
      target.objects.forEach(o => o.visible = true);
      if (target.label) target.label.visible = true;
      target.satellites.forEach(s => { s.marker.visible = true; s.dot.visible = true; s.label.visible = true; });
      const pos = getOrbitPos(target.config.orbitRadius, target.config.orbitInclination || 0, target.angle);
      endPos = pos.clone().add(new THREE.Vector3(0, 0.4, 2.0));
      endTarget = pos.clone();
    }
    jumpAnim = {
      startTime: performance.now(), duration: 1600,
      startPos: camera.position.clone(), endPos,
      startTarget: controls.target.clone(), endTarget,
      onComplete, isReturn,
    };
    controls.enabled = false;
    onDevPlanet = !isReturn;
  }

  let animId = null;

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = Date.now() * 0.001;

    if (jumpAnim) {
      const elapsed = performance.now() - jumpAnim.startTime;
      const progress = Math.min(elapsed / jumpAnim.duration, 1);
      const ease = easeInOutCubic(progress);
      camera.position.lerpVectors(jumpAnim.startPos, jumpAnim.endPos, ease);
      controls.target.lerpVectors(jumpAnim.startTarget, jumpAnim.endTarget, ease);
      controls.update();
      if (progress >= 1) {
        const cb = jumpAnim.onComplete;
        const wasReturn = jumpAnim.isReturn;
        jumpAnim = null;
        if (wasReturn) {
          orbitingPlanets.forEach(p => {
            p.objects.forEach(o => o.visible = false);
            if (p.label) p.label.visible = false;
            p.satellites.forEach(s => { s.marker.visible = false; s.dot.visible = false; s.label.visible = false; });
          });
        }
        controls.enabled = true;
        if (cb) cb();
      }
    } else {
      controls.update();
    }

    orbitingPlanets.forEach((p) => {
      p.angle += (p.config.orbitSpeed || 0.02) * 0.016;
      const oR = p.config.orbitRadius || 4;
      const oI = p.config.orbitInclination || 0;
      const pos = getOrbitPos(oR, oI, p.angle);

      p.mesh.position.copy(pos);
      p.objects.forEach((o) => {
        if (o.type !== 'Points' && o !== p.mesh) o.position.copy(pos);
      });
      if (p.label) p.label.position.set(pos.x, pos.y + (p.config.radius || 0.5) + 0.4, pos.z);

      if (p.orbitDotsGeo) {
        const attr = p.orbitDotsGeo.attributes.position;
        for (let i = 0; i < 60; i++) {
          const a = (i / 60) * Math.PI * 2 + t * 0.05;
          const dp = getOrbitPos(oR, oI, a);
          attr.array[i * 3] = dp.x;
          attr.array[i * 3 + 1] = dp.y;
          attr.array[i * 3 + 2] = dp.z;
        }
        attr.needsUpdate = true;
      }

      p.satellites.forEach((sat) => {
        const theta = sat.startAngle + t * sat.layout.speed;
        const satPos = getOrbitPos(sat.layout.radius, sat.layout.inclination, theta);
        const worldPos = pos.clone().add(satPos);
        sat.marker.position.copy(worldPos);
        sat.dot.position.copy(worldPos);

        const dir = satPos.clone().normalize();
        sat.linePos[0] = pos.x;
        sat.linePos[1] = pos.y;
        sat.linePos[2] = pos.z;
        sat.linePos[3] = worldPos.x;
        sat.linePos[4] = worldPos.y;
        sat.linePos[5] = worldPos.z;
        sat.lineGeo.attributes.position.needsUpdate = true;

        const labelR = sat.layout.radius + 0.45;
        sat.label.position.set(pos.x + dir.x * labelR, pos.y + dir.y * labelR, pos.z + dir.z * labelR);

        const pulse = 1 + Math.sin(t * 1.5 + sat.startAngle) * 0.12;
        sat.marker.scale.set(pulse * 0.35, pulse * 0.35, 1);
      });
    });

    centerPlanetGroup.satellites.forEach((sat) => {
      const theta = sat.startAngle + t * sat.layout.speed;
      const pos = getOrbitPos(sat.layout.radius, sat.layout.inclination, theta);
      sat.marker.position.copy(pos);
      sat.dot.position.copy(pos);

      const dir = pos.clone().normalize();
      const R = centerPlanetGroup.mesh ? centerPlanetGroup.mesh.geometry.parameters.radius : 1.3;
      sat.linePos[0] = dir.x * R;
      sat.linePos[1] = dir.y * R;
      sat.linePos[2] = dir.z * R;
      sat.linePos[3] = pos.x;
      sat.linePos[4] = pos.y;
      sat.linePos[5] = pos.z;
      sat.lineGeo.attributes.position.needsUpdate = true;

      const labelR = sat.layout.radius + 0.45;
      sat.label.position.set(dir.x * labelR, dir.y * labelR, dir.z * labelR);

      const pulse = 1 + Math.sin(t * 1.5 + sat.startAngle) * 0.12;
      sat.marker.scale.set(pulse * 0.35, pulse * 0.35, 1);
    });

    const portalAngle = t * 0.06;
    const pLat = 0.3;
    const R = centerPlanetGroup.mesh ? centerPlanetGroup.mesh.geometry.parameters.radius : 1.3;
    const px = Math.cos(pLat) * Math.cos(portalAngle) * R * 1.05;
    const py = Math.sin(pLat) * R * 1.05;
    const pz = Math.cos(pLat) * Math.sin(portalAngle) * R * 1.05;
    portalMarker.position.set(px, py, pz);
    portalLabel.position.set(px * 1.3, py * 1.3 + 0.2, pz * 1.3);
    portalMarker.scale.set(0.6 * (1 + Math.sin(t * 1.2) * 0.1), 0.6 * (1 + Math.sin(t * 1.2) * 0.1), 1);

    stars.rotation.y += 0.0002;
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  animate();

  function onResize(w, h) {
    mobile = w < 600;
    camera.fov = mobile ? 46 : 40;
    camera.aspect = w / h;
    if (!onDevPlanet) {
      camera.position.set(0, 0.8, mobile ? 6.8 : 5.5);
      controls.target.set(0, 0, 0);
    }
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
  }

  return {
    jumpTo,
    onDevPlanet: () => onDevPlanet,
    onResize,
    controls,
    cancelFrame() { cancelAnimationFrame(animId); },
  };
}
