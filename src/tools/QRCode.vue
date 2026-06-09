<template>
  <div class="tool-qrcode">
    <div class="devtools-tabs" style="margin-bottom:12px;">
      <button :class="['devtools-tab', { active: tab === 'gen' }]" @click="switchTab('gen')">生成</button>
      <button :class="['devtools-tab', { active: tab === 'decode' }]" @click="switchTab('decode')">图片</button>
      <button :class="['devtools-tab', { active: tab === 'scan' }]" @click="switchTab('scan')">扫码</button>
    </div>

    <div v-if="tab === 'gen'">
      <div class="qrcode-input-row">
        <input v-model="text" placeholder="输入文本或链接..." @keydown.enter="generate" />
        <button class="qrcode-gen-btn" @click="generate">生成</button>
      </div>
      <div v-if="dataUrl" class="qrcode-display"><img :src="dataUrl" alt="QR Code" /></div>
      <div v-if="dataUrl" class="devtools-actions" style="justify-content:center;margin-top:8px;">
        <button @click="download">下载 PNG</button>
      </div>
    </div>

    <div v-if="tab === 'decode'">
      <div class="qrcode-input-row">
        <input type="file" accept="image/*" @change="onFile" style="flex:1;padding:8px;background:rgba(255,255,255,0.05);border-radius:8px;color:#fff;border:1px solid rgba(255,255,255,0.1);" />
      </div>
      <div v-if="decodeResult" class="devtools-pre" style="margin-top:8px;">
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px;">识别结果</div>
        <div>{{ decodeResult }}</div>
      </div>
      <div v-if="decodeError" class="devtools-error" style="margin-top:8px;">{{ decodeError }}</div>
    </div>

    <div v-if="tab === 'scan'">
      <div class="qrcode-scan-preview">
        <video ref="videoRef" autoplay playsinline muted></video>
        <canvas ref="scanCanvas" style="display:none"></canvas>
        <div v-if="!scanning && !scanResult" class="qrcode-scan-overlay">
          <button @click="startScan" class="qrcode-gen-btn">启动摄像头</button>
        </div>
      </div>
      <div v-if="scanning" class="qrcode-scan-hint">正在扫描二维码...</div>
      <div v-if="scanResult" class="devtools-pre" style="margin-top:8px;">
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px;">识别结果</div>
        <div>{{ scanResult }}</div>
        <button @click="resetScan" class="qrcode-gen-btn" style="margin-top:8px;">继续扫描</button>
      </div>
      <div v-if="scanError" class="devtools-error" style="margin-top:8px;">{{ scanError }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

const tab = ref('gen');
const text = ref('');
const dataUrl = ref('');
const decodeResult = ref('');
const decodeError = ref('');
const videoRef = ref(null);
const scanCanvas = ref(null);
const scanning = ref(false);
const scanResult = ref('');
const scanError = ref('');
let stream = null;
let animFrame = null;
let frameSkip = 0;

function switchTab(t) {
  stopScan();
  tab.value = t;
}

async function generate() {
  if (!text.value.trim()) return;
  try {
    dataUrl.value = await QRCode.toDataURL(text.value, { width: 280, margin: 2, color: { dark: '#000', light: '#fff' } });
  } catch {}
}

function download() {
  if (!dataUrl.value) return;
  const a = document.createElement('a');
  a.href = dataUrl.value;
  a.download = 'qrcode.png';
  a.click();
}

function onFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  decodeResult.value = '';
  decodeError.value = '';
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(data.data, data.width, data.height);
    if (code) decodeResult.value = code.data;
    else decodeError.value = '未识别到二维码';
  };
  img.onerror = () => { decodeError.value = '图片加载失败'; };
  img.src = URL.createObjectURL(file);
}

async function startScan() {
  scanResult.value = '';
  scanError.value = '';
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      videoRef.value.onloadedmetadata = () => {
        videoRef.value.play();
        scanning.value = true;
        scanLoop();
      };
    }
  } catch (e) {
    scanError.value = '无法访问摄像头: ' + (e.message || '');
  }
}

function scanLoop() {
  if (!scanning.value) return;
  frameSkip++;
  if (frameSkip % 3 === 0) {
    const video = videoRef.value;
    const canvas = scanCanvas.value;
    if (video && canvas && video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(data.data, data.width, data.height);
      if (code) {
        scanResult.value = code.data;
        stopScan();
        return;
      }
    }
  }
  animFrame = requestAnimationFrame(scanLoop);
}

function stopScan() {
  scanning.value = false;
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  if (videoRef.value) videoRef.value.srcObject = null;
}

function resetScan() {
  scanResult.value = '';
  scanError.value = '';
  startScan();
}

onUnmounted(stopScan);
</script>
