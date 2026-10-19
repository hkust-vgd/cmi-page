// Program 01 mapping viewer: loads a Gaussian-splat map into the Photo-SLAM panel once it scrolls into view.
// Uses the vendored GaussianSplats3D build (see vendor/README.md); the page keeps its static placeholder without WebGL 2.
const figure = document.querySelector('.splat-viewer[data-splat]');

function webgl2() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch (err) {
    return false;
  }
}

// GitHub Pages gzips binary files and reports the compressed Content-Length, which stalls the library's own loader.
// Download each file ourselves (the browser decompresses it) and hand the viewer a local blob of the right size.
async function localCopy(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('map not found');
  return URL.createObjectURL(new Blob([await response.arrayBuffer()]));
}

const FORMATS = { splat: 'Splat', ksplat: 'KSplat', ply: 'Ply', spz: 'Spz' };
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A map is either one splat file, or a scene.json listing its parts (e.g. seabed, coral, rock) with the camera set-up.
async function readScene(src) {
  if (!src.split('?')[0].endsWith('.json')) return { parts: [{ file: src }], base: '' };
  const response = await fetch(src);
  if (!response.ok) throw new Error('scene not found');
  const scene = await response.json();
  scene.base = src.slice(0, src.lastIndexOf('/') + 1);
  return scene;
}

async function start(stage, src) {
  stage.classList.add('is-loading');
  try {
    const GaussianSplats3D = await import('@mkkellogg/gaussian-splats-3d');
    const scene = await readScene(src);
    const mount = stage.querySelector('.splat-canvas');
    const viewer = new GaussianSplats3D.Viewer({
      rootElement: mount,
      cameraUp: scene.up || [0, 1, 0],
      initialCameraPosition: scene.camera || [3.4, 1.9, 3.4],
      initialCameraLookAt: scene.target || [0, 0.3, 0],
      sharedMemoryForWorkers: false,
      dynamicScene: false,
      antialiased: true,
      enableOptionalEffects: true, // per-part opacity, used to show a selected part on its own
      sphericalHarmonicsDegree: scene.sphericalHarmonics || 0,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
      logLevel: GaussianSplats3D.LogLevel.None
    });
    // The library's debug shortcuts listen on the whole page (arrow keys tilt the map, I/P/O toggle debug views); turn them off.
    if (viewer.keyDownListener) window.removeEventListener('keydown', viewer.keyDownListener);
    const urls = await Promise.all(scene.parts.map((part) => localCopy(scene.base + part.file)));
    await viewer.addSplatScenes(scene.parts.map((part, i) => ({
      path: urls[i],
      format: GaussianSplats3D.SceneFormat[FORMATS[part.file.split('?')[0].split('.').pop().toLowerCase()]],
      splatAlphaRemovalThreshold: 5
    })), false);
    viewer.start();
    if (viewer.renderer) viewer.renderer.setClearColor(0x0a3550, 1);
    const controls = viewer.controls;
    if (controls) {
      controls.autoRotate = !reduceMotion;
      controls.autoRotateSpeed = 0.5;
      controls.addEventListener('start', () => { controls.autoRotate = false; });
    }
    if (scene.parts.some((part) => part.select)) enableSelection(stage, viewer, scene);
    stage.classList.remove('is-loading');
    stage.classList.add('is-ready');
  } catch (err) {
    stage.classList.remove('is-loading');
    stage.classList.add('is-failed');
  }
}

