<template>
  <div class="tool-compass">
    <div class="compass-wrap"><canvas ref="canvasRef" width="200" height="200"></canvas></div>
    <div class="compass-direction">{{ direction }}</div>
    <div class="compass-degree">{{ degree }}°</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvasRef = ref(null);
const direction = ref('北');
const degree = ref('0');
const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
let angle = 0;
let isDragging = false, lastX = 0;

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 100, cy = 100, r = 90;

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
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
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
    const rad = (a + angle - 90) * Math.PI / 180;
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

  const idx = Math.round(((angle % 360 + 360) % 360) / 45) % 8;
  direction.value = dirs[idx];
  degree.value = String(Math.round(((angle % 360 + 360) % 360)));
}

function onPointerDown(e) { isDragging = true; lastX = e.clientX || (e.touches && e.touches[0].clientX); }
function onPointerMove(e) {
  if (!isDragging) return;
  angle += ((e.clientX || (e.touches && e.touches[0].clientX)) - lastX) * 0.5;
  lastX = e.clientX || (e.touches && e.touches[0].clientX);
  draw();
}
function onPointerUp() { isDragging = false; }

onMounted(() => {
  draw();
  const el = canvasRef.value;
  if (!el) return;
  el.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  el.addEventListener('touchstart', onPointerDown);
  window.addEventListener('touchmove', onPointerMove);
  window.addEventListener('touchend', onPointerUp);
});
onUnmounted(() => {
  window.removeEventListener('mousemove', onPointerMove);
  window.removeEventListener('mouseup', onPointerUp);
  window.removeEventListener('touchmove', onPointerMove);
  window.removeEventListener('touchend', onPointerUp);
});
</script>
