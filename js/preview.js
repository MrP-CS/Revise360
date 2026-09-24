// A silent homepage preview. Reduced-motion visitors start with the still poster.
(() => {
  const video = document.getElementById('experiencePreview');
  const toggle = document.getElementById('previewToggle');
  if (!video || !toggle) return;

  const sync = () => {
    const action = video.paused ? 'Play' : 'Pause';
    toggle.textContent = action;
    toggle.setAttribute('aria-label', `${action} video preview`);
  };
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  video.addEventListener('error', () => { toggle.hidden = true; });
  toggle.addEventListener('click', () => {
    if (video.paused) { video.play().then(sync).catch(sync); sync(); }
    else { video.pause(); sync(); }
  });

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) video.play().catch(sync);
  sync();
})();
