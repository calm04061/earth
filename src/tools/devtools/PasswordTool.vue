<template>
  <div class="devtools-pane">
    <div class="devtools-field">
      <label>长度</label>
      <input v-model.number="len" type="range" min="6" max="64" style="width:100%;" />
      <span style="font-size:12px;color:rgba(255,255,255,0.4);">{{ len }} 位</span>
    </div>
    <div class="devtools-field" style="flex-direction:row;gap:12px;flex-wrap:wrap;">
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" v-model="upper" /> 大写</label>
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" v-model="lower" /> 小写</label>
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" v-model="digit" /> 数字</label>
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" v-model="sym" /> 特殊字符</label>
    </div>
    <div class="devtools-actions">
      <button @click="generate">生成</button>
      <button @click="copy(pwResult)">复制</button>
    </div>
    <div v-if="pwResult" class="devtools-pre" style="text-align:center;font-size:18px;letter-spacing:2px;">{{ pwResult }}</div>
    <div class="devtools-field">
      <label>HTTP Basic Auth</label>
      <input v-model="httpUser" placeholder="用户名" />
      <div class="devtools-actions"><button @click="genHttpAuth">生成</button></div>
      <input v-if="httpResult" :value="httpResult" readonly @click="copy(httpResult)" />
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const len = ref(16); const upper = ref(true); const lower = ref(true); const digit = ref(true); const sym = ref(true);
const pwResult = ref(''); const httpUser = ref('admin'); const httpResult = ref('');
function generate() {
  const chars = (upper.value ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '') + (lower.value ? 'abcdefghijklmnopqrstuvwxyz' : '') + (digit.value ? '0123456789' : '') + (sym.value ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '');
  if (!chars) { pwResult.value = '请至少选择一种字符类型'; return; }
  pwResult.value = Array.from({ length: len.value }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function genHttpAuth() { httpResult.value = 'Basic ' + btoa(httpUser.value + ':' + (pwResult.value || 'password')); }
function copy(v) { if (v) navigator.clipboard?.writeText(v); }
</script>
