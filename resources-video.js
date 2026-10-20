// Resources: looping video thumbnails (data-loop-thumb) load and play only while on screen and pause when they leave
// it; with reduced motion they keep their still poster. See resources.css for their layout.
(() => {
  const videos = document.querySelectorAll('video[data-loop-thumb]');
  if (!videos.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) {
    videos.forEach((video) => video.play().catch(() => {}));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.play().catch(() => {});
      else entry.target.pause();
    });
  }, { rootMargin: '200px 0px' });
  videos.forEach((video) => observer.observe(video));
})();
