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
