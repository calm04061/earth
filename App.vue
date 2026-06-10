<template>
  <!-- 3D 地球容器，由 Three.js 渲染 -->
  <div ref="globeRef" class="globe-container"></div>

  <!-- 底部提示文字 -->
  <div class="info-text">🌐 点击卫星打开工具 · 🚀 点击传送门星际旅行</div>

  <!-- 弹出面板：点击卫星时显示，带动画过渡 -->
  <Transition name="popup">
    <div v-if="activeTool !== null" class="popup-backdrop" @click.self="closeTool">
      <div class="popup-laser-beam"></div>
      <div class="popup-card" :class="{ maximized }">
        <!-- HUD 边角装饰 -->
        <div class="popup-corner tl"></div>
        <div class="popup-corner tr"></div>
        <div class="popup-corner bl"></div>
        <div class="popup-corner br"></div>
        <div class="popup-scanline"></div>
        <!-- 面板头部：图标 + 标题 + 关闭按钮 -->
        <div class="popup-header">
          <span class="popup-header-icon">{{ activeTool.icon }}</span>
          <span class="popup-header-title">{{ activeTool.name }}</span>
          <button class="popup-max-btn" @click="maximized = !maximized">{{ maximized ? '⤡' : '⛶' }}</button>
          <button class="popup-close-btn" @click="closeTool">✕</button>
        </div>
        <!-- 面板主体：动态渲染对应的工具组件 -->
        <div class="popup-body">
          <component :is="activeComponent" v-bind="activeComponentProps" />
        </div>
      </div>
    </div>
  </Transition>

  <!-- 星球选择器：多个星球时选择目标 -->
  <Transition name="popup">
    <div v-if="showPlanetPicker" class="popup-backdrop" @click.self="showPlanetPicker = false">
      <div class="picker-card">
        <div class="picker-header">
          <span class="picker-title">🚀 选择目的地</span>
        </div>
        <div class="picker-list">
          <div v-for="p in planetOptions" :key="p.id" class="picker-item" @click="jumpToPlanet(p.id)">
            <span class="picker-item-icon">{{ p.id === 'earth' ? '🌍' : '🪐' }}</span>
            <span class="picker-item-name">{{ p.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 跃迁特效遮罩：超光速航行 -->
  <Transition name="warp">
    <div v-if="warpActive" ref="warpContainer" class="warp-overlay">
      <div class="warp-text">{{ warpText }}</div>
    </div>
  </Transition>

  <!-- 提示通知 -->
  <Transition name="toast">
    <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.msg }}</div>
  </Transition>
</template>

<script setup>
// Vue 响应式 API 及生命周期钩子
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { createGlobe } from './three-globe.js';
import { TOOLS, toolComponents } from './src/tools/index.js';
import { getConfig as loadPlanetConfig, saveConfig as savePlanetConfig, resetConfig, getLastPlanet, saveLastPlanet } from './src/planetConfig.js';
import { createHyperspace } from './src/globe/hyperspace.js';

const globeRef = ref(null);
const activeIndex = ref(-1);
const maximized = ref(false);
const showPlanetPicker = ref(false);
const planetOptions = ref([]);
const warpActive = ref(false);
const warpText = ref('');
const warpContainer = ref(null);
let warpInstance = null;
let globe = null;
let toastTimer = null;
const toast = ref({ show: false, msg: '', type: 'success' });
function showToast(msg, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer);
  toast.value = { show: true, msg, type };
  toastTimer = setTimeout(() => { toast.value.show = false; }, 2000);
}

const activeTool = computed(() =>
  activeIndex.value >= 0 ? TOOLS[activeIndex.value] : null
);
const activeComponent = computed(() =>
  activeIndex.value >= 0 ? toolComponents[TOOLS[activeIndex.value].id] : null
);
const activeComponentProps = computed(() => {
  const tool = activeTool.value;
  if (tool && tool.id === 'planetmgr') return {
    modelValue: planetConfigs.value,
    'onUpdate:modelValue': onSavePlanetConfig,
  };
  return {};
});

function openTool(index) {
  activeIndex.value = index;
}

function closeTool() {
  activeIndex.value = -1;
  if (globe) globe.controls.autoRotate = true;
}

const planetConfigs = ref([]);

function jumpToPlanet(targetId) {
  showPlanetPicker.value = false;
  activeIndex.value = -1;
  saveLastPlanet(targetId);
  warpActive.value = true;
  warpText.value = '🚀 超光速航行中…';
  setTimeout(() => { warpText.value = '🌀 曲速引擎全开…'; }, 500);
  globe.jumpTo(targetId, () => {
    warpActive.value = false;
    if (globe) globe.controls.autoRotate = true;
  });
}

