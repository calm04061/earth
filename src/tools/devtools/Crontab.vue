<template>
  <div class="devtools-pane">
    <div class="devtools-field">
      <label>Cron 表达式</label>
      <input v-model="expr" placeholder="如 */5 * * * *" />
      <div class="devtools-actions"><button @click="parse">解析</button></div>
    </div>
    <div v-if="result" class="devtools-pre">{{ result }}</div>
    <div class="devtools-field">
      <label>常用示例</label>
      <div v-for="ex in examples" :key="ex.expr" class="devtools-cron-example" @click="expr = ex.expr; parse()">
        <code>{{ ex.expr }}</code><span>{{ ex.desc }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const expr = ref(''); const result = ref('');
const examples = [
  { expr: '0 0 * * *', desc: '每天午夜' }, { expr: '*/5 * * * *', desc: '每5分钟' },
  { expr: '0 9 * * 1-5', desc: '工作日早9点' }, { expr: '0 0 1 * *', desc: '每月1号' },
  { expr: '0 0 * * 0', desc: '每周日' }, { expr: '*/30 9-18 * * *', desc: '9-18点每30分钟' },
  { expr: '0 0,12 * * *', desc: '每天0点和12点' }, { expr: '0 3 */2 * *', desc: '每2天凌晨3点' },
];
function parse() {
  const parts = expr.value.trim().split(/\s+/);
  if (parts.length < 5) { result.value = '格式错误，需5段空格分隔'; return; }
  const labels = ['分钟', '小时', '日', '月', '星期'];
  let out = '表达式: ' + expr.value + '\n';
  parts.forEach((p, i) => {
    let desc = p;
    if (p === '*') desc = '每' + (i < 2 ? '个' : '') + labels[i];
    else if (p.startsWith('*/')) desc = '每' + p.slice(1) + labels[i];
    else if (p.includes(',')) desc = p.split(',').join('、') + labels[i];
    else if (p.includes('-')) desc = '第' + p.split('-').join('到') + labels[i];
    else desc = p + labels[i];
    out += `  ${labels[i]}: ${desc}\n`;
  });
  result.value = out;
}
</script>
