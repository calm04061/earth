// 超光速航行特效 — Canvas 2D 星点拉线模拟曲速引擎效果
const STAR_COUNT = 300;
const DEPTH = 800;

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

// 在指定容器中创建超空间特效
export function createHyperspace(container) {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  let w, h, cx, cy;
  function resize() {
    w = container.clientWidth;
    h = container.clientHeight;
    canvas.width = w;
    canvas.height = h;
    cx = w / 2;
    cy = h / 2;
  }
  resize();

  // 初始化星点：随机 x/y/z 位置和速度
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: randomRange(-1, 1),
      y: randomRange(-1, 1),
      z: randomRange(0, DEPTH),
      speed: randomRange(3, 10),
      prev: null,
    });
  }

  let animId = null;
  let elapsed = 0;

  // 动画循环：每帧更新星点位置并绘制拖尾线条
  function animate(time) {
    animId = requestAnimationFrame(animate);
    const dt = Math.min((time - elapsed) / 16, 3);
    elapsed = time;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    // 渐入效果（前 600ms 淡入）
    const alpha = Math.min(1, Math.max(0, (time - 200) / 400));

    stars.forEach((s) => {
      const prevZ = s.z;
      s.z -= s.speed * dt;
      // 星点到达视野 → 重置到深处循环使用
      if (s.z < 1) {
        s.x = randomRange(-1, 1);
        s.y = randomRange(-1, 1);
        s.z = DEPTH;
        s.prev = null;
        return;
      }

      // 透视投影：z 越小 → 离镜头越近 → 缩放越大
      const scale = 200 / s.z;
      const px = cx + s.x * scale * w * 0.4;
      const py = cy + s.y * scale * h * 0.4;

      // 绘制拖尾（上一帧位置 → 当前位置）
      if (s.prev) {
        const prevScale = 200 / prevZ;
        const ppx = cx + s.x * prevScale * w * 0.4;
        const ppy = cy + s.y * prevScale * h * 0.4;
        const len = Math.hypot(px - ppx, py - ppy);
        if (len > 1) {
          const bright = Math.min(1, (DEPTH - s.z) / DEPTH * 2);
          ctx.beginPath();
          ctx.moveTo(ppx, ppy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = `hsla(190, 80%, ${60 + bright * 40}%, ${bright * alpha})`;
          ctx.lineWidth = 0.5 + bright * 2;
          ctx.stroke();
        }
      }
      s.prev = { px, py };
    });

    // 中心蓝色辉光
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
    grad.addColorStop(0, `rgba(0, 200, 255, ${0.08 * alpha})`);
    grad.addColorStop(1, 'rgba(0, 200, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  animId = requestAnimationFrame(animate);

  return {
    resize,
    dispose() {
      cancelAnimationFrame(animId);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    },
  };
}