function portalClick(fromPlanetId) {
  const others = planetConfigs.value.filter(p => p.id !== fromPlanetId);
  if (others.length === 0) return;
  if (others.length === 1) {
    jumpToPlanet(others[0].id);
  } else {
    planetOptions.value = others;
    showPlanetPicker.value = true;
  }
}

// 超光速航行特效生命周期
watch(warpActive, (v) => {
  if (v && warpContainer.value) {
    warpInstance = createHyperspace(warpContainer.value);
  } else if (!v && warpInstance) {
    warpInstance.dispose();
    warpInstance = null;
  }
});

// 重新创建场景（当配置变化时）
function rebuildGlobe(currentPlanet) {
  if (globe) { globe.dispose(); globe = null; }
  if (globeRef.value) {
    globe = createGlobe(globeRef.value, planetConfigs.value, TOOLS, openTool, portalClick);
    if (currentPlanet && currentPlanet !== 'earth') {
      globe.jumpTo(currentPlanet);
    }
  }
}

// 保存配置
async function onSavePlanetConfig(newConfig) {
  const currentId = globe ? globe.currentPlanetId() : 'earth';
  try {
    await savePlanetConfig(newConfig);
    planetConfigs.value = newConfig;
    rebuildGlobe(currentId);
    showToast('✅ 配置已保存');
  } catch (e) {
    showToast('❌ 保存失败: ' + (e.message || ''), 'error');
  }
}

// 重置配置
async function onResetPlanetConfig() {
  const currentId = globe ? globe.currentPlanetId() : 'earth';
  try {
    const def = await resetConfig();
    planetConfigs.value = def;
    rebuildGlobe(currentId);
    showToast('✅ 已恢复默认配置');
  } catch (e) {
    showToast('❌ 重置失败: ' + (e.message || ''), 'error');
  }
}

// 组件挂载后创建 3D 地球场景
onMounted(async () => {
  planetConfigs.value = await loadPlanetConfig();
  const saved = await getLastPlanet();
  rebuildGlobe(saved && saved !== 'earth' ? saved : undefined);
});

// 组件卸载时销毁地球场景，释放 GPU 资源
onUnmounted(() => {
  if (globe) globe.dispose();
  if (warpInstance) { warpInstance.dispose(); warpInstance = null; }
});
</script>

<style scoped>
/* 地球容器：全屏固定，作为 3D 画布的宿主 */
.globe-container {
  position: fixed;
  inset: 0;
  z-index: 1;
}

/* 底部提示文字：居中、半透明、不可交互 */
.info-text {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(79,195,247,0.4);
  font-size: 13px;
  letter-spacing: 2px;
  font-weight: 300;
  pointer-events: none;
  z-index: 10;
  text-shadow: 0 0 20px rgba(0,0,0,0.8), 0 0 40px rgba(79,195,247,0.08);
  animation: infoPulse 3s ease-in-out infinite;
}

@keyframes infoPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 弹出面板遮罩：覆盖全屏，毛玻璃背景 */
.popup-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0,0,0,0.25);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* 弹出面板卡片：半透明深色主题，圆角 + 发光边框 */
.popup-card {
  width: min(92vw, 460px);
  max-height: 85vh;
  background: rgba(12,16,40,0.35);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(79,195,247,0.2);
  border-radius: 20px;
  box-shadow: 0 0 40px rgba(0,0,0,0.6), 0 0 60px rgba(79,195,247,0.12), 0 0 120px rgba(79,195,247,0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, max-height 0.3s ease, border-radius 0.3s ease;
  animation: popupGlow 3s ease-in-out infinite;
}

@keyframes popupGlow {
  0%, 100% { box-shadow: 0 0 40px rgba(0,0,0,0.6), 0 0 40px rgba(79,195,247,0.08), 0 0 100px rgba(79,195,247,0.04); }
  50% { box-shadow: 0 0 40px rgba(0,0,0,0.6), 0 0 70px rgba(79,195,247,0.15), 0 0 140px rgba(79,195,247,0.07); }
}

.popup-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 1px;
  background: linear-gradient(135deg, transparent 30%, rgba(79,195,247,0.12) 50%, transparent 70%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* HUD corner brackets */
.popup-corner {
  position: absolute;
  width: 16px; height: 16px;
  border-color: rgba(79,195,247,0.45);
  border-style: solid;
  pointer-events: none;
  z-index: 3;
}
.popup-corner.tl { top: 10px; left: 10px; border-width: 2px 0 0 2px; border-radius: 4px 0 0 0; }
.popup-corner.tr { top: 10px; right: 10px; border-width: 2px 2px 0 0; border-radius: 0 4px 0 0; }
.popup-corner.bl { bottom: 10px; left: 10px; border-width: 0 0 2px 2px; border-radius: 0 0 0 4px; }
.popup-corner.br { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; border-radius: 0 0 4px 0; }

/* Scanline overlay */
.popup-scanline {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
  border-radius: 20px;
  opacity: 0.035;
}
.popup-scanline::before {
  content: '';
  position: absolute;
  width: 100%; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(79,195,247,0.6), transparent);
  animation: popupScanline 3s linear infinite;
}
@keyframes popupScanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
.popup-card.maximized {
  width: min(96vw, 900px);
  max-height: 94vh;
  border-radius: 12px;
  box-shadow: 0 0 40px rgba(0,0,0,0.6), 0 0 60px rgba(79,195,247,0.15), 0 0 120px rgba(79,195,247,0.08);
}

/* 面板头部：图标 + 标题 + 关闭按钮横向布局，底部有分割线 */
.popup-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 24px 14px;
  border-bottom: 1px solid rgba(79,195,247,0.08);
  background: linear-gradient(180deg, rgba(79,195,247,0.03) 0%, transparent 100%);
}

