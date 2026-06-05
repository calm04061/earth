<template>
  <div class="tool-weather">
    <div class="weather-main">
      <div class="weather-icon">{{ icon }}</div>
      <div class="weather-temp">{{ temp }}<span>°C</span></div>
    </div>
    <div class="weather-desc">{{ desc }} · 北京</div>
    <div class="weather-details">
      <div class="weather-detail-item"><span class="label">湿度</span><span class="value">{{ humidity }}%</span></div>
      <div class="weather-detail-item"><span class="label">风速</span><span class="value">{{ wind }}m/s</span></div>
      <div class="weather-detail-item"><span class="label">降水</span><span class="value">{{ rain }}%</span></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const w = ['☀️', '⛅', '🌤️', '🌧️', '⛈️', '❄️', '🌫️'];
const d = ['晴朗', '多云', '晴转多云', '小雨', '雷阵雨', '小雪', '雾'];
const i = Math.floor(Math.random() * w.length);
const icon = ref(w[i]);
const desc = ref(d[i]);
const temp = ref(Math.floor(Math.random() * 15 + 20));
const humidity = ref(Math.floor(Math.random() * 40 + 40));
const wind = ref(Math.floor(Math.random() * 5 + 1));
const rain = ref(Math.floor(Math.random() * 30));
</script>
