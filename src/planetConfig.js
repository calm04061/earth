const STORAGE_KEY = 'earth-planet-config';

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

export function getConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.planets && Array.isArray(parsed.planets)) {
        return parsed.planets;
      }
    }
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(DEFAULT_PLANETS));
}

export function saveConfig(planets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ planets }));
}

export function resetConfig() {
  localStorage.removeItem(STORAGE_KEY);
  return JSON.parse(JSON.stringify(DEFAULT_PLANETS));
}

export function generateId() {
  return 'planet_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}