/* 头部图标 */
.popup-header-icon { font-size: 22px; line-height: 1; }

/* 头部标题：占据剩余空间，加粗 */
.popup-header-title {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 最大化按钮 */
.popup-max-btn {
  width: 32px; height: 32px;
  border: 1px solid rgba(79,195,247,0.15);
  background: rgba(79,195,247,0.06);
  color: rgba(79,195,247,0.6);
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 6px rgba(79,195,247,0.03);
}
.popup-max-btn:hover {
  background: rgba(79,195,247,0.15);
  border-color: rgba(79,195,247,0.5);
  color: #fff;
  box-shadow: 0 0 16px rgba(79,195,247,0.15);
  transform: scale(1.1);
}

/* 关闭按钮：白色圆形，带悬停效果 */
.popup-close-btn {
  width: 32px; height: 32px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.5);
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.popup-close-btn:hover {
  background: rgba(255,82,82,0.15);
  border-color: rgba(255,82,82,0.4);
  color: #FF5252;
  box-shadow: 0 0 16px rgba(255,82,82,0.12);
  transform: scale(1.1);
}

/* 面板主体：可滚动，内部填充 */
.popup-body {
  padding: 20px 24px 24px;
  overflow-y: auto;
  flex: 1;
}

/* 面板主体滚动条样式 */
.popup-body::-webkit-scrollbar { width: 4px; }
.popup-body::-webkit-scrollbar-track { background: transparent; }
.popup-body::-webkit-scrollbar-thumb { background: rgba(79,195,247,0.3); border-radius: 2px; box-shadow: 0 0 8px rgba(79,195,247,0.1); }

/* 返回按钮（开发者星球） */
.popup-back-btn {
  padding: 4px 14px;
  border: 1px solid rgba(0,255,136,0.3);
  border-radius: 8px;
  background: rgba(0,255,136,0.1);
  color: #00ff88;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  margin-right: auto;
}
.popup-back-btn:hover {
  background: rgba(0,255,136,0.2);
  border-color: rgba(0,255,136,0.6);
}

/* 跃迁特效遮罩：超光速航行 */
.warp-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,10,0.7);
  pointer-events: none;
}
.warp-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(79,195,247,0.015) 2px, rgba(79,195,247,0.015) 4px);
  pointer-events: none;
}
.warp-text {
  z-index: 1;
  font-size: 22px;
  font-weight: 300;
  letter-spacing: 6px;
  color: rgba(100,220,255,0.8);
  text-shadow: 0 0 30px rgba(0,200,255,0.3), 0 0 60px rgba(0,200,255,0.1);
  margin-top: 40vh;
  animation: dataPulse 1.5s ease-in-out infinite;
}

/* 星球选择器 */
.picker-card {
  width: min(80vw, 360px);
  background: rgba(12,16,40,0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(79,195,247,0.2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(0,0,0,0.6), 0 0 60px rgba(79,195,247,0.06);
  animation: popupGlow 3s ease-in-out infinite;
}
.picker-header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}
.picker-list {
  padding: 8px;
}
.picker-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.picker-item:hover {
  background: rgba(79,195,247,0.12);
  box-shadow: inset 0 0 20px rgba(79,195,247,0.05);
}
.picker-item-icon {
  font-size: 20px;
}
.picker-item-name {
  font-size: 15px;
  font-weight: 500;
}

/* Warp过渡动画 */
.warp-enter-active { transition: all 0.5s ease; }
.warp-leave-active { transition: all 0.4s ease; }
.warp-enter-from { opacity: 0; }
.warp-leave-to { opacity: 0; }

/* 提示通知 */
.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 300;
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  pointer-events: none;
  white-space: nowrap;
}
.toast.success {
  background: rgba(0,230,118,0.15);
  border: 1px solid rgba(0,230,118,0.3);
  color: #00E676;
}
.toast.error {
  background: rgba(255,82,82,0.15);
  border: 1px solid rgba(255,82,82,0.3);
  color: #FF5252;
}
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(12px); }
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }

