<template>
  <div class="tool-camera">
    <div class="camera-viewfinder" ref="viewRef">
      <video v-show="streaming && !capturedImg" ref="videoRef" autoplay playsinline></video>
      <div v-show="capturedImg" class="camera-preview-wrap"
        ref="previewWrap"
        @wheel.prevent="onWheel"
        @mousedown="onDragStart"
        @mousemove="onDragMove"
        @mouseup="onDragEnd"
        @mouseleave="onDragEnd"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend="onTouchEnd"
        @dblclick="resetZoom"
      >
        <img ref="previewImg" :src="capturedImg" alt="captured"
          :style="{ transform: `scale(${zoom}) translate(${panX}px, ${panY}px)` }" />
        <div class="camera-zoom-info">{{ Math.round(zoom * 100) }}%</div>
      </div>
      <div v-if="!streaming && !capturedImg && !error" class="placeholder">
        <div class="icon">📷</div><span>正在启动相机...</span>
      </div>
      <div v-if="error" class="placeholder">
        <div class="icon">⚠️</div><span>{{ error }}</span>
      </div>
    </div>
    <div class="camera-actions">
      <button v-if="capturedImg" class="camera-btn secondary" @click="retake">重新拍摄</button>
      <button
        :class="['camera-capture-btn', { disabled: !streaming }]"
        :disabled="!streaming"
        @click="capture"
      ></button>
      <button v-if="capturedImg" class="camera-btn secondary" @click="download">保存</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const viewRef = ref(null);
const videoRef = ref(null);
const previewWrap = ref(null);
const previewImg = ref(null);
const streaming = ref(false);
const capturedImg = ref('');
const error = ref('');

let stream = null;
let zoom = 1;
let panX = 0, panY = 0;
let dragging = false, dragStartX, dragStartY, panStartX, panStartY;
let lastTouchDist = 0;

function applyTransform() {
  if (!previewImg.value) return;
  previewImg.value.style.transform = `scaleX(-1) scale(${zoom}) translate(${panX}px, ${panY}px)`;
}

function onWheel(e) {
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  zoom = Math.max(1, Math.min(5, zoom + delta));
  applyTransform();
}

function onDragStart(e) {
  if (zoom <= 1) return;
  dragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  panStartX = panX;
  panStartY = panY;
}

function onDragMove(e) {
  if (!dragging) return;
  panX = panStartX + (e.clientX - dragStartX);
  panY = panStartY + (e.clientY - dragStartY);
  applyTransform();
}

function onDragEnd() {
  dragging = false;
}

let touchIds = [];
function onTouchStart(e) {
  touchIds = e.touches;
  if (touchIds.length === 1 && zoom > 1) {
    const t = touchIds[0];
    dragging = true;
    dragStartX = t.clientX;
    dragStartY = t.clientY;
    panStartX = panX;
    panStartY = panY;
  } else if (touchIds.length === 2) {
    dragging = false;
    lastTouchDist = Math.hypot(
      touchIds[0].clientX - touchIds[1].clientX,
      touchIds[0].clientY - touchIds[1].clientY
    );
  }
}

function onTouchMove(e) {
  if (e.touches.length === 1 && dragging) {
    const t = e.touches[0];
    panX = panStartX + (t.clientX - dragStartX);
    panY = panStartY + (t.clientY - dragStartY);
    applyTransform();
  } else if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    if (lastTouchDist) {
      zoom = Math.max(1, Math.min(5, zoom * (dist / lastTouchDist)));
      applyTransform();
    }
    lastTouchDist = dist;
  }
}

function onTouchEnd() {
  dragging = false;
  lastTouchDist = 0;
}

function resetZoom() {
  zoom = 1;
  panX = 0;
  panY = 0;
  applyTransform();
}

async function startCamera() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      const isSecure = window.isSecureContext;
      if (!isSecure) error.value = '相机需要 HTTPS 或 localhost 环境';
      else error.value = '当前浏览器不支持相机 API';
      return;
    }
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    await nextTick();
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      streaming.value = true;
    }
  } catch (e) {
    if (e.name === 'NotAllowedError') error.value = '相机权限被拒绝，请在浏览器设置中允许';
    else if (e.name === 'NotFoundError') error.value = '未检测到摄像头';
    else error.value = '相机启动失败: ' + e.message;
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  streaming.value = false;
}

function capture() {
  if (!videoRef.value || !streaming.value) return;
  const video = videoRef.value;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  capturedImg.value = canvas.toDataURL('image/jpeg', 0.85);
  resetZoom();

  const flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;background:#fff;z-index:10;border-radius:12px;';
  viewRef.value?.appendChild(flash);
  setTimeout(() => flash.remove(), 200);
}

function retake() {
  capturedImg.value = '';
  resetZoom();
  startCamera();
}

function download() {
  if (!capturedImg.value) return;
  const a = document.createElement('a');
  a.href = capturedImg.value;
  a.download = `photo_${Date.now()}.jpg`;
  a.click();
}

onMounted(() => {
  startCamera();
});

onUnmounted(() => {
  stopCamera();
});
</script>
