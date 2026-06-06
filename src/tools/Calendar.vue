<template>
  <div class="tool-calendar">
    <!-- 月份导航 -->
    <div class="calendar-header">
      <button class="calendar-nav" @click="prevMonth">‹</button>
      <div class="calendar-title">{{ year }}年{{ month + 1 }}月</div>
      <button class="calendar-nav" @click="nextMonth">›</button>
    </div>
    <!-- 星期行 -->
    <div class="calendar-weekdays">
      <div v-for="w in weeks" :key="w" class="calendar-weekday">{{ w }}</div>
    </div>
    <!-- 日期网格 -->
    <div class="calendar-days">
      <button v-for="(d, i) in days" :key="i"
        :class="['calendar-day', { 'other-month': d.other, today: d.today }]">
        {{ d.num }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const now = new Date();
const year = ref(now.getFullYear());
const month = ref(now.getMonth());
const weeks = ['日', '一', '二', '三', '四', '五', '六'];

// 计算当前月份的所有日期的网格数据（包括前后月份的占位）
const days = computed(() => {
  const first = new Date(year.value, month.value, 1).getDay();  // 当月1号星期几
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate(); // 当月天数
  const prevDays = new Date(year.value, month.value, 0).getDate(); // 上月天数
  const today = now.getFullYear() === year.value && now.getMonth() === month.value ? now.getDate() : -1;
  const result = [];
  // 上月补位（填充第一行空白）
  for (let i = first - 1; i >= 0; i--) result.push({ num: prevDays - i, other: true, today: false });
  // 当月日期
  for (let d = 1; d <= daysInMonth; d++) result.push({ num: d, other: false, today: d === today });
  // 下月补位以填满最后一行
  const rem = result.length % 7;
  if (rem) for (let i = 1; i <= 7 - rem; i++) result.push({ num: i, other: true, today: false });
  return result;
});

function prevMonth() { month.value--; if (month.value < 0) { month.value = 11; year.value--; } }
function nextMonth() { month.value++; if (month.value > 11) { month.value = 0; year.value++; } }
</script>
