<template>
  <div ref="globeRef" class="globe-container"></div>

  <div class="info-text">🌐 探索工具集 · 点击卫星打开</div>

  <Transition name="popup">
    <div v-if="activeTool !== null" class="popup-backdrop" @click.self="closeTool">
      <div class="popup-card">
        <div class="popup-header">
          <span class="popup-header-icon">{{ activeTool.icon }}</span>
          <span class="popup-header-title">{{ activeTool.name }}</span>
          <button class="popup-close-btn" @click="closeTool">✕</button>
        </div>
        <div class="popup-body">
          <component :is="activeComponent" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, shallowRef, markRaw, onMounted, onUnmounted } from 'vue';
import { createGlobe } from './three-globe.js';
import { TOOLS, toolComponents } from './src/tools/index.js';

const globeRef = ref(null);
const activeIndex = ref(-1);
let globe = null;

const activeTool = computed(() =>
  activeIndex.value >= 0 ? TOOLS[activeIndex.value] : null
);
const activeComponent = computed(() =>
  activeIndex.value >= 0 ? toolComponents[TOOLS[activeIndex.value].id] : null
);

function openTool(index) {
  activeIndex.value = index;
}

function closeTool() {
  activeIndex.value = -1;
  if (globe) globe.controls.autoRotate = true;
}

onMounted(() => {
  if (globeRef.value) {
    globe = createGlobe(globeRef.value, TOOLS, openTool);
  }
});

onUnmounted(() => {
  if (globe) globe.dispose();
});
</script>

<style scoped>
.globe-container {
  position: fixed;
  inset: 0;
  z-index: 1;
}

.info-text {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.35);
  font-size: 14px;
  letter-spacing: 1px;
  pointer-events: none;
  z-index: 10;
  text-shadow: 0 0 20px rgba(0,0,0,0.8);
}

.popup-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.popup-card {
  width: min(92vw, 460px);
  max-height: 85vh;
  background: rgba(12,16,40,0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(79,195,247,0.15);
  border-radius: 20px;
  box-shadow: 0 0 40px rgba(0,0,0,0.6), 0 0 80px rgba(79,195,247,0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 24px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.popup-header-icon { font-size: 22px; line-height: 1; }

.popup-header-title {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.popup-close-btn {
  width: 32px; height: 32px;
  border: none;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.6);
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.popup-close-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

.popup-body {
  padding: 20px 24px 24px;
  overflow-y: auto;
  flex: 1;
}

.popup-body::-webkit-scrollbar { width: 4px; }
.popup-body::-webkit-scrollbar-track { background: transparent; }
.popup-body::-webkit-scrollbar-thumb { background: rgba(79,195,247,0.3); border-radius: 2px; }

/* Vue transition */
.popup-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.popup-leave-active { transition: all 0.25s ease; }
.popup-enter-from { opacity: 0; transform: scale(0.85); }
.popup-leave-to { opacity: 0; transform: scale(0.9); }

@media (max-width: 600px) {
  .popup-card { width: 96vw; max-height: 90vh; border-radius: 16px; }
  .popup-header { padding: 14px 16px 10px; }
  .popup-body { padding: 14px 16px 18px; }
  .info-text { font-size: 12px; bottom: 16px; }
}
</style>
