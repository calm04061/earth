<template>
  <div class="devtools-pane">
    <textarea v-model="input" placeholder="粘贴 JSON..." rows="5" class="devtools-textarea"></textarea>
    <div class="devtools-actions">
      <button @click="format">格式化</button>
      <button @click="compress">压缩</button>
      <button @click="sortKeys">排序</button>
      <button @click="validate">校验</button>
      <button @click="copy(output)">复制</button>
    </div>
    <div v-if="output" class="devtools-pre json-output" v-html="outputHtml"></div>
    <div v-if="error" class="devtools-error">{{ error }}</div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue';
const input = ref(''); const output = ref(''); const error = ref('');

function sortObj(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObj);
  return Object.keys(obj).sort().reduce((acc, k) => { acc[k] = sortObj(obj[k]); return acc; }, {});
}

function formatJSON(src) {
  const parsed = JSON.parse(src);
  output.value = JSON.stringify(parsed, null, 2);
  error.value = '';
}

function format() { try { formatJSON(input.value); } catch (e) { error.value = e.message; } }
function compress() { try { output.value = JSON.stringify(JSON.parse(input.value)); error.value = ''; } catch (e) { error.value = e.message; } }
function sortKeys() { try { formatJSON(JSON.stringify(sortObj(JSON.parse(input.value)))); } catch (e) { error.value = e.message; } }
function validate() { try { JSON.parse(input.value); error.value = '✅ 合法 JSON'; output.value = ''; } catch (e) { error.value = '❌ ' + e.message; } }
function copy(v) { if (v) navigator.clipboard?.writeText(v); }

const outputHtml = computed(() => {
  if (!output.value) return '';
  return output.value.split('\n').map((line, i) =>
    `<span class="json-ln">${String(i + 1).padStart(3, ' ')}</span> ${escapeHtml(line)}`
  ).join('\n');
});

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
</script>
<style scoped>
.json-output { font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace; font-size: 13px; line-height: 1.6; }
.json-ln { display: inline-block; width: 2.4em; text-align: right; margin-right: 0.8em; color: rgba(255,255,255,0.2); user-select: none; pointer-events: none; }
</style>
