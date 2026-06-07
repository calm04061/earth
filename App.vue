<template>
  <!-- 3D 地球容器，由 Three.js 渲染 -->
  <div ref="globeRef" class="globe-container"></div>

  <!-- 底部提示文字 -->
  <div class="info-text">{{ onDevPlanet ? '🛠️ 开发者星球 · 点击卫星打开工具' : '🌐 探索工具集 · 点击卫星打开' }}</div>

  <!-- 弹出面板：点击卫星时显示，带动画过渡 -->
  <Transition name="popup">
    <div v-if="activeTool !== null" class="popup-backdrop" @click.self="closeTool">
      <div class="popup-card">
        <!-- 面板头部：图标 + 标题 + 关闭/返回按钮 -->
        <div class="popup-header">
          <span class="popup-header-icon">{{ activeTool.icon }}</span>
          <span class="popup-header-title">{{ activeTool.name }}</span>
           <button v-if="onDevPlanet" class="popup-back-btn" @click="returnToEarth">← 返回</button>
          <button class="popup-close-btn" @click="closeTool">✕</button>
        </div>
        <!-- 面板主体：动态渲染对应的工具组件 -->
        <div class="popup-body">
          <component :is="activeComponent" v-bind="activeComponentProps" />
        </div>
      </div>
    </div>
  </Transition>

  <!-- 跃迁特效遮罩 -->
  <Transition name="warp">
    <div v-if="warpActive" class="warp-overlay">
      <div class="warp-ring"></div>
      <div class="warp-text">{{ warpText }}</div>
    </div>
  </Transition>
</template>

<script setup>
// Vue 响应式 API 及生命周期钩子
import { ref, computed, onMounted, onUnmounted } from 'vue';
// Three.js 地球创建函数
import { createGlobe } from './three-globe.js';
// 工具列表及各工具对应的 Vue 组件
import { TOOLS, toolComponents } from './src/tools/index.js';
import { getConfig as loadPlanetConfig, saveConfig as savePlanetConfig, resetConfig } from './src/planetConfig.js';

// 地球容器的模板引用
const globeRef = ref(null);
// 当前打开的工具下标（-1 表示关闭）
const activeIndex = ref(-1);
// 是否在开发者星球上
const onDevPlanet = ref(false);
// 跃迁特效
const warpActive = ref(false);
const warpText = ref('');
// Three.js 场景实例引用（非响应式）
let globe = null;

// 根据下标获取当前打开的工具定义
const activeTool = computed(() =>
  activeIndex.value >= 0 ? TOOLS[activeIndex.value] : null
);
// 根据下标获取当前打开的工具组件
const activeComponent = computed(() =>
  activeIndex.value >= 0 ? toolComponents[TOOLS[activeIndex.value].id] : null
);
// 给子组件传递属性
const activeComponentProps = computed(() => {
  const tool = activeTool.value;
  if (tool && tool.id === 'planetmgr') return {
    modelValue: planetConfigs.value,
    'onUpdate:modelValue': onSavePlanetConfig,
  };
  return {};
});

// 打开工具：点击卫星时触发
function openTool(index) {
  activeIndex.value = index;
}

// 关闭工具：点击遮罩或关闭按钮时触发
function closeTool() {
  if (onDevPlanet.value) { returnToEarth(); return; }
  activeIndex.value = -1;
  if (globe) globe.controls.autoRotate = true;
}

// 跃迁到开发者星球
function portalClick() {
  warpActive.value = true;
  warpText.value = '🚀 星际跃迁中...';
  setTimeout(() => { warpText.value = '🛸 穿越虫洞...'; }, 500);
  globe.jumpTo(() => {
    onDevPlanet.value = true;
    warpActive.value = false;
  }, false);
}

// 返回地球
function returnToEarth() {
  activeIndex.value = -1;
  warpActive.value = true;
  warpText.value = '🛸 返回地球...';
  setTimeout(() => { warpText.value = '🌍 即将抵达...'; }, 600);
  globe.jumpTo(() => {
    onDevPlanet.value = false;
    warpActive.value = false;
    if (globe) globe.controls.autoRotate = true;
  }, true);
}

// 当前星球配置
const planetConfigs = ref(loadPlanetConfig());

// 重新创建场景（当配置变化时）
function rebuildGlobe() {
  if (globe) { globe.dispose(); globe = null; }
  if (globeRef.value) {
    globe = createGlobe(globeRef.value, planetConfigs.value, TOOLS, openTool, portalClick);
  }
}

// 保存配置
function onSavePlanetConfig(newConfig) {
  savePlanetConfig(newConfig);
  planetConfigs.value = newConfig;
  rebuildGlobe();
}

// 重置配置
function onResetPlanetConfig() {
  const def = resetConfig();
  planetConfigs.value = def;
  rebuildGlobe();
}

// 组件挂载后创建 3D 地球场景
onMounted(() => {
  rebuildGlobe();
});

// 组件卸载时销毁地球场景，释放 GPU 资源
onUnmounted(() => {
  if (globe) globe.dispose();
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
  color: rgba(255,255,255,0.35);
  font-size: 14px;
  letter-spacing: 1px;
  pointer-events: none;
  z-index: 10;
  text-shadow: 0 0 20px rgba(0,0,0,0.8);
}

/* 弹出面板遮罩：覆盖全屏，毛玻璃背景 */
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

/* 弹出面板卡片：半透明深色主题，圆角 + 发光边框 */
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

/* 面板头部：图标 + 标题 + 关闭按钮横向布局，底部有分割线 */
.popup-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 24px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
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

/* 关闭按钮：白色圆形，带悬停效果 */
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

/* 面板主体：可滚动，内部填充 */
.popup-body {
  padding: 20px 24px 24px;
  overflow-y: auto;
  flex: 1;
}

/* 面板主体滚动条样式 */
.popup-body::-webkit-scrollbar { width: 4px; }
.popup-body::-webkit-scrollbar-track { background: transparent; }
.popup-body::-webkit-scrollbar-thumb { background: rgba(79,195,247,0.3); border-radius: 2px; }

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

/* 跃迁特效遮罩 */
.warp-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.85);
  pointer-events: none;
}
.warp-ring {
  width: 120px;
  height: 120px;
  border: 2px solid rgba(0,255,200,0.4);
  border-radius: 50%;
  animation: warpPulse 0.8s ease-in-out infinite alternate;
  box-shadow: 0 0 40px rgba(0,255,200,0.15), inset 0 0 40px rgba(0,255,200,0.05);
}
@keyframes warpPulse {
  from { transform: scale(0.8); opacity: 0.3; }
  to { transform: scale(1.2); opacity: 0.8; }
}
.warp-text {
  margin-top: 24px;
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 3px;
  color: rgba(255,255,255,0.7);
  text-shadow: 0 0 20px rgba(0,255,200,0.2);
}

/* Warp过渡动画 */
.warp-enter-active { transition: all 0.5s ease; }
.warp-leave-active { transition: all 0.4s ease; }
.warp-enter-from { opacity: 0; }
.warp-leave-to { opacity: 0; }

/* Vue Transition 动画：弹入弹性曲线，淡出平滑 */
.popup-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.popup-leave-active { transition: all 0.25s ease; }
.popup-enter-from { opacity: 0; transform: scale(0.85); }
.popup-leave-to { opacity: 0; transform: scale(0.9); }

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
