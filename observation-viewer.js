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
    const [GaussianSplats3D, THREE] = await Promise.all([import('@mkkellogg/gaussian-splats-3d'), import('three')]);
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
    if (scene.parts.some((part) => part.select)) enableSelection(stage, viewer, scene, THREE);
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
function enableSelection(stage, viewer, scene, THREE) {
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

  let selected = -1;
  let fade = 0;
  let move = 0;
  // The hint says what a click does now: pick a part, or, while one is shown alone, go back to the whole scene.
  function showHint() {
    if (!hint) return;
    const action = selected < 0 ? scene.hint || 'click an object to show it on its own'
      : 'click the background to see the whole scene';
    hint.textContent = `Drag to orbit · ${touch ? 'pinch' : 'scroll'} to zoom · ${touch ? action.replace(/^click/, 'tap') : action}`;
  }
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
    stage.classList.remove('is-pickable', 'is-returnable');
    buttons.forEach((button, k) => button.setAttribute('aria-pressed', String(options[k].index === index)));
    setOpacities((i) => (index < 0 || i === index ? 1 : 0), 600);
    if (withCamera) moveCamera(index < 0 ? scene : scene.parts[index]);
    showHint();
  }
  select(-1, false);

  // Which selectable part is visible at a point in the view. The library's own test treats each splat as a solid ball
  // of its core size, so faint splats in front catch clicks and clicks slip between the rock's few large splats.
  // Instead, follow the ray through every splat it passes (hidden parts are skipped) and blend their opacity front to
  // back as the renderer does; a part counts once it makes up a fair share of that pixel.
  viewer.raycaster.raycastAgainstTrueSplatEllipsoid = true; // candidate splats out to their visible edge
  const colour = new THREE.Vector4();
  const centre = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const local = new THREE.Vector3();
  const heading = new THREE.Vector3();
  function partAt(x, y) {
    viewer.raycaster.setFromCameraAndScreenPosition(viewer.camera, { x, y }, { x: stage.offsetWidth, y: stage.offsetHeight });
    const ray = viewer.raycaster.ray;
    const layers = viewer.raycaster.intersectSplatMesh(mesh, []).map((hit) => {
      mesh.getSplatColor(hit.splatIndex, colour);
      mesh.getSplatCenter(hit.splatIndex, centre);
      mesh.getSplatScaleAndRotation(hit.splatIndex, scale, rotation);
      rotation.invert();
      // In the splat's own frame the Gaussian is a unit sphere: its peak along the ray is at the closest approach.
      local.copy(ray.origin).sub(centre).applyQuaternion(rotation).divide(scale);
      heading.copy(ray.direction).applyQuaternion(rotation).divide(scale);
      const dot = local.dot(heading);
      const nearest = local.lengthSq() - (dot * dot) / heading.lengthSq();
      return {
        depth: centre.sub(ray.origin).dot(ray.direction),
        alpha: Math.min(0.99, (colour.w / 255) * Math.exp(-0.5 * nearest)),
        part: mesh.getSceneIndexForSplat(hit.splatIndex)
      };
    }).sort((a, b) => a.depth - b.depth);
    const share = new Map();
    let transmittance = 1;
    for (const layer of layers) {
      share.set(layer.part, (share.get(layer.part) || 0) + transmittance * layer.alpha);
      transmittance *= 1 - layer.alpha;
      if (transmittance < 0.02) break;
    }
    let best = -1;
    let most = 0.2;
    share.forEach((value, part) => {
      if (scene.parts[part].select && value > most) {
        best = part;
        most = value;
      }
    });
    return best;
  }

  // Clicks and taps are handled here instead of by the library, which re-centres the view on any clicked point.
  // Whole scene: a click on a part selects it, anywhere else keeps the library's re-centring.
  // One part shown alone: a click beside it (on the background) goes back to the whole scene.
  const focusOnPoint = viewer.checkForFocalPointChange;
  viewer.checkForFocalPointChange = () => {};
  let down = null;
  stage.addEventListener('pointerdown', (event) => {
    // A second finger (pinch) cancels the tap.
    down = event.isPrimary && !event.target.closest('.clip-tabs')
      ? { x: event.clientX, y: event.clientY, time: performance.now() } : null;
  });
  stage.addEventListener('pointercancel', () => { down = null; });
  stage.addEventListener('pointerup', (event) => {
    const start = down;
    down = null;
    if (!start || !event.isPrimary || performance.now() - start.time > 500
      || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) return; // a drag, not a click
    const rect = stage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const index = partAt(x, y);
    if (selected >= 0) {
      if (index !== selected) select(-1, true);
    } else if (index >= 0) {
      select(index, true);
    } else {
      viewer.mousePosition.set(x, y);
      focusOnPoint.call(viewer);
    }
  });

  // Cursor: a pointer over a part that can be picked; a zoom-out cursor over the background while one part is shown.
  let last = 0;
  stage.addEventListener('pointermove', (event) => {
    if (event.buttons || event.target.closest('.clip-tabs') || performance.now() - last < 80) return;
    last = performance.now();
    const rect = stage.getBoundingClientRect();
    const index = partAt(event.clientX - rect.left, event.clientY - rect.top);
    stage.classList.toggle('is-pickable', selected < 0 && index >= 0);
    stage.classList.toggle('is-returnable', selected >= 0 && index !== selected);
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

// Page animations (see observation.css): joint figures play their part-by-part entrance, and .reveal blocks and
// .reveal-group items fade in and rise, each once its top edge is a little way up the screen, so the whole page moves
// the same way as it scrolls. Anything already on screen when the page opens is shown as it is, without a flicker.
const animated = document.querySelectorAll('.diagram, .reveal, .reveal-group');
document.querySelectorAll('.reveal-group').forEach((group) => {
  [...group.children].forEach((child, k) => child.style.setProperty('--i', Math.min(k, 5)));
});
animated.forEach((el) => {
  const box = el.getBoundingClientRect();
  if (box.bottom > 0 && box.top < window.innerHeight * 0.88) el.classList.add('in-view');
});
document.documentElement.classList.add('js-anim');
if ('IntersectionObserver' in window) {
  const pageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        pageObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  animated.forEach((el) => { if (!el.classList.contains('in-view')) pageObserver.observe(el); });
} else {
  animated.forEach((el) => el.classList.add('in-view'));
}
