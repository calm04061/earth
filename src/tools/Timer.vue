<template>
  <div class="tool-timer">
    <div class="timer-inputs">
      <input type="number" v-model.number="inputH" min="0" max="99" /> <span>:</span>
      <input type="number" v-model.number="inputM" min="0" max="59" /> <span>:</span>
      <input type="number" v-model.number="inputS" min="0" max="59" />
    </div>
    <div class="timer-display">{{ display }}</div>
    <div class="timer-controls">
      <button class="timer-btn start" @click="startTimer">▶ 开始</button>
      <button class="timer-btn stop" @click="stopTimer">⏹ 停止</button>
      <button class="timer-btn reset" @click="resetTimer">↺ 重置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
const inputH = ref(0);
const inputM = ref(1);
const inputS = ref(0);
let total = ref(60);
let interval = null;

const display = computed(() => {
  const hh = String(Math.floor(total.value / 3600)).padStart(2, '0');
  const mm = String(Math.floor((total.value % 3600) / 60)).padStart(2, '0');
  const ss = String(total.value % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
});

function getInput() { return (inputH.value || 0) * 3600 + (inputM.value || 0) * 60 + (inputS.value || 0); }

function startTimer() {
  if (interval) return;
  if (total.value <= 0) total.value = getInput();
  if (total.value <= 0) return;
  interval = setInterval(() => {
    total.value--;
    if (total.value <= 0) { clearInterval(interval); interval = null; }
  }, 1000);
}
function stopTimer() { if (interval) { clearInterval(interval); interval = null; } }
function resetTimer() {
  if (interval) { clearInterval(interval); interval = null; }
  total.value = getInput();
  if (total.value <= 0) total.value = 60;
}
</script>
