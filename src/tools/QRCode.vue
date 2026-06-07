<template>
  <div class="tool-qrcode">
    <div class="devtools-tabs" style="margin-bottom:12px;">
      <button :class="['devtools-tab', { active: tab === 'gen' }]" @click="tab='gen'">生成</button>
      <button :class="['devtools-tab', { active: tab === 'decode' }]" @click="tab='decode'">识别</button>
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
  </div>
</template>

<script setup>
import { ref } from 'vue';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

const tab = ref('gen');
const text = ref('');
const dataUrl = ref('');
const decodeResult = ref('');
const decodeError = ref('');

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
</script>
