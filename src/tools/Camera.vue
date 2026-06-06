<template>
  <div class="tool-camera">
    <div class="camera-viewfinder" ref="viewRef">
      <video v-show="streaming && !capturedImg" ref="videoRef" autoplay playsinline></video>
      <canvas v-show="capturedImg" ref="canvasRef" :style="{ backgroundImage: `url(${capturedImg})` }"></canvas>
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
const canvasRef = ref(null);
const streaming = ref(false);
const capturedImg = ref('');
const error = ref('');

let stream = null;

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

  const flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;background:#fff;z-index:10;border-radius:12px;';
  viewRef.value?.appendChild(flash);
  setTimeout(() => flash.remove(), 200);
}

function retake() {
  capturedImg.value = '';
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
