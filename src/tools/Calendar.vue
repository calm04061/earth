<template>
  <div class="tool-calendar">
    <div class="calendar-header">
      <button class="calendar-nav" @click="prevMonth">‹</button>
      <div class="calendar-title">{{ year }}年{{ month + 1 }}月</div>
      <button class="calendar-nav" @click="nextMonth">›</button>
    </div>
    <div class="calendar-weekdays">
      <div v-for="w in weeks" :key="w" class="calendar-weekday">{{ w }}</div>
    </div>
    <div class="calendar-days">
      <button v-for="(d, i) in days" :key="i"
        :class="['calendar-day', { 'other-month': d.other, today: d.today, 'has-reminder': d.hasReminder, selected: selectedDate === d.fullDate }]"
        @click="selectDate(d)">
        {{ d.num }}
      </button>
    </div>
    <div v-if="dayNotes.length" class="calendar-detail">
      <div class="calendar-detail-title">{{ formatDetailDate(selectedDate) }}</div>
      <div v-for="n in dayNotes" :key="n.id" class="calendar-detail-item">
        <span>📝 {{ n.text }}</span>
        <span v-if="n.remindAt" class="calendar-detail-time">⏰ {{ formatTime(n.remindAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { dbGetAll } from '../db.js';

const now = new Date();
const year = ref(now.getFullYear());
const month = ref(now.getMonth());
const weeks = ['日', '一', '二', '三', '四', '五', '六'];
const selectedDate = ref('');
const allNotes = ref([]);

onMounted(async () => { allNotes.value = await dbGetAll('notes'); });

function formatTime(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDetailDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function dateKey(fullDate) {
  return fullDate ? fullDate.split('T')[0] : '';
}

const days = computed(() => {
  const first = new Date(year.value, month.value, 1).getDay();
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate();
  const prevDays = new Date(year.value, month.value, 0).getDate();
  const todayStr = dateKey(now.toISOString());
  const notes = getNotes();

  // 构建提醒日期映射 { '2026-06-15': true }
  const reminderMap = {};
  for (const n of allNotes.value) {
    if (n.remindAt) {
      const k = dateKey(n.remindAt);
      if (k) reminderMap[k] = true;
    }
  }

  const result = [];
  for (let i = first - 1; i >= 0; i--) {
    const d = new Date(year.value, month.value - 1, prevDays - i);
    result.push({ num: prevDays - i, other: true, today: false, hasReminder: !!reminderMap[dateKey(d.toISOString())], fullDate: d.toISOString() });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year.value, month.value, d);
    const key = dateKey(date.toISOString());
    const isToday = key === todayStr;
    result.push({ num: d, other: false, today: isToday, hasReminder: !!reminderMap[key], fullDate: date.toISOString() });
    if (isToday && !selectedDate.value) selectedDate.value = date.toISOString();
  }
  const rem = result.length % 7;
  if (rem) for (let i = 1; i <= 7 - rem; i++) {
    const date = new Date(year.value, month.value + 1, i);
    result.push({ num: i, other: true, today: false, hasReminder: !!reminderMap[dateKey(date.toISOString())], fullDate: date.toISOString() });
  }
  return result;
});

const dayNotes = computed(() => {
  if (!selectedDate.value) return [];
  const key = dateKey(selectedDate.value);
  return getNotes().filter(n => n.remindAt && dateKey(n.remindAt) === key);
});

function selectDate(d) {
  selectedDate.value = d.fullDate;
}

function prevMonth() {
  month.value--;
  if (month.value < 0) { month.value = 11; year.value--; }
  selectedDate.value = '';
}
function nextMonth() {
  month.value++;
  if (month.value > 11) { month.value = 0; year.value++; }
  selectedDate.value = '';
}
</script>
