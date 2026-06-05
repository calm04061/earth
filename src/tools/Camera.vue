<template>
  <div class="tool-camera">
    <div class="camera-viewfinder" ref="viewRef">
      <div class="placeholder"><div class="icon">📷</div><span>点击拍照</span></div>
    </div>
    <button class="camera-capture-btn" @click="capture"></button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const viewRef = ref(null);

function capture() {
  if (!viewRef.value) return;
  const flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;background:#fff;z-index:10;border-radius:12px;';
  viewRef.value.appendChild(flash);
  setTimeout(() => flash.remove(), 200);
}
</script>
