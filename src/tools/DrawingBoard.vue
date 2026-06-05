<template>
  <div class="tool-drawing">
    <div class="drawing-canvas-wrap"><canvas ref="canvasRef" width="360" height="240"></canvas></div>
    <div class="drawing-tools">
      <button v-for="c in colors" :key="c"
        :class="['drawing-color', { active: currentColor === c }]"
        :style="{ background: c }"
        @click="currentColor = c"></button>
      <div class="drawing-size">
        <span>●</span>
        <input type="range" v-model.number="brushSize" min="1" max="20" />
        <span>●</span>
      </div>
      <button class="drawing-clear" @click="clearCanvas">清空</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvasRef = ref(null);
const colors = ['#4FC3F7', '#FF5252', '#81C784', '#FFD54F', '#BA68C8', '#FFFFFF'];
const currentColor = ref('#4FC3F7');
const brushSize = ref(4);
let painting = false;

function getPos(e) {
  const canvas = canvasRef.value;
  if (!canvas) return [0, 0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const t = e.touches ? e.touches[0] : e;
  return [(t.clientX - rect.left) * scaleX, (t.clientY - rect.top) * scaleY];
}

function startPaint(e) {
  painting = true;
  const [x, y] = getPos(e);
  draw(x, y);
}
function movePaint(e) {
  if (!painting) return;
  const [x, y] = getPos(e);
  draw(x, y);
}
function endPaint() { painting = false; }

function draw(x, y) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = currentColor.value;
  ctx.beginPath();
  ctx.arc(x, y, brushSize.value / 2, 0, Math.PI * 2);
  ctx.fill();
}

function clearCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  canvas.addEventListener('mousedown', startPaint);
  canvas.addEventListener('mousemove', movePaint);
  canvas.addEventListener('mouseup', endPaint);
  canvas.addEventListener('mouseleave', endPaint);
  canvas.addEventListener('touchstart', startPaint);
  canvas.addEventListener('touchmove', movePaint);
  canvas.addEventListener('touchend', endPaint);
});
onUnmounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.removeEventListener('mousedown', startPaint);
  canvas.removeEventListener('mousemove', movePaint);
  // cleanup others... keep it simple
});
</script>
