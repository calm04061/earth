<template>
  <div class="devtools-pane">
    <textarea v-model="input" placeholder="每行一条数据..." rows="5" class="devtools-textarea"></textarea>
    <div class="devtools-actions">
      <button @click="sort">排序</button>
      <button @click="unique">去重</button>
      <button @click="sortUnique">排序+去重</button>
      <button @click="copy(result)">复制</button>
    </div>
    <textarea v-if="result" :value="result" readonly rows="5" class="devtools-textarea"></textarea>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const input = ref(''); const result = ref('');
function sort() { result.value = input.value.split('\n').filter(Boolean).sort().join('\n'); }
function unique() { result.value = [...new Set(input.value.split('\n').filter(Boolean))].join('\n'); }
function sortUnique() { result.value = [...new Set(input.value.split('\n').filter(Boolean))].sort().join('\n'); }
function copy(v) { if (v) navigator.clipboard?.writeText(v); }
</script>
