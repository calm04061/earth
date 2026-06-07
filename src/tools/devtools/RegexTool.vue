<template>
  <div class="devtools-pane">
    <div class="devtools-field">
      <label>正则表达式</label>
      <input v-model="pattern" placeholder="如 \\d+" />
    </div>
    <div class="devtools-field">
      <label>测试文本</label>
      <textarea v-model="text" rows="4" class="devtools-textarea"></textarea>
    </div>
    <div class="devtools-actions"><button @click="test">测试</button></div>
    <div v-if="result !== null" class="devtools-pre">{{ result }}</div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const pattern = ref(''); const text = ref(''); const result = ref(null);
function test() {
  try { const re = new RegExp(pattern.value, 'g'); const m = [...text.value.matchAll(re)]; result.value = m.length ? `✅ 匹配 ${m.length} 处:\n` + m.map(x => `  "${x[0]}" (位置 ${x.index})`).join('\n') : '❌ 无匹配'; }
  catch (e) { result.value = '正则错误: ' + e.message; }
}
</script>
