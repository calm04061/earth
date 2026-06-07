<template>
  <div class="devtools-pane">
    <div class="devtools-field">
      <label>数值</label>
      <input v-model.number="value" type="number" placeholder="输入数值" />
    </div>
    <div class="devtools-field">
      <label>从</label>
      <select v-model="from" class="devtools-select">
        <option v-for="u in units" :key="u.v" :value="u.v">{{ u.l }}</option>
      </select>
    </div>
    <div class="devtools-actions"><button @click="convert">转换</button></div>
    <div class="devtools-pre">
      <div v-for="r in results" :key="r.unit" class="devtools-len-row">
        <span class="devtools-len-val">{{ r.val }}</span>
        <span class="devtools-len-unit">{{ r.label }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const value = ref(1); const from = ref('m'); const results = ref([]);
const units = [
  { v: 'mm', l: '毫米 (mm)' }, { v: 'cm', l: '厘米 (cm)' }, { v: 'm', l: '米 (m)' }, { v: 'km', l: '千米 (km)' },
  { v: 'in', l: '英寸 (in)' }, { v: 'ft', l: '英尺 (ft)' }, { v: 'yd', l: '码 (yd)' }, { v: 'mi', l: '英里 (mi)' },
];
const toM = { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 };
function convert() {
  const v = Number(value.value); if (!v) return;
  const meters = v * (toM[from.value] || 1);
  results.value = units.map(u => ({ label: u.l, unit: u.v, val: u.v === from.value ? String(v) : Number((meters / toM[u.v]).toFixed(6)).toString() }));
}
</script>
