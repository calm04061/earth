// 星球配置管理模块 — 默认星球、配置持久化、最后访问记录
import { dbGet, dbPut, dbDelete } from './db.js';

// 默认星球配置（地球 + 开发者星球）
export const DEFAULT_PLANETS = [
  {
    id: 'earth',
    name: '地球',
    texture: 'earth-map.jpg',
    color: '#1a2a4a',
    emissive: '#0a1525',
    radius: 1.3,
    orbitRadius: 0,
    orbitInclination: 0,
    orbitSpeed: 0,
    wireframeColor: '#4FC3F7',
    atmosphere: true,
    ringEnabled: false,
    ringColor: '#a0c4ff',
    ringSize: 1.8,
    ringTilt: 0.3,
    tools: ['calculator', 'weather', 'notes', 'timer', 'calendar', 'music', 'camera', 'clock', 'compass', 'drawing', 'colorpicker', 'toolbox', 'videocall', 'qrcode', 'planetmgr'],
  },
  {
    id: 'dev-planet',
    name: '开发者星球',
    texture: '',
    color: '#0a2a1a',
    emissive: '#00ff88',
    radius: 0.55,
    orbitRadius: 4.8,
    orbitInclination: Math.PI * 0.25,
    orbitSpeed: 0.025,
    wireframeColor: '#00ff88',
    atmosphere: true,
    ringEnabled: false,
    ringColor: '#00ff88',
    ringSize: 1.2,
    ringTilt: 0.3,
    tools: ['json', 'jsondiff', 'timestamp', 'base64', 'url', 'textdiff', 'sort', 'crontab', 'regex', 'uuid', 'hash', 'passwd', 'length'],
  },
];

// 深拷贝默认配置
function defaults() {
  return JSON.parse(JSON.stringify(DEFAULT_PLANETS));
}

// 获取星球配置（优先从 IndexedDB 读取，兼容旧 localStorage 迁移）
export async function getConfig() {
  try {
    const raw = localStorage.getItem('earth-planet-config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.planets && Array.isArray(parsed.planets)) {
        localStorage.removeItem('earth-planet-config');
        ensurePlanetMgr(parsed.planets);
        await dbPut('planetConfig', { id: 'planets', value: parsed.planets });
        return parsed.planets;
      }
    }
  } catch (e) { /* ignore */ }

  try {
    const entry = await dbGet('planetConfig', 'planets');
    if (entry && Array.isArray(entry.value)) {
      ensurePlanetMgr(entry.value);
      return entry.value;
    }
  } catch (e) { /* ignore */ }

  return defaults();
}

// 确保 planetmgr 工具存在于星球配置中
function ensurePlanetMgr(planets) {
  const hasMgr = planets.some(p => p.tools && p.tools.includes('planetmgr'));
  if (!hasMgr && planets.length > 0) {
    if (!planets[0].tools) planets[0].tools = [];
    if (!planets[0].tools.includes('planetmgr')) planets[0].tools.push('planetmgr');
  }
}

// 保存星球配置到 IndexedDB
export async function saveConfig(planets) {
  await dbPut('planetConfig', { id: 'planets', value: planets });
}

// 重置为默认配置
export async function resetConfig() {
  try { await dbDelete('planetConfig', 'planets'); } catch (e) { /* ignore */ }
  localStorage.removeItem('earth-planet-config');
  return defaults();
}

// 读取上次访问的星球 ID
export async function getLastPlanet() {
  try {
    const entry = await dbGet('lastPlanet', 'last');
    if (entry && entry.value) return entry.value;
  } catch (e) { /* ignore */ }
  const saved = localStorage.getItem('earth-last-planet');
  if (saved) {
    localStorage.removeItem('earth-last-planet');
    await dbPut('lastPlanet', { id: 'last', value: saved });
    return saved;
  }
  return null;
}

// 保存最后访问的星球 ID
export async function saveLastPlanet(id) {
  await dbPut('lastPlanet', { id: 'last', value: id });
}

// 生成唯一的星球 ID
export function generateId() {
  return 'planet_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}
