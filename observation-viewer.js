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
    await viewer.addSplatScene(src, { showLoadingUI: false, splatAlphaRemovalThreshold: 5 });
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
