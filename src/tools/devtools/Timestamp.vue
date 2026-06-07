<template>
  <div class="devtools-pane">
    <div class="devtools-field">
      <label>当前时间戳</label>
      <input :value="now" readonly @click="copy(now)" />
    </div>
    <div class="devtools-field">
      <label>时间戳 → 时间</label>
      <input v-model.number="tsInput" placeholder="输入时间戳（秒或毫秒）" />
      <input :value="tsResult" readonly placeholder="转换结果" />
      <div class="devtools-actions"><button @click="tsToDate">转换</button></div>
    </div>
    <div class="devtools-field">
      <label>时间 → 时间戳</label>
      <input v-model="dateInput" type="datetime-local" />
      <div class="devtools-actions"><button @click="dateToTs">转换</button></div>
      <input :value="dateTsResult" readonly placeholder="结果" />
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const now = ref(''); const tsInput = ref(''); const tsResult = ref(''); const dateInput = ref(''); const dateTsResult = ref('');
setInterval(() => { now.value = String(Date.now()); }, 100);
function tsToDate() { const v = Number(tsInput.value); if (!v) return; tsResult.value = new Date(v > 1e12 ? v : v * 1000).toLocaleString('zh-CN', { hour12: false }); }
function dateToTs() { if (dateInput.value) dateTsResult.value = String(new Date(dateInput.value).getTime()); }
function copy(v) { navigator.clipboard?.writeText(String(v)); }
</script>
