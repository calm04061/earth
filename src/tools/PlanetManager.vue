<!-- 星球管理工具 — 增删改星球配置，分配工具到各星球 -->
<template>
  <div class="tool-planet-mgr">
    <!-- 星球标签页切换 + 添加星球按钮 -->
    <div class="pm-planet-tabs">
      <button v-for="p in planets" :key="p.id"
        :class="['pm-tab', { active: activeId === p.id }]"
        @click="select(p.id)">{{ p.name }}</button>
      <button class="pm-tab pm-add" @click="addPlanet">+</button>
    </div>

    <!-- 选中星球的编辑表单 -->
    <div v-if="active" class="pm-form">
      <div class="pm-field">
        <label>名称</label>
        <input v-model="active.name" placeholder="星球名称" />
      </div>
      <div class="pm-field">
        <label>贴图</label>
        <div class="pm-texture-row">
          <input v-model="active.texture" placeholder="texture.jpg" />
          <input type="file" accept="image/*" @change="onTextureFile" style="display:none" ref="texInput" />
          <button @click="$refs.texInput.click()">上传</button>
          <button v-if="active.texture" @click="active.texture = ''">清除</button>
        </div>
      </div>
      <div class="pm-field">
        <label>颜色</label>
        <input type="color" v-model="active.color" />
      </div>
      <div class="pm-field">
        <label>半径</label>
        <input type="range" min="0.3" max="2.5" step="0.05" v-model.number="active.radius" />
        <span class="pm-val">{{ active.radius }}</span>
      </div>
      <div class="pm-field">
        <label>轨道半径 (0=中心)</label>
        <input type="range" min="0" max="8" step="0.1" v-model.number="active.orbitRadius" />
        <span class="pm-val">{{ active.orbitRadius }}</span>
      </div>
      <div class="pm-field" v-if="active.orbitRadius > 0">
        <label>轨道速度</label>
        <input type="range" min="0.005" max="0.1" step="0.005" v-model.number="active.orbitSpeed" />
        <span class="pm-val">{{ active.orbitSpeed }}</span>
      </div>
      <div class="pm-field" v-if="active.orbitRadius > 0">
        <label>轨道倾斜</label>
        <input type="range" min="-1.57" max="1.57" step="0.05" v-model.number="active.orbitInclination" />
        <span class="pm-val">{{ (active.orbitInclination || 0).toFixed(2) }}</span>
      </div>
      <div class="pm-field">
        <label>线框颜色</label>
        <input type="color" v-model="active.wireframeColor" />
      </div>

      <div class="pm-field pm-ring-toggle">
        <label>大气层</label>
        <label class="pm-switch">
          <input type="checkbox" v-model="active.atmosphere" />
          <span class="pm-slider"></span>
        </label>
      </div>
      <div class="pm-field pm-ring-toggle">
        <label>星环</label>
        <label class="pm-switch">
          <input type="checkbox" v-model="active.ringEnabled" />
          <span class="pm-slider"></span>
        </label>
      </div>
      <template v-if="active.ringEnabled">
        <div class="pm-field">
          <label>环颜色</label>
          <input type="color" v-model="active.ringColor" />
        </div>
        <div class="pm-field">
          <label>环大小</label>
          <input type="range" min="1.2" max="3.0" step="0.05" v-model.number="active.ringSize" />
          <span class="pm-val">{{ active.ringSize || 1.8 }}</span>
        </div>
        <div class="pm-field">
          <label>环倾斜</label>
          <input type="range" min="0" max="1.2" step="0.05" v-model.number="active.ringTilt" />
          <span class="pm-val">{{ (active.ringTilt || 0).toFixed(2) }}</span>
        </div>
      </template>

      <!-- 工具分配：勾选该星球上可用的工具 -->
      <div class="pm-field">
        <label>分配工具</label>
        <div class="pm-tools-grid">
          <label v-for="tool in allTools" :key="tool.id" class="pm-tool-item">
            <input type="checkbox" :checked="active.tools.includes(tool.id)"
              @change="toggleTool(tool.id)" :disabled="tool.permanent" />
            <span>{{ tool.icon }} {{ tool.name }}</span>
          </label>
        </div>
      </div>

      <div class="pm-actions">
        <button class="pm-save" @click="save">保存</button>
        <button class="pm-delete" @click="deletePlanet" :disabled="planets.length <= 1">删除星球</button>
        <button class="pm-reset" @click="resetAll">重置默认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { TOOLS, toolComponents } from './index.js';
import { DEFAULT_PLANETS, generateId } from '../planetConfig.js';

const props = defineProps({
  modelValue: { type: Array, required: true },
});
const emit = defineEmits(['update:modelValue']);

// 深拷贝当前配置作为本地编辑副本
const planets = ref(JSON.parse(JSON.stringify(props.modelValue)));
const activeId = ref(planets.value[0]?.id || '');
const active = computed(() => planets.value.find(p => p.id === activeId.value));
const allTools = TOOLS;

function select(id) { activeId.value = id; }

// 添加新星球（随机初始参数）
function addPlanet() {
  const idx = planets.value.length;
  const newP = {
    id: generateId(),
    name: `星球 ${idx + 1}`,
    texture: '',
    color: '#1a3a5a',
    emissive: '#0a1525',
    radius: 0.8,
    orbitRadius: 2.5 + Math.random() * 2,
    orbitInclination: (Math.random() - 0.5) * 0.8,
    orbitSpeed: 0.02 + Math.random() * 0.03,
    wireframeColor: '#4FC3F7',
    atmosphere: true,
    ringEnabled: false,
    ringColor: '#a0c4ff',
    ringSize: 1.8,
    ringTilt: 0.3,
    tools: ['planetmgr'],
  };
  planets.value.push(newP);
  activeId.value = newP.id;
}

// 删除当前星球（保留至少一个）
function deletePlanet() {
  if (planets.value.length <= 1) return;
  const idx = planets.value.findIndex(p => p.id === activeId.value);
  planets.value = planets.value.filter(p => p.id !== activeId.value);
  activeId.value = planets.value[Math.min(idx, planets.value.length - 1)]?.id || planets.value[0]?.id || '';
}

// 切换工具的勾选状态
function toggleTool(toolId) {
  if (!active.value) return;
  const tool = allTools.find(t => t.id === toolId);
  if (tool && tool.permanent) return;
  const idx = active.value.tools.indexOf(toolId);
  if (idx >= 0) active.value.tools.splice(idx, 1);
  else active.value.tools.push(toolId);
}

// 上传贴图文件 → 转为 data URL
function onTextureFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (active.value) active.value.texture = reader.result;
  };
  reader.readAsDataURL(file);
}

// 保存：确保永久工具存在，触发父组件更新
function save() {
  const permanentIds = allTools.filter(t => t.permanent).map(t => t.id);
  planets.value.forEach(p => {
    permanentIds.forEach(id => { if (!p.tools.includes(id)) p.tools.push(id); });
  });
  emit('update:modelValue', JSON.parse(JSON.stringify(planets.value)));
}

// 重置为默认配置
function resetAll() {
  planets.value = JSON.parse(JSON.stringify(DEFAULT_PLANETS));
  activeId.value = planets.value[0]?.id || '';
  save();
}
</script>
