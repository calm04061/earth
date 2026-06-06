<template>
  <div class="tool-toolbox">
    <!-- 3×3 工具箱按钮网格 -->
    <button v-for="(item, i) in items" :key="i" class="toolbox-item" @click="clickItem(i)">
      <span class="icon">{{ item.icon }}</span>
      <span class="name">{{ item.name }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 工具箱项目列表
const items = [
  { icon: '🔨', name: '锤子' }, { icon: '🔩', name: '螺母' }, { icon: '⚙️', name: '齿轮' },
  { icon: '🔗', name: '链接' }, { icon: '💡', name: '灯泡' }, { icon: '🔒', name: '锁' },
  { icon: '🔑', name: '钥匙' }, { icon: '📌', name: '图钉' }, { icon: '✂️', name: '剪刀' },
];

// 点击反馈（预留扩展）
function clickItem(i) {}
</script>
