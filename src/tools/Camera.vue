<template>
  <div class="tool-camera">
    <!-- 取景器区域（目前为占位图标，可扩展接入 getUserMedia） -->
    <div class="camera-viewfinder" ref="viewRef">
      <div class="placeholder"><div class="icon">📷</div><span>点击拍照</span></div>
    </div>
    <!-- 拍照按钮 -->
    <button class="camera-capture-btn" @click="capture"></button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const viewRef = ref(null);

// 模拟拍照：白色闪光效果
function capture() {
  if (!viewRef.value) return;
  const flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;background:#fff;z-index:10;border-radius:12px;';
  viewRef.value.appendChild(flash);
  setTimeout(() => flash.remove(), 200);
}
</script>
