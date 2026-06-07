<template>
  <div class="devtools-pane">
    <textarea v-model="input" placeholder="输入文本或 URL..." rows="4" class="devtools-textarea"></textarea>
    <div class="devtools-actions">
      <button @click="encode">编码</button>
      <button @click="decode">解码</button>
      <button @click="copy(result)">复制</button>
    </div>
    <textarea v-if="result" :value="result" readonly rows="4" class="devtools-textarea"></textarea>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const input = ref(''); const result = ref('');
function encode() { result.value = encodeURIComponent(input.value); }
function decode() { try { result.value = decodeURIComponent(input.value); } catch { result.value = '解码失败'; } }
function copy(v) { if (v) navigator.clipboard?.writeText(v); }
</script>
