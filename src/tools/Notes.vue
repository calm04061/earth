<template>
  <div class="tool-notes">
    <div class="notes-input-row">
      <input v-model="inputText" placeholder="写备忘..." @keydown.enter="saveNote" />
      <div class="notes-remind-row">
        <input type="datetime-local" v-model="remindTime" class="notes-datetime" />
        <button class="notes-add-btn" @click="saveNote">{{ editingId ? '保存' : remindTime ? '提醒' : '添加' }}</button>
      </div>
    </div>
    <div class="notes-list">
      <div v-for="(note, i) in sortedNotes" :key="note.id" class="note-item" :class="{ reminded: note.reminded, completed: note.done }">
        <input type="checkbox" class="note-checkbox" :checked="note.done" @change="toggleDone(note)" />
        <span class="note-text">{{ note.text }}</span>
        <div class="note-meta">
          <span v-if="note.remindAt && !note.reminded" class="note-remind-badge pending">
            ⏰ {{ formatTime(note.remindAt) }}
          </span>
          <span v-if="note.reminded" class="note-remind-badge done">已提醒</span>
        </div>
        <button class="note-edit-btn" @click="startEdit(i)" title="修改">✏️</button>
        <button class="note-del" @click="removeNote(i)">✕</button>
      </div>
      <div v-if="sortedNotes.length === 0" class="notes-empty">暂无备忘</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { dbGetAll, dbPut, dbDelete } from '../db.js';

const STORE = 'notes';
const inputText = ref('');
const remindTime = ref('');
const notes = ref([]);
const editingId = ref(null);

async function load() {
  notes.value = await dbGetAll(STORE);
}
function save() {
  for (const n of notes.value) dbPut(STORE, n);
}

const sortedNotes = computed(() =>
  [...notes.value].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.remindAt && !a.reminded && (!b.remindAt || b.reminded)) return -1;
    if (b.remindAt && !b.reminded && (!a.remindAt || a.reminded)) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  })
);

function formatTime(iso) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${h}:${min}`;
}

function startEdit(i) {
  const note = sortedNotes.value[i];
  inputText.value = note.text;
  remindTime.value = note.remindAt ? note.remindAt.slice(0, 16) : '';
  editingId.value = note.id;
}

async function saveNote() {
  const v = inputText.value.trim();
  if (!v) return;
  if (editingId.value) {
    const idx = notes.value.findIndex(n => n.id === editingId.value);
    if (idx !== -1) {
      notes.value[idx].text = v;
      notes.value[idx].remindAt = remindTime.value ? new Date(remindTime.value).toISOString() : null;
      await dbPut(STORE, notes.value[idx]);
    }
  } else {
    const note = {
      id: Date.now(),
      text: v,
      createdAt: new Date().toISOString(),
      remindAt: remindTime.value ? new Date(remindTime.value).toISOString() : null,
      reminded: false,
      done: false,
    };
    notes.value.unshift(note);
    await dbPut(STORE, note);
    if (note.remindAt) requestNotifyPermission();
  }
  inputText.value = '';
  remindTime.value = '';
  editingId.value = null;
}

async function toggleDone(note) {
  note.done = !note.done;
  await dbPut(STORE, note);
}

async function removeNote(i) {
  const note = sortedNotes.value[i];
  const idx = notes.value.findIndex(n => n.id === note.id);
  if (idx !== -1) {
    notes.value.splice(idx, 1);
    await dbDelete(STORE, note.id);
  }
}

function requestNotifyPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function checkReminders() {
  const now = Date.now();
  let changed = false;
  for (const note of notes.value) {
    if (note.remindAt && !note.reminded) {
      if (now >= new Date(note.remindAt).getTime()) {
        note.reminded = true;
        changed = true;
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('备忘提醒', { body: note.text, icon: '📝' });
        }
      }
    }
  }
  if (changed) save();
}

let timer;
onMounted(async () => {
  await load();
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  timer = setInterval(checkReminders, 5000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>
