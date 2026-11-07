// Nonessential timeline enhancement. All text is available without JavaScript.
const timeline = document.querySelectorAll('.timeline-item');
if (timeline.length && 'IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.classList.toggle('is-current', entry.isIntersecting);
    }
  }, { rootMargin: '-25% 0px -35% 0px', threshold: 0 });
  timeline.forEach((item) => observer.observe(item));
}


// Sketchfab is loaded only by an explicit visitor action. No iframe is present
// in the initial HTML, preserving page speed, source readability, and consent.
const vehicleExhibit = document.querySelector('[data-vehicle-exhibit]');
const vehicleLaunch = vehicleExhibit?.querySelector('[data-load-vehicle]');
if (vehicleExhibit && vehicleLaunch) {
  vehicleLaunch.addEventListener('click', () => {
    const viewer = vehicleExhibit.querySelector('[data-vehicle-viewer]');
    const placeholder = vehicleExhibit.querySelector('[data-vehicle-placeholder]');
    if (!viewer || !placeholder || viewer.querySelector('iframe')) return;

    const frame = document.createElement('iframe');
    frame.title = 'Porsche 356 Speedster 3D model by Virtualgeo s.r.l. on Sketchfab';
    frame.src = 'https://sketchfab.com/models/27468cdce6fe444f86341858f49846af/embed';
    frame.allow = 'autoplay; fullscreen; xr-spatial-tracking';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.loading = 'lazy';
    frame.setAttribute('aria-label', 'Interactive 3D Porsche 356 Speedster viewer');
    viewer.hidden = false;
    viewer.appendChild(frame);
    placeholder.hidden = true;
    frame.focus({ preventScroll: true });
  });
}
