// Background orrery: a slow solar system (Pluto included) drawn behind the
// content panel, so the outer orbits show in the page margins.
// Desktop only; a single still frame under prefers-reduced-motion.
(function () {
  var canvas = document.querySelector('.cosmos');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TAU = Math.PI * 2;
  var INK = '36, 76, 100'; // --accent
  var LABEL = 'rgba(100, 112, 125, 0.75)'; // --text-muted
  var EARTH_PERIOD = 60; // seconds per displayed orbit of Earth

  // Real periods in years. Displayed periods are compressed (sqrt) so the
  // outer planets still visibly move. Orbit radii are set in layout().
  var PLANETS = [
    { name: 'Mercury', period: 0.24, size: 2.5, color: '#a39e97' },
    { name: 'Venus', period: 0.62, size: 3.5, color: '#d6b98c' },
    { name: 'Earth', period: 1, size: 3.8, color: '#5b8db0' },
    { name: 'Mars', period: 1.88, size: 3, color: '#c27c5b' },
    { name: 'Jupiter', period: 11.86, size: 8, color: '#c9a27e' },
    { name: 'Saturn', period: 29.46, size: 6.5, color: '#d4bd8c', ring: true },
    { name: 'Uranus', period: 84, size: 5, color: '#8ec1c7' },
    { name: 'Neptune', period: 164.8, size: 5, color: '#4f72a8' },
    // Eccentric orbit whose perihelion falls just inside Neptune's.
    { name: 'Pluto', period: 248, size: 2.2, color: '#b5a596', e: 0.25, perihelion: 2.2 }
  ];
  PLANETS.forEach(function (p, i) {
    p.speed = TAU / (EARTH_PERIOD * Math.sqrt(p.period));
    p.phase = i * 2.4; // spread the planets out
  });

  // Fixed seed so the star field is identical on every page.
  var seed = 20261108;
  function random() {
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  var STARS = [];
  for (var i = 0; i < 160; i++) {
    STARS.push({
      x: random(), y: random(),
      r: 0.5 + random() * 0.9,
      alpha: 0.12 + random() * 0.22,
      twinkle: 0.4 + random() * 1.2,
      phase: random() * TAU
    });
  }

  var width = 0, height = 0, sunX = 0, sunY = 0, starCount = 0;
  var running = false, looping = false, lastFrame = 0;

  function layout() {
    var dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var navbar = document.querySelector('.navbar');
    var panel = document.querySelector('.content');
    var top = navbar ? navbar.offsetHeight : 0;
    sunX = width / 2;
    sunY = top + (height - top) / 2;

    // Jupiter's orbit starts just outside the content panel; the outer
    // planets spread from there toward the edges of the screen.
    var inner = (panel ? panel.offsetWidth : 0) / 2 + 24;
    var outer = Math.max(inner + 200, 0.4 * width);
    var step = (outer - inner) / 3;
    var radii = [0.22 * inner, 0.36 * inner, 0.5 * inner, 0.66 * inner,
      inner, inner + step, inner + 2 * step, outer, 1.15 * outer];
    PLANETS.forEach(function (p, i) { p.a = radii[i]; });

    starCount = Math.min(STARS.length, Math.round(width * height / 9000));
  }

  function position(p, t) {
    var m = p.phase + p.speed * t;
    if (!p.e) {
      return { x: sunX + p.a * Math.cos(m), y: sunY - p.a * Math.sin(m) };
    }
    // Kepler's equation, so Pluto speeds up near perihelion.
    var E = m;
    for (var k = 0; k < 4; k++) E -= (E - p.e * Math.sin(E) - m) / (1 - p.e * Math.cos(E));
    var px = p.a * (Math.cos(E) - p.e);
    var py = p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(E);
    var c = Math.cos(p.perihelion), s = Math.sin(p.perihelion);
    return { x: sunX + px * c - py * s, y: sunY - (px * s + py * c) };
  }

  function drawOrbit(p) {
    ctx.beginPath();
    if (p.e) {
      var b = p.a * Math.sqrt(1 - p.e * p.e);
      var cx = sunX - p.a * p.e * Math.cos(p.perihelion);
      var cy = sunY + p.a * p.e * Math.sin(p.perihelion);
      ctx.setLineDash([2, 5]);
      ctx.ellipse(cx, cy, p.a, b, -p.perihelion, 0, TAU);
    } else {
      ctx.arc(sunX, sunY, p.a, 0, TAU);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < starCount; i++) {
      var star = STARS[i];
      var alpha = star.alpha + (reduceMotion ? 0 : 0.1 * Math.sin(t * star.twinkle + star.phase));
      ctx.fillStyle = 'rgba(' + INK + ', ' + Math.max(alpha, 0.04).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.r, 0, TAU);
      ctx.fill();
    }

    var glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 70);
    glow.addColorStop(0, 'rgba(228, 179, 99, 0.35)');
    glow.addColorStop(1, 'rgba(228, 179, 99, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 70, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e2b25e';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 12, 0, TAU);
    ctx.fill();

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(' + INK + ', 0.18)';
    PLANETS.forEach(drawOrbit);

    ctx.font = 'italic 11px Georgia, serif';
    PLANETS.forEach(function (p) {
      var pos = position(p, t);
      if (p.ring) {
        ctx.strokeStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y, p.size * 2, p.size * 0.6, -0.35, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, TAU);
      ctx.fill();
      ctx.fillStyle = LABEL;
      ctx.fillText(p.name, pos.x + p.size + 5, pos.y + 4);
    });
  }

  // Wall-clock time keeps the planets where they were across page loads.
  function now() {
    return Date.now() / 1000;
  }

  function frame(stamp) {
    if (!running) {
      looping = false;
      return;
    }
    if (stamp - lastFrame >= 33) { // ~30 fps is plenty for this pace
      lastFrame = stamp;
      draw(now());
    }
    window.requestAnimationFrame(frame);
  }

  function start() {
    // Hidden on small screens (style.css), where the panel fills the page.
    var visible = getComputedStyle(canvas).display !== 'none';
    running = visible && !reduceMotion;
    if (!visible) return;
    layout();
    draw(now());
    canvas.classList.add('is-ready');
    if (running && !looping) {
      looping = true;
      window.requestAnimationFrame(frame);
    }
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 150);
  });

  start();
})();
