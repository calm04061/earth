import { dbGet, dbPut, dbDelete } from './db.js';

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

function defaults() {
  return JSON.parse(JSON.stringify(DEFAULT_PLANETS));
}

export async function getConfig() {
  // migrate from localStorage
  try {
    const raw = localStorage.getItem('earth-planet-config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.planets && Array.isArray(parsed.planets)) {
        localStorage.removeItem('earth-planet-config');
        await dbPut('planetConfig', { id: 'planets', value: parsed.planets });
        return parsed.planets;
      }
    }
  } catch (e) { /* ignore */ }

  try {
    const entry = await dbGet('planetConfig', 'planets');
    if (entry && Array.isArray(entry.value)) return entry.value;
  } catch (e) { /* ignore */ }

  return defaults();
}

export async function saveConfig(planets) {
  await dbPut('planetConfig', { id: 'planets', value: planets });
}

export async function resetConfig() {
  try { await dbDelete('planetConfig', 'planets'); } catch (e) { /* ignore */ }
  localStorage.removeItem('earth-planet-config');
  return defaults();
}

export async function getLastPlanet() {
  try {
    const entry = await dbGet('lastPlanet', 'last');
    if (entry && entry.value) return entry.value;
  } catch (e) { /* ignore */ }
  // migrate from localStorage
  const saved = localStorage.getItem('earth-last-planet');
  if (saved) {
    localStorage.removeItem('earth-last-planet');
    await dbPut('lastPlanet', { id: 'last', value: saved });
    return saved;
  }
  return null;
}

export async function saveLastPlanet(id) {
  await dbPut('lastPlanet', { id: 'last', value: id });
}

export function generateId() {
  return 'planet_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}
