<template>
  <div class="tool-notes">
    <!-- 输入行：文本框 + 添加按钮 -->
    <div class="notes-input-row">
      <input v-model="inputText" type="text" placeholder="输入备忘内容..." @keydown.enter="addNote" />
      <button class="notes-add-btn" @click="addNote">添加</button>
    </div>
    <!-- 备忘录列表 -->
    <div class="notes-list">
      <div v-for="(note, i) in notes" :key="i" class="note-item">
        <span class="note-text">{{ note }}</span>
        <button class="note-del" @click="removeNote(i)">✕</button>
      </div>
      <div v-if="notes.length === 0" style="color:rgba(255,255,255,0.3);text-align:center;padding:20px;font-size:13px;">暂无备忘</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const KEY = 'earth_notes';          // localStorage 存储键名
const inputText = ref('');
// 从 localStorage 加载已保存的备忘
const notes = ref(JSON.parse(localStorage.getItem(KEY) || '[]'));

function save() { localStorage.setItem(KEY, JSON.stringify(notes.value)); }

// 添加备忘
function addNote() {
  const v = inputText.value.trim();
  if (!v) return;
  notes.value.push(v);
  save();
  inputText.value = '';
}

// 删除指定索引的备忘
function removeNote(i) {
  notes.value.splice(i, 1);
  save();
}
</script>