/* ── 卫星激光投射效果 ── */

/* 激光束：从顶部落下的细长光柱 */
.popup-laser-beam {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 3px;
  height: 0;
  z-index: 101;
  background: linear-gradient(180deg,
    rgba(79,195,247,0) 0%,
    rgba(79,195,247,0.9) 30%,
    rgba(79,195,247,0.6) 60%,
    rgba(79,195,247,0) 100%
  );
  box-shadow:
    0 0 8px rgba(79,195,247,0.6),
    0 0 24px rgba(79,195,247,0.3),
    0 0 48px rgba(79,195,247,0.1);
  pointer-events: none;
  opacity: 0;
}

.popup-enter-active .popup-laser-beam {
  animation: laserShoot 0.55s ease-out forwards;
}

@keyframes laserShoot {
  0% {
    height: 0;
    opacity: 1;
  }
  40% {
    height: 60vh;
    opacity: 1;
  }
  70% {
    height: 100vh;
    opacity: 0.6;
  }
  100% {
    height: 100vh;
    opacity: 0;
  }
}

/* 弹出面板初始状态：完全不可见 */
.popup-enter-from .popup-card {
  opacity: 0;
  transform: scale(0.92);
  clip-path: inset(0 0 100% 0);
}

/* 弹出面板进入动画：从上到下扫描展开 + 发光扩散 */
.popup-enter-active .popup-card {
  animation: laserReveal 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes laserReveal {
  0% {
    opacity: 0;
    transform: scale(0.92);
    clip-path: inset(0 0 100% 0);
    box-shadow: 0 0 0 rgba(0,0,0,0), 0 0 0 rgba(79,195,247,0);
  }
  20% {
    opacity: 0.5;
    transform: scale(0.95);
    clip-path: inset(0 0 80% 0);
    box-shadow:
      0 0 80px rgba(0,0,0,0.3),
      0 0 60px rgba(79,195,247,0.2),
      0 0 120px rgba(79,195,247,0.1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.98);
    clip-path: inset(0 0 30% 0);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    clip-path: inset(0);
    box-shadow:
      0 0 40px rgba(0,0,0,0.6),
      0 0 60px rgba(79,195,247,0.12),
      0 0 120px rgba(79,195,247,0.06);
  }
}

/* 弹出面板退出 */
.popup-leave-active .popup-card {
  transition: all 0.2s ease;
}
.popup-leave-to .popup-card {
  opacity: 0;
  transform: scale(0.95) translateY(-5px);
}

/* 遮罩淡入/淡出 */
.popup-enter-active { transition: background 0.3s ease; }
.popup-enter-from { background: rgba(0,0,0,0); }
.popup-leave-active { transition: background 0.2s ease; }
.popup-leave-to { background: rgba(0,0,0,0); }

/* 窄屏幕适配：手机端 */
@media (max-width: 600px) {
  .popup-card {
    width: 96vw;
    max-height: 90vh;
    max-height: calc(90vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
    border-radius: 16px;
    margin-top: env(safe-area-inset-top, 0px);
    margin-bottom: env(safe-area-inset-bottom, 0px);
  }
  .popup-card.maximized {
    width: 100vw;
    max-height: 100vh;
    max-height: calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
    border-radius: 0;
    margin: 0;
  }
  .popup-header { padding: 14px 16px 10px; }
  .popup-body { padding: 14px 16px 18px; }
  .info-text { font-size: 12px; bottom: 16px; }
}

/* 更小屏幕适配：小屏手机 */
@media (max-width: 400px) {
  .popup-card { width: 100vw; border-radius: 12px; max-height: 92vh; }
  .popup-header { padding: 12px 12px 8px; gap: 8px; }
  .popup-header-icon { font-size: 18px; }
  .popup-header-title { font-size: 15px; }
  .popup-close-btn { width: 28px; height: 28px; font-size: 14px; }
  .popup-body { padding: 10px 12px 14px; }
  .info-text { font-size: 11px; bottom: 12px; }
}
</style>
