<template>
  <div class="devtools-pane">
    <textarea v-model="left" placeholder="左侧 JSON..." rows="4" class="devtools-textarea"></textarea>
    <textarea v-model="right" placeholder="右侧 JSON..." rows="4" class="devtools-textarea"></textarea>
    <div class="devtools-actions"><button @click="diff">对比</button></div>
    <pre v-if="result" class="devtools-pre">{{ result }}</pre>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const left = ref(''); const right = ref(''); const result = ref('');
function sortKeys(o) {
  if (o !== null && typeof o === 'object' && !Array.isArray(o)) {
    return Object.keys(o).sort().reduce((acc, k) => { acc[k] = sortKeys(o[k]); return acc; }, {});
  }
  if (Array.isArray(o)) return o.map(sortKeys);
  return o;
}
function diff() {
  const a = left.value.trim(), b = right.value.trim();
  if (!a && !b) { result.value = '请粘贴 JSON'; return; }
  try {
    const o1 = sortKeys(JSON.parse(a)), o2 = sortKeys(JSON.parse(b));
    const s1 = JSON.stringify(o1, null, 2), s2 = JSON.stringify(o2, null, 2);
    if (s1 === s2) { result.value = '✅ 完全相同'; return; }
    const l1 = s1.split('\n'), l2 = s2.split('\n');
    const max = Math.max(l1.length, l2.length);
    let out = '';
    for (let i = 0; i < max; i++) {
      if (l1[i] !== l2[i]) {
        if (l1[i] !== undefined) out += `- ${l1[i]}\n`;
        if (l2[i] !== undefined) out += `+ ${l2[i]}\n`;
      } else out += `  ${l1[i]}\n`;
    }
    result.value = out;
  } catch (e) { result.value = '解析错误: ' + e.message; }
}
</script>
