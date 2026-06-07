<template>
  <div class="devtools-pane">
    <textarea v-model="input" placeholder="输入文本..." rows="4" class="devtools-textarea"></textarea>
    <div class="devtools-actions">
      <button @click="calc('sha1')">SHA1</button>
      <button @click="calc('sha256')">SHA256</button>
      <button @click="calc('sha384')">SHA384</button>
      <button @click="calc('sha512')">SHA512</button>
    </div>
    <div class="devtools-actions">
      <input type="file" ref="fileInput" @change="onFile" multiple style="display:none" />
      <button @click="$refs.fileInput.click()">选择文件</button>
      <span v-if="fileName" style="font-size:11px;color:rgba(255,255,255,0.5);margin-left:6px;">{{ fileName }}</span>
    </div>
    <div v-for="r in results" :key="r.alg" class="devtools-pre" style="margin-bottom:4px;">
      <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:2px;">{{ r.alg }}<span v-if="r.source" style="margin-left:6px;color:rgba(255,255,255,0.25);font-size:10px;">{{ r.source }}</span></div>
      <div style="word-break:break-all;font-size:11px;cursor:pointer;" @click="copy(r.val)">{{ r.val }}</div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';

const input = ref('');
const results = ref([]);
const fileInput = ref(null);
const fileName = ref('');

let wasmReady = false;
let sha1Fn, sha256Fn, sha384Fn, sha512Fn;

onMounted(async () => {
  try {
    const wasm = await import('../../../calc-wasm/pkg-web/calc_wasm.js');
    await wasm.default();
    sha1Fn = wasm.sha1_hash;
    sha256Fn = wasm.sha256_hash;
    sha384Fn = wasm.sha384_hash;
    sha512Fn = wasm.sha512_hash;
    wasmReady = true;
  } catch (e) {
    console.warn('WASM hash init failed', e);
  }
});

function hashBytes(data, alg) {
  const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
  switch (alg) {
    case 'sha1': return sha1Fn(u8);
    case 'sha256': return sha256Fn(u8);
    case 'sha384': return sha384Fn(u8);
    case 'sha512': return sha512Fn(u8);
    default: return '';
  }
}

async function calc(alg) {
  if (!input.value || !wasmReady) return;
  const enc = new TextEncoder();
  const data = enc.encode(input.value);
  const hex = hashBytes(data, alg);
  const existing = results.value.find(r => r.alg === alg.toUpperCase());
  if (existing) existing.val = hex;
  else results.value.push({ alg: alg.toUpperCase(), val: hex, source: '' });
}

async function onFile(e) {
  const files = e.target.files;
  if (!files.length || !wasmReady) return;
  fileName.value = Array.from(files).map(f => f.name).join(', ');
  const algs = ['sha1', 'sha256', 'sha384', 'sha512'];
  for (const file of files) {
    const buf = await file.arrayBuffer();
    const u8 = new Uint8Array(buf);
    for (const alg of algs) {
      const hex = hashBytes(u8, alg);
      results.value.push({ alg: alg.toUpperCase(), val: hex, source: file.name });
    }
  }
  fileInput.value.value = '';
}

function copy(v) { if (v) navigator.clipboard?.writeText(v); }
</script>