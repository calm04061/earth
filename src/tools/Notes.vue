<template>
  <div class="tool-notes">
    <div class="notes-input-row">
      <input v-model="inputText" placeholder="写备忘..." @keydown.enter="addNote" />
      <div class="notes-remind-row">
        <input type="datetime-local" v-model="remindTime" class="notes-datetime" />
        <button class="notes-add-btn" @click="addNote">{{ remindTime ? '提醒' : '添加' }}</button>
      </div>
    </div>
    <div class="notes-list">
      <div v-for="(note, i) in sortedNotes" :key="note.id" class="note-item" :class="{ reminded: note.reminded }">
        <span class="note-text">{{ note.text }}</span>
        <div class="note-meta">
          <span v-if="note.remindAt && !note.reminded" class="note-remind-badge pending">
            ⏰ {{ formatTime(note.remindAt) }}
          </span>
          <span v-if="note.reminded" class="note-remind-badge done">已提醒</span>
        </div>
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

async function load() {
  notes.value = await dbGetAll(STORE);
}
function save() {
  for (const n of notes.value) dbPut(STORE, n);
}

const sortedNotes = computed(() =>
  [...notes.value].sort((a, b) => {
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

async function addNote() {
  const v = inputText.value.trim();
  if (!v) return;
  const note = {
    id: Date.now(),
    text: v,
    createdAt: new Date().toISOString(),
    remindAt: remindTime.value ? new Date(remindTime.value).toISOString() : null,
    reminded: false,
  };
  notes.value.unshift(note);
  await dbPut(STORE, note);
  inputText.value = '';
  remindTime.value = '';
  if (note.remindAt) requestNotifyPermission();
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
