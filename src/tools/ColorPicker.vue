<template>
  <div class="tool-colorpicker">
    <div class="colorpicker-main">
      <!-- 颜色预览区：实时显示当前 RGB 值对应的颜色 -->
      <div class="colorpicker-preview" :style="{ background: `rgb(${r},${g},${b})` }"></div>
      <!-- RGB 三通道滑块 -->
      <div class="colorpicker-sliders">
        <div class="colorpicker-slider-row">
          <label style="color:#FF5252">R</label>
          <input type="range" v-model.number="r" min="0" max="255" />
          <span class="val">{{ r }}</span>
        </div>
        <div class="colorpicker-slider-row">
          <label style="color:#81C784">G</label>
          <input type="range" v-model.number="g" min="0" max="255" />
          <span class="val">{{ g }}</span>
        </div>
        <div class="colorpicker-slider-row">
          <label style="color:#4FC3F7">B</label>
          <input type="range" v-model.number="b" min="0" max="255" />
          <span class="val">{{ b }}</span>
        </div>
      </div>
      <!-- 十六进制色值显示 -->
      <div class="colorpicker-hex">{{ hex }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
const r = ref(79);
const g = ref(195);
const b = ref(247);
// 计算并展示形如 #4FC3F7 的十六进制色值
const hex = computed(() => '#' + [r.value, g.value, b.value].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase());
</script>
