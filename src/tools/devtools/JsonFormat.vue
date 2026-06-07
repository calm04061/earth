<template>
  <div class="devtools-pane">
    <textarea v-model="input" placeholder="粘贴 JSON..." rows="5" class="devtools-textarea"></textarea>
    <div class="devtools-actions">
      <button @click="format">格式化</button>
      <button @click="compress">压缩</button>
      <button @click="validate">校验</button>
      <button @click="copy(output)">复制</button>
    </div>
    <pre v-if="output" class="devtools-pre">{{ output }}</pre>
    <div v-if="error" class="devtools-error">{{ error }}</div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const input = ref(''); const output = ref(''); const error = ref('');
function format() { try { output.value = JSON.stringify(JSON.parse(input.value), null, 2); error.value = ''; } catch (e) { error.value = e.message; } }
function compress() { try { output.value = JSON.stringify(JSON.parse(input.value)); error.value = ''; } catch (e) { error.value = e.message; } }
function validate() { try { JSON.parse(input.value); error.value = '✅ 合法 JSON'; output.value = ''; } catch (e) { error.value = '❌ ' + e.message; } }
function copy(v) { if (v) navigator.clipboard?.writeText(v); }
</script>
