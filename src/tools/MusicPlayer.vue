<template>
  <div class="tool-music">
    <div class="music-art">{{ current.icon }}</div>
    <div class="music-title">{{ current.title }}</div>
    <div class="music-artist">{{ current.artist }}</div>
    <div class="music-progress">
      <span class="music-progress-time">{{ currentTime }}</span>
      <input type="range" v-model.number="progress" min="0" max="100" />
      <span class="music-progress-time">{{ totalTime }}</span>
    </div>
    <div class="music-controls">
      <button class="music-btn" @click="prev">⏮</button>
      <button class="music-btn play" @click="togglePlay">{{ playing ? '⏸' : '▶' }}</button>
      <button class="music-btn" @click="next">⏭</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';

const tracks = [
  { title: '晴天', artist: '周杰伦', icon: '☀️' },
  { title: '夜曲', artist: '周杰伦', icon: '🌙' },
  { title: '光年之外', artist: '邓紫棋', icon: '✨' },
  { title: '平凡之路', artist: '朴树', icon: '🛤️' },
];
const idx = ref(0);
const playing = ref(false);
const progress = ref(0);
let interval = null;

const current = computed(() => tracks[idx.value]);
const currentTime = computed(() => `${Math.floor(progress.value / 60)}:${String(Math.floor(progress.value % 60)).padStart(2, '0')}`);
const totalTime = computed(() => '3:30');

function togglePlay() {
  playing.value = !playing.value;
  if (playing.value) {
    interval = setInterval(() => {
      progress.value += 0.5;
      if (progress.value >= 100) { progress.value = 0; playing.value = false; clearInterval(interval); interval = null; }
    }, 300);
  } else {
    clearInterval(interval);
  }
}
function prev() { idx.value = (idx.value - 1 + tracks.length) % tracks.length; progress.value = 0; playing.value = false; clearInterval(interval); interval = null; }
function next() { idx.value = (idx.value + 1) % tracks.length; progress.value = 0; playing.value = false; clearInterval(interval); interval = null; }

onUnmounted(() => { clearInterval(interval); });
</script>
