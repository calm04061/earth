<template>
  <div class="devtools-pane">
    <div class="devtools-field">
      <label>UUID v4</label>
      <input :value="single" readonly @click="copy(single)" />
    </div>
    <div class="devtools-actions">
      <button @click="genOne">生成</button>
      <button @click="genBatch">批量生成 5 个</button>
      <button @click="copy(batch)">复制全部</button>
    </div>
    <textarea v-if="batch" :value="batch" readonly rows="5" class="devtools-textarea"></textarea>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const single = ref(''); const batch = ref('');
function _uuid() { return crypto.randomUUID(); }
function genOne() { single.value = _uuid(); batch.value = ''; }
function genBatch() { batch.value = Array.from({ length: 5 }, () => _uuid()).join('\n'); single.value = batch.value.split('\n')[0]; }
function copy(v) { if (v) navigator.clipboard?.writeText(v); }
</script>
