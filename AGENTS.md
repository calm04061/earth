# 3D Earth Toolkit — AGENTS.md

## Quick start
```bash
npm run dev      # Vite dev server at localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

## Deploy
- GitHub Pages (Actions): push to `master` → `.github/workflows/deploy.yml` auto-builds and deploys
- Manual: `npm run deploy` (requires `gh-pages` setup)

## Architecture
- **Vite** vanilla JS, no framework
- **Three.js** (`three`) for 3D WebGL rendering
- **CSS2DRenderer** (`three/addons/renderers/CSS2DRenderer.js`) for DOM labels overlaid on 3D scene
- **OrbitControls** (`three/addons/controls/OrbitControls.js`) for mouse/touch camera control

## Key files
| File | Purpose |
|------|---------|
| `main.js` | Entry point: Three.js scene, globe, orbital satellites, tool popup system |
| `style.css` | All UI styles (globe labels, popups, 12 tool UIs) |
| `index.html` | Minimal HTML shell |
| `vite.config.js` | Sets `base: '/earth/'` for GitHub Pages |

## Structure notes
- Tools defined as an array in `main.js`, each with `init(el)` that renders tool UI into a DOM container
- Satellites orbit on 4 rings at different inclinations, defined in `ORBITS` array
- `getOrbitPos(r, inc, theta)` computes 3D position on an inclined orbit
- Popup animation uses Web Animations API, scales from satellite screen position to center
- `NODE_ENV=production` is set in the environment; `npm install` may skip devDependencies — use `NODE_ENV=development` if needed
