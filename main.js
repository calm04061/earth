import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ─── Tool Definitions ──────────────────────────────────────────

const TOOLS = [
  {
    id: 'calculator', name: '计算器', icon: '🧮', color: '#4FC3F7',
    init: (el) => {
      el.innerHTML = `
        <div class="tool-calculator">
          <div class="calc-display" id="calc-display">0</div>
          <div class="calc-buttons">
            <button class="calc-btn num" data-v="7">7</button>
            <button class="calc-btn num" data-v="8">8</button>
            <button class="calc-btn num" data-v="9">9</button>
            <button class="calc-btn op" data-v="/">÷</button>
            <button class="calc-btn num" data-v="4">4</button>
            <button class="calc-btn num" data-v="5">5</button>
            <button class="calc-btn num" data-v="6">6</button>
            <button class="calc-btn op" data-v="*">×</button>
            <button class="calc-btn num" data-v="1">1</button>
            <button class="calc-btn num" data-v="2">2</button>
            <button class="calc-btn num" data-v="3">3</button>
            <button class="calc-btn op" data-v="-">−</button>
            <button class="calc-btn num" data-v="0">0</button>
            <button class="calc-btn num" data-v=".">.</button>
            <button class="calc-btn eq" id="calc-eq">=</button>
            <button class="calc-btn op" data-v="+">+</button>
            <button class="calc-btn clear" id="calc-clear">C</button>
          </div>
        </div>`;
      let expr = '';
      const d = el.querySelector('#calc-display');
      el.querySelectorAll('.calc-btn[data-v]').forEach(b => {
        b.addEventListener('click', () => {
          const v = b.dataset.v;
          if (d.textContent === '0' && !'+-*/'.includes(v) && v !== '.') expr = '';
          expr += v;
          d.textContent = expr || '0';
        });
      });
      el.querySelector('#calc-clear').addEventListener('click', () => { expr = ''; d.textContent = '0'; });
      el.querySelector('#calc-eq').addEventListener('click', () => {
        try { expr = String(Function('"use strict";return (' + expr + ')')()); d.textContent = expr; }
        catch { d.textContent = 'Error'; }
      });
    }
  },
  {
    id: 'weather', name: '天气', icon: '🌤️', color: '#FFB74D',
    init: (el) => {
      const w = ['☀️', '⛅', '🌤️', '🌧️', '⛈️', '❄️', '🌫️'];
      const desc = ['晴朗', '多云', '晴转多云', '小雨', '雷阵雨', '小雪', '雾'];
      const i = Math.floor(Math.random() * w.length);
      el.innerHTML = `
        <div class="tool-weather">
          <div class="weather-main">
            <div class="weather-icon">${w[i]}</div>
            <div class="weather-temp">${Math.floor(Math.random() * 15 + 20)}<span>°C</span></div>
          </div>
          <div class="weather-desc">${desc[i]} · 北京</div>
          <div class="weather-details">
            <div class="weather-detail-item"><span class="label">湿度</span><span class="value">${Math.floor(Math.random() * 40 + 40)}%</span></div>
            <div class="weather-detail-item"><span class="label">风速</span><span class="value">${Math.floor(Math.random() * 5 + 1)}m/s</span></div>
            <div class="weather-detail-item"><span class="label">降水</span><span class="value">${Math.floor(Math.random() * 30)}%</span></div>
          </div>
        </div>`;
    }
  },
  {
    id: 'notes', name: '备忘录', icon: '📝', color: '#81C784',
    init: (el) => {
      el.innerHTML = `
        <div class="tool-notes">
          <div class="notes-input-row">
            <input type="text" id="notes-input" placeholder="输入备忘内容..." />
            <button class="notes-add-btn" id="notes-add">添加</button>
          </div>
          <div class="notes-list" id="notes-list"></div>
        </div>`;
      const input = el.querySelector('#notes-input');
      const list = el.querySelector('#notes-list');
      const KEY = 'earth_notes';
      const notes = JSON.parse(localStorage.getItem(KEY) || '[]');
      const render = () => {
        list.innerHTML = notes.map((n, i) =>
          `<div class="note-item"><span class="note-text">${n}</span><button class="note-del" data-i="${i}">✕</button></div>`
        ).join('');
        list.querySelectorAll('.note-del').forEach(b =>
          b.addEventListener('click', () => { notes.splice(+b.dataset.i, 1); localStorage.setItem(KEY, JSON.stringify(notes)); render(); })
        );
      };
      render();
      const add = () => {
        const v = input.value.trim();
        if (!v) return;
        notes.push(v);
        localStorage.setItem(KEY, JSON.stringify(notes));
        input.value = '';
        render();
      };
      el.querySelector('#notes-add').addEventListener('click', add);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
    }
  },
  {
    id: 'timer', name: '计时器', icon: '⏱️', color: '#FF8A65',
    init: (el) => {
      el.innerHTML = `
        <div class="tool-timer">
          <div class="timer-inputs">
            <input type="number" id="timer-h" value="0" min="0" max="99" /> <span>:</span>
            <input type="number" id="timer-m" value="1" min="0" max="59" /> <span>:</span>
            <input type="number" id="timer-s" value="0" min="0" max="59" />
          </div>
          <div class="timer-display" id="timer-display">01:00</div>
          <div class="timer-controls">
            <button class="timer-btn start" id="timer-start">▶ 开始</button>
            <button class="timer-btn stop" id="timer-stop">⏹ 停止</button>
            <button class="timer-btn reset" id="timer-reset">↺ 重置</button>
          </div>
        </div>`;
      let total = 60, interval = null;
      const display = el.querySelector('#timer-display');
      const h = el.querySelector('#timer-h');
      const m = el.querySelector('#timer-m');
      const s = el.querySelector('#timer-s');
      const updateDisp = () => {
        const hh = String(Math.floor(total / 3600)).padStart(2, '0');
        const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
        const ss = String(total % 60).padStart(2, '0');
        display.textContent = `${hh}:${mm}:${ss}`;
      };
      const getInput = () => (+h.value || 0) * 3600 + (+m.value || 0) * 60 + (+s.value || 0);
      el.querySelector('#timer-start').addEventListener('click', () => {
        if (interval) return;
        if (total <= 0) total = getInput();
        if (total <= 0) return;
        interval = setInterval(() => { total--; updateDisp(); if (total <= 0) { clearInterval(interval); interval = null; } }, 1000);
      });
      el.querySelector('#timer-stop').addEventListener('click', () => {
        if (interval) { clearInterval(interval); interval = null; }
      });
      el.querySelector('#timer-reset').addEventListener('click', () => {
        if (interval) { clearInterval(interval); interval = null; }
        total = getInput();
        if (total <= 0) total = 60;
        updateDisp();
      });
      updateDisp();
    }
  },
  {
    id: 'calendar', name: '日历', icon: '📅', color: '#BA68C8',
    init: (el) => {
      const now = new Date();
      let year = now.getFullYear(), month = now.getMonth();
      const render = () => {
        const first = new Date(year, month, 1).getDay();
        const days = new Date(year, month + 1, 0).getDate();
        const prevDays = new Date(year, month, 0).getDate();
        const weeks = ['日', '一', '二', '三', '四', '五', '六'];
        const today = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : -1;
        let html = `<div class="calendar-header">
          <button class="calendar-nav" id="cal-prev">‹</button>
          <div class="calendar-title">${year}年${month + 1}月</div>
          <button class="calendar-nav" id="cal-next">›</button>
        </div>
        <div class="calendar-weekdays">${weeks.map(w => `<div class="calendar-weekday">${w}</div>`).join('')}</div>
        <div class="calendar-days">`;
        for (let i = first - 1; i >= 0; i--) html += `<button class="calendar-day other-month">${prevDays - i}</button>`;
        for (let d = 1; d <= days; d++) html += `<button class="calendar-day${d === today ? ' today' : ''}">${d}</button>`;
        const total = first + days;
        const rem = total % 7;
        if (rem) for (let i = 1; i <= 7 - rem; i++) html += `<button class="calendar-day other-month">${i}</button>`;
        html += '</div>';
        el.innerHTML = `<div class="tool-calendar">${html}</div>`;
        el.querySelector('#cal-prev').addEventListener('click', () => { month--; if (month < 0) { month = 11; year--; } render(); });
        el.querySelector('#cal-next').addEventListener('click', () => { month++; if (month > 11) { month = 0; year++; } render(); });
      };
      render();
    }
  },
  {
    id: 'music', name: '音乐', icon: '🎵', color: '#F06292',
    init: (el) => {
      const tracks = [
        { title: '晴天', artist: '周杰伦', icon: '☀️' },
        { title: '夜曲', artist: '周杰伦', icon: '🌙' },
        { title: '光年之外', artist: '邓紫棋', icon: '✨' },
        { title: '平凡之路', artist: '朴树', icon: '🛤️' },
      ];
      let idx = 0, playing = false, progress = 0;
      const render = () => {
        const t = tracks[idx];
        el.innerHTML = `
          <div class="tool-music">
            <div class="music-art">${t.icon}</div>
            <div class="music-title">${t.title}</div>
            <div class="music-artist">${t.artist}</div>
            <div class="music-progress">
              <span class="music-progress-time" id="music-current">0:00</span>
              <input type="range" id="music-progress" min="0" max="100" value="0" />
              <span class="music-progress-time" id="music-total">3:30</span>
            </div>
            <div class="music-controls">
              <button class="music-btn" id="music-prev">⏮</button>
              <button class="music-btn play" id="music-play">▶</button>
              <button class="music-btn" id="music-next">⏭</button>
            </div>
          </div>`;
        let interval;
        const playBtn = el.querySelector('#music-play');
        const progInput = el.querySelector('#music-progress');
        const currentLbl = el.querySelector('#music-current');
        const updateProg = () => {
          progInput.value = progress;
          const m = Math.floor(progress / 60), s = Math.floor(progress % 60);
          currentLbl.textContent = `${m}:${String(s).padStart(2, '0')}`;
        };
        el.querySelector('#music-play').addEventListener('click', () => {
          playing = !playing;
          playBtn.textContent = playing ? '⏸' : '▶';
          if (playing) {
            interval = setInterval(() => {
              progress += 0.5;
              if (progress >= 100) { clearInterval(interval); playing = false; playBtn.textContent = '▶'; progress = 0; }
              updateProg();
            }, 300);
          } else {
            clearInterval(interval);
          }
        });
        el.querySelector('#music-prev').addEventListener('click', () => {
          idx = (idx - 1 + tracks.length) % tracks.length;
          progress = 0; playing = false; clearInterval(interval); render();
        });
        el.querySelector('#music-next').addEventListener('click', () => {
          idx = (idx + 1) % tracks.length;
          progress = 0; playing = false; clearInterval(interval); render();
        });
        progInput.addEventListener('input', () => { progress = +progInput.value; updateProg(); });
      };
      render();
    }
  },
  {
    id: 'camera', name: '相机', icon: '📷', color: '#90A4AE',
    init: (el) => {
      el.innerHTML = `
        <div class="tool-camera">
          <div class="camera-viewfinder" id="camera-view">
            <div class="placeholder"><div class="icon">📷</div><span>点击拍照</span></div>
          </div>
          <button class="camera-capture-btn" id="camera-capture"></button>
        </div>`;
      let flashTimer = null;
      const view = el.querySelector('#camera-view');
      el.querySelector('#camera-capture').addEventListener('click', () => {
        const flash = document.createElement('div');
        flash.style.cssText = 'position:absolute;inset:0;background:#fff;z-index:10;border-radius:12px;';
        view.appendChild(flash);
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => flash.remove(), 200);
      });
    }
  },
  {
    id: 'clock', name: '时钟', icon: '🕐', color: '#FFD54F',
    init: (el) => {
      el.innerHTML = `
        <div class="tool-clock">
          <div class="clock-canvas-wrap"><canvas id="clock-canvas" width="200" height="200"></canvas></div>
          <div class="clock-digital" id="clock-digital"></div>
          <div class="clock-date" id="clock-date"></div>
        </div>`;
      const canvas = el.querySelector('#clock-canvas');
      const ctx = canvas.getContext('2d');
      const draw = () => {
        const now = new Date();
        const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
        const cx = 100, cy = 100, r = 88;
        ctx.clearRect(0, 0, 200, 200);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(79,195,247,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let i = 0; i < 12; i++) {
          const a = (i * 30 - 90) * Math.PI / 180;
          const x1 = cx + Math.cos(a) * (r - 8);
          const y1 = cy + Math.sin(a) * (r - 8);
          const x2 = cx + Math.cos(a) * (r - 2);
          const y2 = cy + Math.sin(a) * (r - 2);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 3 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
          ctx.lineWidth = i % 3 === 0 ? 3 : 1;
          ctx.stroke();
        }
        const drawHand = (angle, length, width, color) => {
          const a = (angle - 90) * Math.PI / 180;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * length, cy + Math.sin(a) * length);
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.stroke();
        };
        drawHand((h % 12) * 30 + m * 0.5, r * 0.5, 4, '#fff');
        drawHand(m * 6 + s * 0.1, r * 0.65, 3, 'rgba(255,255,255,0.8)');
        drawHand(s * 6, r * 0.75, 1.5, '#FF5252');
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#4FC3F7';
        ctx.fill();
        el.querySelector('#clock-digital').textContent =
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        el.querySelector('#clock-date').textContent =
          `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`;
      };
      draw();
      setInterval(draw, 1000);
    }
  },
  {
    id: 'compass', name: '指南针', icon: '🧭', color: '#A1887F',
    init: (el) => {
      el.innerHTML = `
        <div class="tool-compass">
          <div class="compass-wrap"><canvas id="compass-canvas" width="200" height="200"></canvas></div>
          <div class="compass-direction" id="compass-dir">北</div>
          <div class="compass-degree" id="compass-deg">0°</div>
        </div>`;
      const canvas = el.querySelector('#compass-canvas');
      const ctx = canvas.getContext('2d');
      let angle = 0;
      const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
      const draw = () => {
        const cx = 100, cy = 100, r = 90;
        ctx.clearRect(0, 0, 200, 200);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const a = (i * 45 + angle - 90) * Math.PI / 180;
          const x = cx + Math.cos(a) * (r - 14);
          const y = cy + Math.sin(a) * (r - 14);
          ctx.fillStyle = '#fff';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(dirs[i], x, y);
        }
        for (let i = 0; i < 72; i++) {
          const a = (i * 5 + angle - 90) * Math.PI / 180;
          const len = i % 6 === 0 ? 12 : 6;
          const x1 = cx + Math.cos(a) * (r - len);
          const y1 = cy + Math.sin(a) * (r - len);
          const x2 = cx + Math.cos(a) * r;
          const y2 = cy + Math.sin(a) * r;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 6 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)';
          ctx.lineWidth = i % 6 === 0 ? 1.5 : 0.5;
          ctx.stroke();
        }
        const needle = (a, color, label) => {
          const rad = (a + angle - 90) * Math.PI / 180;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(rad) * (r - 10), cy + Math.sin(rad) * (r - 10));
          ctx.lineTo(cx - Math.cos(rad + 0.4) * 14, cy - Math.sin(rad + 0.4) * 14);
          ctx.lineTo(cx - Math.cos(rad - 0.4) * 14, cy - Math.sin(rad - 0.4) * 14);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
        };
        needle(0, '#FF5252', 'N');
        needle(180, 'rgba(255,255,255,0.3)', 'S');
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#4FC3F7';
        ctx.fill();
        const idx = Math.round(((angle % 360 + 360) % 360) / 45) % 8;
        el.querySelector('#compass-dir').textContent = dirs[idx];
        el.querySelector('#compass-deg').textContent = `${Math.round(((angle % 360 + 360) % 360))}°`;
      };
      draw();
      let isDragging = false, lastX = 0;
      canvas.addEventListener('mousedown', (e) => { isDragging = true; lastX = e.clientX; });
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        angle += (e.clientX - lastX) * 0.5;
        lastX = e.clientX;
        draw();
      });
      window.addEventListener('mouseup', () => { isDragging = false; });
      canvas.addEventListener('touchstart', (e) => { isDragging = true; lastX = e.touches[0].clientX; });
      window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        angle += (e.touches[0].clientX - lastX) * 0.5;
        lastX = e.touches[0].clientX;
        draw();
      });
      window.addEventListener('touchend', () => { isDragging = false; });
    }
  },
  {
    id: 'drawing', name: '画板', icon: '🎨', color: '#FFB74D',
    init: (el) => {
      el.innerHTML = `
        <div class="tool-drawing">
          <div class="drawing-canvas-wrap"><canvas id="draw-canvas" width="360" height="240"></canvas></div>
          <div class="drawing-tools">
            <button class="drawing-color active" style="background:#4FC3F7" data-c="#4FC3F7"></button>
            <button class="drawing-color" style="background:#FF5252" data-c="#FF5252"></button>
            <button class="drawing-color" style="background:#81C784" data-c="#81C784"></button>
            <button class="drawing-color" style="background:#FFD54F" data-c="#FFD54F"></button>
            <button class="drawing-color" style="background:#BA68C8" data-c="#BA68C8"></button>
            <button class="drawing-color" style="background:#fff" data-c="#FFFFFF"></button>
            <div class="drawing-size">
              <span>●</span>
              <input type="range" id="draw-size" min="1" max="20" value="4" />
              <span>●</span>
            </div>
            <button class="drawing-clear" id="draw-clear">清空</button>
          </div>
        </div>`;
      const canvas = el.querySelector('#draw-canvas');
      const ctx = canvas.getContext('2d');
      let painting = false, color = '#4FC3F7', size = 4;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const draw = (x, y) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      };
      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const t = e.touches ? e.touches[0] : e;
        return [(t.clientX - rect.left) * scaleX, (t.clientY - rect.top) * scaleY];
      };
      canvas.addEventListener('mousedown', (e) => { painting = true; const [x, y] = getPos(e); draw(x, y); });
      canvas.addEventListener('mousemove', (e) => { if (!painting) return; const [x, y] = getPos(e); draw(x, y); });
      canvas.addEventListener('mouseup', () => { painting = false; });
      canvas.addEventListener('mouseleave', () => { painting = false; });
      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); painting = true; const [x, y] = getPos(e); draw(x, y); });
      canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!painting) return; const [x, y] = getPos(e); draw(x, y); });
      canvas.addEventListener('touchend', () => { painting = false; });
      el.querySelectorAll('.drawing-color').forEach(b => {
        b.addEventListener('click', () => {
          el.querySelectorAll('.drawing-color').forEach(c => c.classList.remove('active'));
          b.classList.add('active');
          color = b.dataset.c;
        });
      });
      el.querySelector('#draw-size').addEventListener('input', (e) => { size = +e.target.value; });
      el.querySelector('#draw-clear').addEventListener('click', () => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });
    }
  },
  {
    id: 'colorpicker', name: '颜色', icon: '🎯', color: '#E57373',
    init: (el) => {
      el.innerHTML = `
        <div class="tool-colorpicker">
          <div class="colorpicker-main">
            <div class="colorpicker-preview" id="cp-preview" style="background:#4FC3F7"></div>
            <div class="colorpicker-sliders">
              <div class="colorpicker-slider-row"><label style="color:#FF5252">R</label><input type="range" id="cp-r" min="0" max="255" value="79" /><span class="val" id="cp-rv">79</span></div>
              <div class="colorpicker-slider-row"><label style="color:#81C784">G</label><input type="range" id="cp-g" min="0" max="255" value="195" /><span class="val" id="cp-gv">195</span></div>
              <div class="colorpicker-slider-row"><label style="color:#4FC3F7">B</label><input type="range" id="cp-b" min="0" max="255" value="247" /><span class="val" id="cp-bv">247</span></div>
            </div>
            <div class="colorpicker-hex" id="cp-hex">#4FC3F7</div>
          </div>
        </div>`;
      const update = () => {
        const r = +el.querySelector('#cp-r').value;
        const g = +el.querySelector('#cp-g').value;
        const b = +el.querySelector('#cp-b').value;
        el.querySelector('#cp-preview').style.background = `rgb(${r},${g},${b})`;
        el.querySelector('#cp-rv').textContent = r;
        el.querySelector('#cp-gv').textContent = g;
        el.querySelector('#cp-bv').textContent = b;
        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
        el.querySelector('#cp-hex').textContent = hex.toUpperCase();
      };
      ['cp-r', 'cp-g', 'cp-b'].forEach(id => {
        el.querySelector(`#${id}`).addEventListener('input', update);
      });
    }
  },
  {
    id: 'toolbox', name: '工具箱', icon: '🔧', color: '#A1887F',
    init: (el) => {
      const items = [
        { icon: '🔨', name: '锤子' }, { icon: '🔩', name: '螺母' }, { icon: '⚙️', name: '齿轮' },
        { icon: '🔗', name: '链接' }, { icon: '💡', name: '灯泡' }, { icon: '🔒', name: '锁' },
        { icon: '🔑', name: '钥匙' }, { icon: '📌', name: '图钉' }, { icon: '✂️', name: '剪刀' },
      ];
      el.innerHTML = `<div class="tool-toolbox">${items.map(i =>
        `<button class="toolbox-item"><span class="icon">${i.icon}</span><span class="name">${i.name}</span></button>`
      ).join('')}</div>`;
      el.querySelectorAll('.toolbox-item').forEach(b => {
        b.addEventListener('click', () => {
          b.style.transform = 'scale(0.9)';
          setTimeout(() => b.style.transform = '', 150);
        });
      });
    }
  },
  {
    id: 'qrcode', name: '二维码', icon: '📱', color: '#4DB6AC',
    init: (el) => {
      el.innerHTML = `
        <div class="tool-qrcode">
          <div class="qrcode-input-row">
            <input type="text" id="qr-input" placeholder="输入文本或链接..." value="Hello 3D Earth!" />
            <button class="qrcode-gen-btn" id="qr-gen">生成</button>
          </div>
          <div class="qrcode-display" id="qr-display"><span style="color:rgba(0,0,0,0.3);font-size:13px;">点击生成二维码</span></div>
        </div>`;
      const canvas = document.createElement('canvas');
      const qr = el.querySelector('#qr-display');
      const genQR = () => {
        const text = el.querySelector('#qr-input').value.trim() || 'Hello 3D Earth!';
        const size = 160;
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, size, size);
        const cells = Math.ceil(Math.sqrt(text.length * 8 + 64));
        const step = size / (cells + 2);
        ctx.fillStyle = '#000';
        for (let i = 0; i < cells; i++) {
          for (let j = 0; j < cells; j++) {
            const val = ((i * 7 + j * 13 + text.charCodeAt((i * cells + j) % text.length)) % 5) > 2;
            if (val) ctx.fillRect((i + 1) * step, (j + 1) * step, step, step);
          }
        }
        const border = 2;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = border * 2;
        ctx.strokeRect(border + 0.5, border + 0.5, size - border * 2 - 1, size - border * 2 - 1);
        qr.innerHTML = '';
        const img = document.createElement('img');
        img.src = canvas.toDataURL();
        img.style.width = '160px';
        img.style.height = '160px';
        img.alt = 'QR Code';
        qr.appendChild(img);
      };
      el.querySelector('#qr-gen').addEventListener('click', genQR);
      genQR();
    }
  },
];