// Part selection: buttons for the whole scene and each selectable part (here the coral and the rock); clicking a part
// in the view selects it too.
// The other parts fade out, and the camera eases towards the selection.
function enableSelection(stage, viewer, scene) {
  const mesh = viewer.splatMesh;
  const options = [{ label: 'Whole scene', index: -1 }];
  scene.parts.forEach((part, index) => { if (part.select) options.push({ label: part.label, index }); });
  const group = document.createElement('div');
  group.className = 'clip-tabs';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Choose what the 3D map shows');
  const buttons = options.map((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'clip-tab';
    button.textContent = option.label;
    button.addEventListener('click', () => select(option.index, true));
    group.append(button);
    return button;
  });
  stage.append(group);
  const hint = stage.querySelector('.splat-hint');
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const action = scene.hint || 'click an object to show it on its own';
  if (hint) {
    hint.textContent = touch ? `Drag to orbit · pinch to zoom · ${action.replace(/^click/, 'tap')}`
      : `Drag to orbit · scroll to zoom · ${action}`;
  }

  let selected = -1;
  let fade = 0;
  let move = 0;
  function setOpacities(goal, duration) {
    const from = scene.parts.map((part, i) => mesh.getScene(i).opacity);
    const t0 = performance.now();
    cancelAnimationFrame(fade);
    const step = (now) => {
      const t = reduceMotion ? 1 : Math.min(1, (now - t0) / duration);
      scene.parts.forEach((part, i) => {
        const opacity = from[i] + (goal(i) - from[i]) * ease(t);
        mesh.getScene(i).opacity = opacity;
        mesh.getScene(i).visible = opacity > 0.01; // hidden parts also stop catching clicks
      });
      viewer.forceRenderNextFrame();
      if (t < 1) fade = requestAnimationFrame(step);
    };
    fade = requestAnimationFrame(step);
  }
  function moveCamera(view) {
    if (!view.target || !view.camera || !viewer.controls) return;
    const target0 = viewer.controls.target.clone();
    const camera0 = viewer.camera.position.clone();
    const target1 = target0.clone().fromArray(view.target);
    const camera1 = camera0.clone().fromArray(view.camera);
    const t0 = performance.now();
    cancelAnimationFrame(move);
    const step = (now) => {
      const t = reduceMotion ? 1 : ease(Math.min(1, (now - t0) / 900));
      viewer.controls.target.lerpVectors(target0, target1, t);
      viewer.camera.position.lerpVectors(camera0, camera1, t);
      viewer.forceRenderNextFrame();
      if (t < 1) move = requestAnimationFrame(step);
    };
    move = requestAnimationFrame(step);
  }
  function select(index, withCamera) {
    selected = index;
    if (index >= 0) stage.classList.remove('is-pickable');
    buttons.forEach((button, k) => button.setAttribute('aria-pressed', String(options[k].index === index)));
    setOpacities((i) => (index < 0 || i === index ? 1 : 0), 600);
    if (withCamera) moveCamera(index < 0 ? scene : scene.parts[index]);
  }
  select(-1, false);

  // Find the part at a point in the view (the library's raycaster skips hidden parts).
  function partAt(x, y) {
    const hits = [];
    viewer.raycaster.setFromCameraAndScreenPosition(viewer.camera, { x, y }, { x: stage.offsetWidth, y: stage.offsetHeight });
    viewer.raycaster.intersectSplatMesh(mesh, hits);
    return hits.length ? mesh.getSceneIndexForSplat(hits[0].splatIndex) : -1;
  }
  // A click normally re-centres the view on the clicked point. On a selectable part, select and frame it instead.
  const focusOnPoint = viewer.checkForFocalPointChange;
  viewer.checkForFocalPointChange = function () {
    const index = partAt(viewer.mousePosition.x, viewer.mousePosition.y);
    if (index >= 0 && scene.parts[index].select) {
      if (index !== selected) select(index, true);
      return;
    }
    focusOnPoint.call(viewer);
  };
  // In the whole-scene view, show which parts can be picked.
  let last = 0;
  stage.addEventListener('pointermove', (event) => {
    if (selected >= 0 || event.buttons || event.target.closest('.clip-tabs') || performance.now() - last < 80) return;
    last = performance.now();
    const rect = stage.getBoundingClientRect();
    const index = partAt(event.clientX - rect.left, event.clientY - rect.top);
    stage.classList.toggle('is-pickable', index >= 0 && !!scene.parts[index].select);
  });
}

if (figure && figure.dataset.splat && webgl2()) {
  const stage = figure.querySelector('.splat-stage');
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      start(stage, figure.dataset.splat);
    }
  }, { rootMargin: '200px' });
  observer.observe(stage);
}

// Demo panels (360DVO, WAT3R, NemoSplat): switch between clips and figures; pause videos while off screen.
document.querySelectorAll('.demo-panel').forEach((panel) => {
  const video = panel.querySelector('video');
  const img = panel.querySelector('.demo-stage img');
  panel.querySelectorAll('.clip-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      panel.querySelectorAll('.clip-tab').forEach((t) => t.setAttribute('aria-pressed', String(t === tab)));
      if (tab.dataset.kind === 'video') {
        img.hidden = true;
        video.hidden = false;
        video.poster = tab.dataset.poster || '';
        video.src = tab.dataset.src;
        video.play().catch(() => {});
      } else {
        video.pause();
        video.hidden = true;
        img.src = tab.dataset.src;
        img.hidden = false;
      }
    });
  });
  if (video && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (video.hidden) return;
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      });
    }).observe(video);
  }
});

// Joint figures: play the entrance animation once each figure is about a quarter visible.
document.documentElement.classList.add('js-anim');
const figures = document.querySelectorAll('.diagram');
if ('IntersectionObserver' in window) {
  const figureObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        figureObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });
  figures.forEach((figure) => figureObserver.observe(figure));
} else {
  figures.forEach((figure) => figure.classList.add('in-view'));
}

// 3D/4D Mapping: reveal each panel, step and note as it scrolls into view.
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  reveals.forEach((el) => revealObserver.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in-view'));
}
