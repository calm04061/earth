<template>
  <div class="devtools-pane">
    <textarea v-model="left" placeholder="左侧文本..." rows="4" class="devtools-textarea"></textarea>
    <textarea v-model="right" placeholder="右侧文本..." rows="4" class="devtools-textarea"></textarea>
    <div class="devtools-actions"><button @click="diff">对比</button></div>
    <pre v-if="result" class="devtools-pre">{{ result }}</pre>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const left = ref(''); const right = ref(''); const result = ref('');
function diff() {
  const l1 = left.value.split('\n'), l2 = right.value.split('\n');
  const max = Math.max(l1.length, l2.length); let out = '';
  for (let i = 0; i < max; i++) {
    if (l1[i] !== l2[i]) {
      if (l1[i] !== undefined) out += `- ${l1[i]}\n`;
      if (l2[i] !== undefined) out += `+ ${l2[i]}\n`;
    } else out += `  ${l1[i]}\n`;
  }
  result.value = out;
}
</script>
