<template>
  <div class="tool-calculator">
    <div class="calc-display">{{ display }}</div>
    <div class="calc-buttons">
      <button class="calc-btn num" @click="input('7')">7</button>
      <button class="calc-btn num" @click="input('8')">8</button>
      <button class="calc-btn num" @click="input('9')">9</button>
      <button class="calc-btn op" @click="input('/')">÷</button>
      <button class="calc-btn num" @click="input('4')">4</button>
      <button class="calc-btn num" @click="input('5')">5</button>
      <button class="calc-btn num" @click="input('6')">6</button>
      <button class="calc-btn op" @click="input('*')">×</button>
      <button class="calc-btn num" @click="input('1')">1</button>
      <button class="calc-btn num" @click="input('2')">2</button>
      <button class="calc-btn num" @click="input('3')">3</button>
      <button class="calc-btn op" @click="input('-')">−</button>
      <button class="calc-btn num" @click="input('0')">0</button>
      <button class="calc-btn num" @click="input('.')">.</button>
      <button class="calc-btn eq" @click="equal">=</button>
      <button class="calc-btn op" @click="input('+')">+</button>
      <button class="calc-btn clear" @click="clear">C</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const display = ref('0');
let expr = '';

function input(v) {
  if (display.value === '0' && !'+-*/'.includes(v) && v !== '.') expr = '';
  expr += v;
  display.value = expr || '0';
}
function clear() { expr = ''; display.value = '0'; }
function equal() {
  try { expr = String(Function('"use strict";return (' + expr + ')')()); display.value = expr; }
  catch { display.value = 'Error'; }
}
</script>
