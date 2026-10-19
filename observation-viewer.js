// Direction 01 mapping viewer: loads a Gaussian-splat map into the Photo-SLAM panel once it scrolls into view.
// Uses the vendored GaussianSplats3D build (see vendor/README.md); the page keeps its static placeholder without WebGL 2.
const figure = document.querySelector('.splat-viewer[data-splat]');

function webgl2() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch (err) {
    return false;
  }
}

async function start(stage, src) {
  stage.classList.add('is-loading');
  try {
    const GaussianSplats3D = await import('@mkkellogg/gaussian-splats-3d');
    const mount = stage.querySelector('.splat-canvas');
    const viewer = new GaussianSplats3D.Viewer({
      rootElement: mount,
      cameraUp: [0, 1, 0],
      initialCameraPosition: [3.4, 1.9, 3.4],
      initialCameraLookAt: [0, 0.3, 0],
      sharedMemoryForWorkers: false,
      dynamicScene: false,
      antialiased: true,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
      logLevel: GaussianSplats3D.LogLevel.None
    });
    // GitHub Pages gzips binary files and reports the compressed Content-Length, which stalls the library's own loader.
    // Download the map ourselves (the browser decompresses it) and hand the viewer a local blob of the right size.
    const response = await fetch(src);
    if (!response.ok) throw new Error('map not found');
    const blobUrl = URL.createObjectURL(new Blob([await response.arrayBuffer()]));
    const ext = src.split('?')[0].split('.').pop().toLowerCase();
    const format = { splat: 'Splat', ksplat: 'KSplat', ply: 'Ply', spz: 'Spz' }[ext];
    await viewer.addSplatScene(blobUrl, {
      format: GaussianSplats3D.SceneFormat[format],
      showLoadingUI: false,
      progressiveLoad: false,
      splatAlphaRemovalThreshold: 5
    });
    viewer.start();
    if (viewer.renderer) viewer.renderer.setClearColor(0x0a3550, 1);
    const controls = viewer.controls;
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.addEventListener('start', () => { controls.autoRotate = false; });
    }
    stage.classList.remove('is-loading');
    stage.classList.add('is-ready');
  } catch (err) {
    stage.classList.remove('is-loading');
    stage.classList.add('is-failed');
  }
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
