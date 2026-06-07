<template>
  <div class="devtools-pane">
    <textarea v-model="input" placeholder="输入文本..." rows="4" class="devtools-textarea"></textarea>
    <div class="devtools-actions">
      <button @click="calc('SHA-1')">SHA1</button>
      <button @click="calc('SHA-256')">SHA256</button>
      <button @click="calc('SHA-384')">SHA384</button>
      <button @click="calc('SHA-512')">SHA512</button>
    </div>
    <div v-for="r in results" :key="r.alg" class="devtools-pre" style="margin-bottom:4px;">
      <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:2px;">{{ r.alg }}</div>
      <div style="word-break:break-all;font-size:11px;cursor:pointer;" @click="copy(r.val)">{{ r.val }}</div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const input = ref(''); const results = ref([]);
async function calc(alg) {
  if (!input.value) return;
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest(alg, enc.encode(input.value));
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  const existing = results.value.find(r => r.alg === alg);
  if (existing) existing.val = hex; else results.value.push({ alg, val: hex });
}
function copy(v) { if (v) navigator.clipboard?.writeText(v); }
</script>
