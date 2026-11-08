// Site behavior: mobile nav, reveal-on-scroll, and the scroll progress bar.
// Pages stay fully readable without this script (see .reveal in style.css).
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile nav: the toggle opens the panel; the mask or Escape closes it.
  var toggle = document.querySelector('.nav-toggle');
  var mask = document.querySelector('.nav-mask');

  function setNavOpen(open) {
    root.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setNavOpen(!root.classList.contains('nav-open'));
    });
    mask.addEventListener('click', function () {
      setNavOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setNavOpen(false);
    });
  }

  // Fade each block in once, the first time it enters the viewport.
  var blocks = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    blocks.forEach(function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -5% 0px' });
    blocks.forEach(function (el) {
      observer.observe(el);
    });
  }
  root.classList.add('reveal-ready');

  // Scroll progress bar, hidden when the page has nothing to scroll.
  var bar = document.querySelector('.scroll-progress');
  if (!bar || reduceMotion) return;

  var pending = false;
  function updateProgress() {
    pending = false;
    var max = root.scrollHeight - window.innerHeight;
    bar.hidden = max <= 0;
    if (max > 0) {
      bar.style.transform = 'scaleX(' + Math.min(window.scrollY / max, 1) + ')';
    }
  }
  function requestUpdate() {
    if (!pending) {
      pending = true;
      window.requestAnimationFrame(updateProgress);
    }
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  updateProgress();
})();
