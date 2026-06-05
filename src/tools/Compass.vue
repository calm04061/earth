<template>
  <div class="tool-compass">
    <div v-if="unavailable" class="compass-unavailable">
      <div class="compass-icon">🧭</div>
      <p>请在移动设备上使用</p>
      <span class="sub">指南针需要设备方向传感器</span>
    </div>
    <div v-else-if="needsPermission" class="compass-unavailable">
      <div class="compass-icon">🧭</div>
      <p>需要获取设备方向权限</p>
      <button class="compass-permit-btn" @click="requestPermission">允许访问</button>
    </div>
    <div v-else>
      <div class="compass-wrap"><canvas ref="canvasRef" width="200" height="200"></canvas></div>
      <div class="compass-direction">{{ direction }}</div>
      <div class="compass-degree">{{ degree }}°</div>
      <div class="compass-status" :class="{ ok: hasFix }">{{ statusText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvasRef = ref(null);
const direction = ref('北');
const degree = ref('0');
const hasFix = ref(false);
const statusText = ref('校准中...');
const unavailable = ref(false);
const needsPermission = ref(false);

const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
let heading = 0;
let animFrame = null;

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 100, cy = 100, r = 90;
  const angle = -heading;

  ctx.clearRect(0, 0, 200, 200);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const a = (i * 45 + angle - 90) * Math.PI / 180;
    const x = cx + Math.cos(a) * (r - 14);
    const y = cy + Math.sin(a) * (r - 14);
    ctx.fillStyle = i === 0 ? '#FF5252' : '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dirs[i], x, y);
  }

  for (let i = 0; i < 72; i++) {
    const a = (i * 5 + angle - 90) * Math.PI / 180;
    const len = i % 6 === 0 ? 12 : 6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - len), cy + Math.sin(a) * (r - len));
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.strokeStyle = i % 6 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = i % 6 === 0 ? 1.5 : 0.5;
    ctx.stroke();
  }

  const needle = (a, color) => {
    const rad = (a - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * (r - 10), cy + Math.sin(rad) * (r - 10));
    ctx.lineTo(cx - Math.cos(rad + 0.4) * 14, cy - Math.sin(rad + 0.4) * 14);
    ctx.lineTo(cx - Math.cos(rad - 0.4) * 14, cy - Math.sin(rad - 0.4) * 14);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  needle(0, '#FF5252');
  needle(180, 'rgba(255,255,255,0.3)');
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#4FC3F7';
  ctx.fill();

  const idx = Math.round((((heading % 360) + 360) % 360) / 45) % 8;
  direction.value = dirs[idx];
  degree.value = String(Math.round(((heading % 360) + 360) % 360));
}

function renderLoop() {
  draw();
  animFrame = requestAnimationFrame(renderLoop);
}

function onOrientation(e) {
  const a = e.alpha;
  if (a !== null && a !== undefined) {
    heading = a;
    hasFix.value = true;
    statusText.value = '传感器已连接';
  }
}

async function requestPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res === 'granted') {
        needsPermission.value = false;
        window.addEventListener('deviceorientation', onOrientation);
      }
    } catch {}
  }
}

onMounted(() => {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!isMobile) {
    unavailable.value = true;
    return;
  }

  // Check if permission API is needed (iOS 13+)
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    needsPermission.value = true;
    return;
  }

  // Try regular API
  window.addEventListener('deviceorientation', onOrientation);
  renderLoop();

  // Fallback: if no event fires within 3s, show unavailable
  setTimeout(() => {
    if (!hasFix.value) {
      unavailable.value = true;
      window.removeEventListener('deviceorientation', onOrientation);
    }
  }, 3000);
});

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame);
  window.removeEventListener('deviceorientation', onOrientation);
});
</script>