// ─── Three.js Scene ───────────────────────────────────────────

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 2000);
camera.position.set(0, 0.8, 5.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(container.clientWidth, container.clientHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.8;
controls.minDistance = 2.5;
controls.maxDistance = 12;
controls.target.set(0, 0, 0);

// ─── Lights ──────────────────────────────────────────────────

const ambientLight = new THREE.AmbientLight(0x404080, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 8, 6);
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0x4FC3F7, 0.4);
backLight.position.set(-5, -3, -6);
scene.add(backLight);

// ─── Globe ───────────────────────────────────────────────────

const RADIUS = 1.8;

// Main sphere
const globeGeo = new THREE.SphereGeometry(RADIUS, 64, 64);
const globeMat = new THREE.MeshPhysicalMaterial({
  color: 0x0a1a3a,
  emissive: 0x0d2147,
  emissiveIntensity: 0.3,
  metalness: 0.1,
  roughness: 0.3,
  transparent: true,
  opacity: 0.85,
  clearcoat: 0.1,
});
const globe = new THREE.Mesh(globeGeo, globeMat);
scene.add(globe);

// Wireframe
const wireGeo = new THREE.SphereGeometry(RADIUS * 1.005, 28, 18);
const wireMat = new THREE.MeshBasicMaterial({
  color: 0x4FC3F7,
  wireframe: true,
  transparent: true,
  opacity: 0.12,
});
const wireframe = new THREE.Mesh(wireGeo, wireMat);
scene.add(wireframe);

// Latitude / longitude lines using torus geometry
const addRing = (lat, color, opacity) => {
  const y = Math.sin(lat);
  const r = Math.cos(lat) * RADIUS * 1.006;
  if (r < 0.01) return;
  const curve = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0);
  const pts = curve.getPoints(48);
  const geo = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p.x, y * RADIUS * 1.006, p.y)));
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
};
for (let i = -80; i <= 80; i += 20) {
  addRing(i * Math.PI / 180, 0x4FC3F7, i === 0 ? 0.25 : 0.1);
}
// Meridians
for (let i = 0; i < 360; i += 30) {
  const rad = i * Math.PI / 180;
  const pts = [];
  for (let j = 0; j <= 180; j += 4) {
    const lat = j * Math.PI / 180;
    pts.push(new THREE.Vector3(
      Math.cos(lat) * Math.cos(rad) * RADIUS * 1.006,
      Math.sin(lat) * RADIUS * 1.006,
      Math.cos(lat) * Math.sin(rad) * RADIUS * 1.006
    ));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: 0x4FC3F7, transparent: true, opacity: 0.07 });
  scene.add(new THREE.Line(geo, mat));
}

