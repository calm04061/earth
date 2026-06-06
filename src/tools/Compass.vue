<template>
  <div class="tool-compass">
    <!-- 桌面端：传感器不可用提示 -->
    <div v-if="unavailable" class="compass-unavailable">
      <div class="compass-icon">🧭</div>
      <p>请在移动设备上使用</p>
      <span class="sub">指南针需要设备方向传感器</span>
    </div>
    <!-- iOS 13+：权限申请 -->
    <div v-else-if="needsPermission" class="compass-unavailable">
      <div class="compass-icon">🧭</div>
      <p>需要获取设备方向权限</p>
      <button class="compass-permit-btn" @click="requestPermission">允许访问</button>
    </div>
    <!-- 正常工作状态：Canvas 罗盘 + 方向/度数 -->
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
const hasFix = ref(false);        // 是否已获取到传感器数据
const statusText = ref('校准中...');
const unavailable = ref(false);   // 桌面端不可用
const needsPermission = ref(false); // iOS 需要权限

const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
let heading = 0;                  // 当前朝向角度（0=北）
let animFrame = null;

// 绘制罗盘（刻度旋转由 heading 驱动，指针固定向上指向北）
function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 100, cy = 100, r = 90;
  const angle = -heading;         // 刻度盘反向旋转，补偿设备朝向

  ctx.clearRect(0, 0, 200, 200);
  // 外圈
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 八个方向文字（北为红色）
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

  // 刻度线（每5°一条，每30°加粗）
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

  // 指针（红色朝北，半透明朝南）
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
  needle(0, '#FF5252');                        // 北（红色）
  needle(180, 'rgba(255,255,255,0.3)');        // 南（半透明白）
  // 中心圆点
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#4FC3F7';
  ctx.fill();

  // 更新方向文字和度数
  const idx = Math.round((((heading % 360) + 360) % 360) / 45) % 8;
  direction.value = dirs[idx];
  degree.value = String(Math.round(((heading % 360) + 360) % 360));
}

function renderLoop() {
  draw();
  animFrame = requestAnimationFrame(renderLoop);
}

// DeviceOrientation 事件回调
function onOrientation(e) {
  const a = e.alpha;
  if (a !== null && a !== undefined) {
    heading = a;
    hasFix.value = true;
    statusText.value = '传感器已连接';
  }
}

// iOS 13+ 需要用户手势触发权限
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

  // iOS 13+ 检测
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    needsPermission.value = true;
    return;
  }

  // 直接订阅传感器
  window.addEventListener('deviceorientation', onOrientation);
  renderLoop();

  // 3 秒超时未收到数据则回退
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
