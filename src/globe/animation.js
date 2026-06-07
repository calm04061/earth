import * as THREE from 'three';
import { getOrbitPos, easeInOutCubic } from './helpers.js';

export function createAnimation(ctx) {
  const {
    scene, camera, renderer, labelRenderer, controls,
    centerPlanetGroup, orbitingPlanets, portals,
    stars, sceneScale,
  } = ctx;

  let jumpAnim = null;
  let currentPlanetId = 'earth';
  let mobile = false;

  function findPlanetData(id) {
    if (id === 'earth' || !id) return { isCenter: true, data: centerPlanetGroup };
    const p = orbitingPlanets.find(p => p.config.id === id);
    return p ? { isCenter: false, data: p } : null;
  }

  const setSatellitesVis = (sats, v) => {
    sats.forEach(s => { if (!s.permanent) { s.marker.visible = v; s.dot.visible = v; s.label.visible = v; } });
  };
  const refreshPortalVis = () => {
    portals.forEach(p => { p.marker.visible = p.planetId === currentPlanetId; p.label.visible = p.planetId === currentPlanetId; });
  };

  function jumpTo(targetId, onComplete) {
    let endPos, endTarget;
    const prev = findPlanetData(currentPlanetId);

    const showCenter = (v) => {
      if (centerPlanetGroup.mesh) centerPlanetGroup.mesh.visible = v;
      if (centerPlanetGroup.wireframe) centerPlanetGroup.wireframe.visible = v;
      if (centerPlanetGroup.ring) centerPlanetGroup.ring.visible = v;
      centerPlanetGroup.latLonLines.forEach(l => l.visible = v);
      if (centerPlanetGroup.meridians) centerPlanetGroup.meridians.forEach(l => l.visible = v);
      setSatellitesVis(centerPlanetGroup.satellites, v);
    };

    if (targetId === 'earth' || !targetId) {
      endPos = new THREE.Vector3(0, 0.8 * sceneScale, mobile ? 6.8 : 5.5);
      endTarget = new THREE.Vector3(0, 0, 0);
      if (prev && !prev.isCenter) {
        prev.data.objects.forEach(o => o.visible = false);
        if (prev.data.label) prev.data.label.visible = false;
        setSatellitesVis(prev.data.satellites, false);
      }
      showCenter(true);
      currentPlanetId = 'earth';
      refreshPortalVis();
    } else {
      const target = findPlanetData(targetId);
      if (!target || target.isCenter) { if (onComplete) onComplete(); return; }
      const pData = target.data;
      pData.objects.forEach(o => o.visible = true);
      if (pData.label) pData.label.visible = true;
      pData.satellites.forEach(s => { s.marker.visible = true; s.dot.visible = true; s.label.visible = true; });
      const pos = getOrbitPos(pData.config.orbitRadius, pData.config.orbitInclination || 0, pData.angle);
      const camDist = (pData.config.radius || 0.55) * 3 + 1.5;
      endPos = pos.clone().add(new THREE.Vector3(0, camDist * 0.2, camDist));
      endTarget = pos.clone();

      if (prev && !prev.isCenter && prev.data !== pData) {
        prev.data.objects.forEach(o => o.visible = false);
        if (prev.data.label) prev.data.label.visible = false;
        setSatellitesVis(prev.data.satellites, false);
      }
      showCenter(false);
      currentPlanetId = targetId;
      refreshPortalVis();
    }

    jumpAnim = {
      startTime: performance.now(), duration: 1600,
      startPos: camera.position.clone(), endPos,
      startTarget: controls.target.clone(), endTarget,
      onComplete,
    };
    controls.enabled = false;
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
      if (progress >= 1) {
        const cb = jumpAnim.onComplete;
        jumpAnim = null;
        controls.enabled = true;
        if (cb) cb();
      }
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
      return;
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

      // Follow current planet
      if (p.config.id === currentPlanetId) {
        controls.target.copy(pos);
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

    // Animate portals
    portals.forEach((p) => {
      const angle = t * 0.06 + p.offset;
      const lat = 0.3;
      if (p.isCenter) {
        const R = centerPlanetGroup.mesh ? centerPlanetGroup.mesh.geometry.parameters.radius : 1.3;
        const px = Math.cos(lat) * Math.cos(angle) * R * 1.05;
        const py = Math.sin(lat) * R * 1.05;
        const pz = Math.cos(lat) * Math.sin(angle) * R * 1.05;
        p.marker.position.set(px, py, pz);
        p.label.position.set(px * 1.3, py * 1.3 + 0.2, pz * 1.3);
      } else {
      const R = p.parentData.config.radius || 0.5;
      const planetPos = p.parentData.mesh.position.clone();
        const lpx = Math.cos(lat) * Math.cos(angle) * R * 1.3;
        const lpy = Math.sin(lat) * R * 1.3;
        const lpz = Math.cos(lat) * Math.sin(angle) * R * 1.3;
        p.marker.position.set(planetPos.x + lpx, planetPos.y + lpy, planetPos.z + lpz);
        p.label.position.set(planetPos.x + lpx * 1.3, planetPos.y + lpy * 1.3 + 0.15, planetPos.z + lpz * 1.3);
      }
      const pulse = 1 + Math.sin(t * 1.2 + p.offset) * 0.1;
      p.marker.scale.set(0.6 * pulse, 0.6 * pulse, 1);
    });

    stars.rotation.y += 0.0002;
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  refreshPortalVis();
  animate();

  function onResize(w, h) {
    mobile = w < 600;
    camera.fov = mobile ? 46 : 40;
    camera.aspect = w / h;
    if (currentPlanetId === 'earth') {
      camera.position.set(0, 0.8, mobile ? 6.8 : 5.5);
      controls.target.set(0, 0, 0);
    }
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
  }

  return {
    jumpTo,
    currentPlanetId: () => currentPlanetId,
    onResize,
    controls,
    cancelFrame() { cancelAnimationFrame(animId); },
  };
}
