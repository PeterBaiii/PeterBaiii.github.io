// Background orrery: a slow solar system (Pluto included) drawn behind the
// page, plus a button that hides the page to show the whole background.
// Shown in the margins on desktop; a single still frame under
// prefers-reduced-motion.
(function () {
  var canvas = document.querySelector('.cosmos');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TAU = Math.PI * 2;
  var INK = '36, 76, 100'; // --accent
  var LABEL = 'rgba(100, 112, 125, 0.75)'; // --text-muted
  var EARTH_PERIOD = 40; // seconds per displayed orbit of Earth

  // Deliberately not to scale: orbit radius grows with sqrt(au), periods with
  // period^0.35, and sizes are exaggerated, but every planet still differs.
  // au: orbit radius in AU; period in years; size in px at scale 1.
  var PLANETS = [
    { name: 'Mercury', au: 0.39, period: 0.24, size: 3.5, color: '#a39e97' },
    { name: 'Venus', au: 0.72, period: 0.62, size: 5.5, color: '#d6b98c' },
    { name: 'Earth', au: 1, period: 1, size: 6, color: '#5b8db0' },
    { name: 'Mars', au: 1.52, period: 1.88, size: 4.5, color: '#c27c5b' },
    { name: 'Jupiter', au: 5.2, period: 11.86, size: 14, color: '#c9a27e' },
    { name: 'Saturn', au: 9.58, period: 29.46, size: 12, color: '#d4bd8c', ring: true },
    { name: 'Uranus', au: 19.2, period: 84, size: 9, color: '#8ec1c7' },
    { name: 'Neptune', au: 30.1, period: 164.8, size: 8.5, color: '#4f72a8' },
    // Eccentric orbit whose perihelion falls inside Neptune's; its direction
    // is set in layout().
    { name: 'Pluto', au: 39.5, period: 248, size: 2.8, color: '#b5a596', e: 0.25 }
  ];
  PLANETS.forEach(function (p, i) {
    p.speed = TAU / (EARTH_PERIOD * Math.pow(p.period, 0.35));
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

  // tilt: vertical squash of the orbital plane, as if viewed at an angle, so
  // the orbits match the screen's shape (1 = seen from straight above).
  var width = 0, height = 0, sunX = 0, sunY = 0, tilt = 1, scale = 1, starCount = 0;
  var running = false, looping = false, lastFrame = 0;

  function layout() {
    var dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var navbar = document.querySelector('.navbar');
    var top = navbar ? navbar.offsetHeight : 0;
    sunX = width / 2;
    sunY = top + (height - top) / 2;

    // Neptune's orbit spans most of the screen; the rest scale from it.
    var halfW = width / 2, halfH = (height - top) / 2;
    tilt = Math.min(1, Math.max(0.45, halfH / halfW));
    var planeH = halfH / tilt; // screen half-height, measured in the orbital plane
    var neptune = 0.8 * Math.min(halfW, planeH);
    var unit = neptune / Math.sqrt(30.1);
    PLANETS.forEach(function (p) {
      p.a = unit * Math.sqrt(p.au);
      // Point Pluto's aphelion at the lower-right corner, the roomiest
      // direction, so its whole orbit stays on screen.
      if (p.e) p.perihelion = Math.PI - Math.atan2(planeH, halfW);
    });
    scale = Math.min(1.25, Math.max(0.6, neptune / 650));

    starCount = Math.min(STARS.length, Math.round(width * height / 9000));
  }

  // Point on an orbit at eccentric anomaly E, projected onto the screen.
  function project(p, E) {
    var e = p.e || 0;
    var px = p.a * (Math.cos(E) - e);
    var py = p.a * Math.sqrt(1 - e * e) * Math.sin(E);
    var w = p.perihelion || 0;
    var x = px * Math.cos(w) - py * Math.sin(w);
    var y = px * Math.sin(w) + py * Math.cos(w);
    return { x: sunX + x, y: sunY - y * tilt };
  }

  function position(p, t) {
    var m = p.phase + p.speed * t;
    if (!p.e) return project(p, m);
    // Kepler's equation, so Pluto speeds up near perihelion.
    var E = m;
    for (var k = 0; k < 4; k++) E -= (E - p.e * Math.sin(E) - m) / (1 - p.e * Math.cos(E));
    return project(p, E);
  }

  function drawOrbit(p) {
    ctx.beginPath();
    if (p.e) {
      ctx.setLineDash([2, 5]);
      for (var k = 0; k <= 240; k++) {
        var pt = project(p, TAU * k / 240);
        if (k === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
    } else {
      ctx.ellipse(sunX, sunY, p.a, p.a * tilt, 0, 0, TAU);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawPlanet(p, pos) {
    var size = p.size * scale;
    if (p.ring) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, size * 2.1, size * 0.65, -0.35, 0, TAU);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, TAU);
    ctx.fill();
    ctx.fillStyle = LABEL;
    ctx.fillText(p.name, pos.x + (p.ring ? size * 2.1 : size) + 6, pos.y + 4);
  }

  function drawSun() {
    var glowRadius = 85 * scale;
    var glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowRadius);
    glow.addColorStop(0, 'rgba(228, 179, 99, 0.35)');
    glow.addColorStop(1, 'rgba(228, 179, 99, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, glowRadius, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e2b25e';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 18 * scale, 0, TAU);
    ctx.fill();
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

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(' + INK + ', 0.18)';
    PLANETS.forEach(drawOrbit);

    // Planets on the far side of the tilted plane pass behind the sun.
    ctx.font = 'italic 11px Georgia, serif';
    var placed = PLANETS.map(function (p) { return { p: p, pos: position(p, t) }; });
    placed.forEach(function (o) { if (o.pos.y < sunY) drawPlanet(o.p, o.pos); });
    drawSun();
    placed.forEach(function (o) { if (o.pos.y >= sunY) drawPlanet(o.p, o.pos); });
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
    // Hidden on small screens (style.css) unless the page is hidden too.
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

  // Button that hides the page so the whole background is visible.
  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'cosmos-toggle';
  toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="5"></circle>' +
    '<ellipse cx="12" cy="12" rx="10.5" ry="3.5" transform="rotate(-25 12 12)"></ellipse></svg>';
  document.body.appendChild(toggle);

  function setBackgroundOnly(on) {
    root.classList.toggle('cosmos-only', on);
    var label = on ? 'Back to the page' : 'Show the background only';
    toggle.setAttribute('aria-pressed', String(on));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    start();
  }

  toggle.addEventListener('click', function () {
    setBackgroundOnly(!root.classList.contains('cosmos-only'));
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && root.classList.contains('cosmos-only')) setBackgroundOnly(false);
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 150);
  });

  setBackgroundOnly(false);
})();
