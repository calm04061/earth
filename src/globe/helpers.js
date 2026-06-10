// 工具函数模块 — 轨道计算、颜色转换、辉光纹理、缓动函数
import * as THREE from 'three';

// 卫星轨道布局：4 条不同倾角/半径/速度的轨道环
export const ORBIT_LAYOUTS = [
  { inclination: 0, radius: 2.8, speed: 0.12, count: 4, color: 0x4FC3F7 },
  { inclination: Math.PI * 0.4, radius: 3.2, speed: 0.08, count: 4, color: 0xBA68C8 },
  { inclination: Math.PI * 0.85, radius: 3.0, speed: 0.15, count: 4, color: 0xFFB74D },
  { inclination: -Math.PI * 0.32, radius: 3.4, speed: 0.1, count: 4, color: 0x81C784 },
];

// 计算倾斜轨道上的 3D 位置（半径、倾斜角、角度 θ）
export function getOrbitPos(radius, inclination, theta) {
  return new THREE.Vector3(
    radius * Math.cos(theta),
    -radius * Math.sin(theta) * Math.sin(inclination),
    radius * Math.sin(theta) * Math.cos(inclination)
  );
}

// 十六进制颜色 → THREE.Color，非法值回退默认蓝色
export function hexToThreeColor(hex) {
  if (!hex) return new THREE.Color(0x4FC3F7);
  const c = new THREE.Color(hex);
  if (c.getHex() === 0) return new THREE.Color(0x4FC3F7);
  return c;
}

let glowCanvas = null;
// 生成径向渐变辉光纹理（缓存 Canvas，每次重新绘制）
export function getGlowTexture(color) {
  if (!glowCanvas) {
    glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
  }
  const ctx = glowCanvas.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, color || 'rgba(79, 195, 247, 1)');
  g.addColorStop(0.2, 'rgba(79, 195, 247, 0.6)');
  g.addColorStop(0.5, 'rgba(79, 195, 247, 0.2)');
  g.addColorStop(1, 'rgba(79, 195, 247, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(glowCanvas);
}

// 三次缓入缓出函数（用于跃迁动画插值）
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