// Atmosphere glow
const glowVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPositionW;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;
const glowFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPositionW;
  uniform vec3 uColor;
  uniform float uIntensity;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
    float glow = pow(rim, 3.0) * uIntensity;
    gl_FragColor = vec4(uColor, glow * 0.8);
  }
`;
const glowMat = new THREE.ShaderMaterial({
  vertexShader: glowVertexShader,
  fragmentShader: glowFragmentShader,
  uniforms: { uColor: { value: new THREE.Color(0x4FC3F7) }, uIntensity: { value: 1.5 } },
  transparent: true,
  side: THREE.FrontSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.15, 32, 32), glowMat);
scene.add(glowMesh);

// ─── Stars ───────────────────────────────────────────────────

const starCount = 2000;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 200;
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const sizes = new Float32Array(starCount);
for (let i = 0; i < starCount; i++) sizes[i] = Math.random() * 1.5 + 0.3;
starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.15,
  transparent: true,
  opacity: 0.8,
  sizeAttenuation: true,
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// ─── Orbital Satellite System ────────────────────────────────

const ORBITS = [
  { inclination: 0, radius: 2.8, speed: 0.12, count: 3, color: 0x4FC3F7 },
  { inclination: Math.PI * 0.4, radius: 3.2, speed: 0.08, count: 3, color: 0xBA68C8 },
  { inclination: Math.PI * 0.85, radius: 3.0, speed: 0.15, count: 3, color: 0xFFB74D },
  { inclination: -Math.PI * 0.32, radius: 3.4, speed: 0.1, count: 3, color: 0x81C784 },
];

const satelliteData = [];

const markerCanvas = document.createElement('canvas');
markerCanvas.width = 64;
markerCanvas.height = 64;
const mCtx = markerCanvas.getContext('2d');
const gradient = mCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
gradient.addColorStop(0, 'rgba(79, 195, 247, 1)');
gradient.addColorStop(0.2, 'rgba(79, 195, 247, 0.6)');
gradient.addColorStop(0.5, 'rgba(79, 195, 247, 0.2)');
gradient.addColorStop(1, 'rgba(79, 195, 247, 0)');
mCtx.fillStyle = gradient;
mCtx.fillRect(0, 0, 64, 64);
const markerTexture = new THREE.CanvasTexture(markerCanvas);

function getOrbitPos(radius, inclination, theta) {
  return new THREE.Vector3(
    radius * Math.cos(theta),
    -radius * Math.sin(theta) * Math.sin(inclination),
    radius * Math.sin(theta) * Math.cos(inclination)
  );
}

let toolIdx = 0;
ORBITS.forEach((orbit) => {
  // ── Orbital ring line ──
  const ringSegs = 80;
  const ringPts = [];
  for (let i = 0; i <= ringSegs; i++) {
    const theta = (i / ringSegs) * Math.PI * 2;
    ringPts.push(getOrbitPos(orbit.radius, orbit.inclination, theta));
  }
  const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
  const ringLineMat = new THREE.LineBasicMaterial({
    color: orbit.color,
    transparent: true,
    opacity: 0.12,
  });
  scene.add(new THREE.Line(ringGeo, ringLineMat));

  // ── Orbital ring dots ──
  const dotCount = 100;
  const dotPositions = new Float32Array(dotCount * 3);
  for (let i = 0; i < dotCount; i++) {
    const theta = (i / dotCount) * Math.PI * 2;
    const p = getOrbitPos(orbit.radius, orbit.inclination, theta);
    dotPositions[i * 3] = p.x;
    dotPositions[i * 3 + 1] = p.y;
    dotPositions[i * 3 + 2] = p.z;
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
  const dotMat = new THREE.PointsMaterial({
    color: orbit.color,
    size: 0.03,
    transparent: true,
    opacity: 0.3,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(dotGeo, dotMat));

  // ── Satellites on this orbit ──
  for (let i = 0; i < orbit.count; i++) {
    if (toolIdx >= TOOLS.length) break;
    const tool = TOOLS[toolIdx];
    const startAngle = (i / orbit.count) * Math.PI * 2 + 0.3;

    // Glow sprite
    const markerMat = new THREE.SpriteMaterial({
      map: markerTexture,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      transparent: true,
      opacity: 0.9,
      color: new THREE.Color(tool.color),
    });
    const marker = new THREE.Sprite(markerMat);
    marker.scale.set(0.35, 0.35, 1);
    scene.add(marker);

    // Core dot
    const dotGeo3 = new THREE.SphereGeometry(0.028, 8, 8);
    const dotMat3 = new THREE.MeshBasicMaterial({ color: new THREE.Color(tool.color) });
    const dot = new THREE.Mesh(dotGeo3, dotMat3);
    scene.add(dot);

    // Tether line (satellite → globe surface)
    const lineGeo = new THREE.BufferGeometry();
    const linePos = new Float32Array(6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: tool.color,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
    });
    const tether = new THREE.Line(lineGeo, lineMat);
    scene.add(tether);

    // Label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'tool-label';
    labelDiv.dataset.toolIndex = toolIdx;
    labelDiv.innerHTML = `<span class="label-icon">${tool.icon}</span><span class="label-name">${tool.name}</span>`;
    const label = new CSS2DObject(labelDiv);
    scene.add(label);

    labelDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      openTool(toolIdx, labelDiv);
    });

    satelliteData.push({
      orbit,
      startAngle,
      marker,
      dot,
      tether,
      linePos,
      lineGeo,
      label,
    });

    toolIdx++;
  }
});

// ─── Popup System ───────────────────────────────────────────

let lastOrigin = { x: 0, y: 0 };
let currentToolIndex = -1;
let popupCardAnim = null;

const popupBackdrop = document.getElementById('popup-backdrop');
const popupCard = document.getElementById('popup-card');
const popupIcon = document.getElementById('popup-icon');
const popupTitle = document.getElementById('popup-title');
const popupBody = document.getElementById('popup-body');

function openTool(index, element) {
  if (currentToolIndex >= 0) return;
  currentToolIndex = index;
  const tool = TOOLS[index];

  const rect = element.getBoundingClientRect();
  lastOrigin.x = rect.left + rect.width / 2;
  lastOrigin.y = rect.top + rect.height / 2;

  controls.autoRotate = false;

  popupIcon.textContent = tool.icon;
  popupTitle.textContent = tool.name;
  popupBody.innerHTML = '';
  if (tool.init) tool.init(popupBody);

  popupBackdrop.classList.add('open');

  if (popupCardAnim) popupCardAnim.cancel();

  const cw = window.innerWidth;
  const ch = window.innerHeight;
  const dx = lastOrigin.x - cw / 2;
  const dy = lastOrigin.y - ch / 2;

  popupCard.style.transform = `translate(calc(${dx}px - 50%), calc(${dy}px - 50%)) scale(0.15)`;
  popupCard.style.opacity = '0';
  popupCard.style.display = '';

  requestAnimationFrame(() => {
    popupCardAnim = popupCard.animate([
      {
        transform: `translate(calc(${dx}px - 50%), calc(${dy}px - 50%)) scale(0.15)`,
        opacity: 0,
      },
      {
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 1,
      },
    ], {
      duration: 500,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'forwards',
    });
    popupCardAnim.finished.then(() => {
      popupCard.style.transform = 'translate(-50%, -50%) scale(1)';
      popupCard.style.opacity = '1';
    });
  });

  popupBackdrop.animate([
    { opacity: 0 },
    { opacity: 1 },
  ], { duration: 300, fill: 'forwards' });
}

function closeTool() {
  if (currentToolIndex < 0) return;

  if (popupCardAnim) popupCardAnim.cancel();

  const cw = window.innerWidth;
  const ch = window.innerHeight;
  const dx = lastOrigin.x - cw / 2;
  const dy = lastOrigin.y - ch / 2;

  popupCardAnim = popupCard.animate([
    {
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 1,
    },
    {
      transform: `translate(calc(${dx}px - 50%), calc(${dy}px - 50%)) scale(0.15)`,
      opacity: 0,
    },
  ], {
    duration: 350,
    easing: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    fill: 'forwards',
  });

  const backdropAnim = popupBackdrop.animate([
    { opacity: 1 },
    { opacity: 0 },
  ], { duration: 250, fill: 'forwards' });

  popupCardAnim.finished.then(() => {
    popupBackdrop.classList.remove('open');
    currentToolIndex = -1;
    controls.autoRotate = true;
  });
  backdropAnim.finished.then(() => {
    popupBackdrop.style.opacity = '';
  });
}

document.getElementById('popup-close').addEventListener('click', closeTool);

popupBackdrop.addEventListener('click', (e) => {
  if (e.target === popupBackdrop) closeTool();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && currentToolIndex >= 0) closeTool();
});

// ─── Animation Loop ─────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  const t = Date.now() * 0.001;

  // Update satellite orbital positions
  satelliteData.forEach((sat) => {
    const theta = sat.startAngle + t * sat.orbit.speed;
    const pos = getOrbitPos(sat.orbit.radius, sat.orbit.inclination, theta);

    sat.marker.position.copy(pos);
    sat.dot.position.copy(pos);

    // Update tether line
    const dir = pos.clone().normalize();
    sat.linePos[0] = dir.x * RADIUS;
    sat.linePos[1] = dir.y * RADIUS;
    sat.linePos[2] = dir.z * RADIUS;
    sat.linePos[3] = pos.x;
    sat.linePos[4] = pos.y;
    sat.linePos[5] = pos.z;
    sat.lineGeo.attributes.position.needsUpdate = true;

    // Label offset (radially outward from globe center)
    const labelR = sat.orbit.radius + 0.45;
    sat.label.position.set(
      dir.x * labelR,
      dir.y * labelR,
      dir.z * labelR
    );

    // Pulse glow
    const pulse = 1 + Math.sin(t * 1.5 + sat.startAngle) * 0.12;
    sat.marker.scale.set(pulse * 0.35, pulse * 0.35, 1);
  });

  // Rotate stars slowly
  stars.rotation.y += 0.0002;

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

animate();

// ─── Resize ─────────────────────────────────────────────────

window.addEventListener('resize', () => {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
});

// ─── Start ──────────────────────────────────────────────────

console.log('🌐 3D Earth Toolkit ready! Click a tool to open.');
