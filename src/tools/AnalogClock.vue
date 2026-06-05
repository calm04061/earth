<template>
  <div class="tool-clock">
    <div class="clock-canvas-wrap"><canvas ref="canvasRef" width="200" height="200"></canvas></div>
    <div class="clock-digital">{{ digital }}</div>
    <div class="clock-date">{{ dateStr }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvasRef = ref(null);
const digital = ref('');
const dateStr = ref('');
let interval = null;

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const cx = 100, cy = 100, r = 88;

  ctx.clearRect(0, 0, 200, 200);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(79,195,247,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a = (i * 30 - 90) * Math.PI / 180;
    const x1 = cx + Math.cos(a) * (r - 8);
    const y1 = cy + Math.sin(a) * (r - 8);
    const x2 = cx + Math.cos(a) * (r - 2);
    const y2 = cy + Math.sin(a) * (r - 2);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = i % 3 === 0 ? 3 : 1;
    ctx.stroke();
  }

  const drawHand = (angle, length, width, color) => {
    const a = (angle - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * length, cy + Math.sin(a) * length);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  drawHand((h % 12) * 30 + m * 0.5, r * 0.5, 4, '#fff');
  drawHand(m * 6 + s * 0.1, r * 0.65, 3, 'rgba(255,255,255,0.8)');
  drawHand(s * 6, r * 0.75, 1.5, '#FF5252');
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#4FC3F7';
  ctx.fill();

  digital.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  dateStr.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`;
}

onMounted(() => { draw(); interval = setInterval(draw, 1000); });
onUnmounted(() => { clearInterval(interval); });
</script>
