// Visitor counter ("You are visitor #N") on pages with `counter: true`.
// The counting service (vercount.one) only receives this page's address and
// whether this browser is new, and its reply is written back as plain text,
// so the service can never run code on this site. To switch services, change
// ENDPOINT, and parse() if the new service replies in another format.
(function () {
  var ENDPOINT = 'https://events.vercount.one/api/v2/log';
  var TIMEOUT = 5000;
  var CACHE_KEY = 'visitor-count';
  // The cookie Vercount's own script used, so the visitors it already counted
  // are not counted again.
  var SEEN_COOKIE = 'vercount_uv_' + location.host.replace(/[^a-zA-Z0-9_-]/g, '_');

  var box = document.querySelector('.visitor-count');
  var value = document.getElementById('visitor-count');
  if (!box || !value || !window.fetch || !window.JSON) return;

  // Reply: {"status": "success", "data": {"site_uv": 123, ...}}.
  function parse(reply) {
    var data = reply && reply.status !== 'error' ? reply.data || reply : null;
    var n = data ? Number(data.site_uv) : NaN;
    return isFinite(n) && n >= 1 ? Math.floor(n) : null;
  }

  function show(n) {
    value.textContent = String(n);
    box.hidden = false;
  }

  // Show the last known count at once; the request below updates it.
  try {
    var last = parse({ site_uv: localStorage.getItem(CACHE_KEY) });
    if (last) show(last);
  } catch (e) {}

  var isNew = ('; ' + document.cookie).indexOf('; ' + SEEN_COOKIE + '=1') === -1;
  var controller = window.AbortController ? new AbortController() : null;
  var timer = controller && setTimeout(function () { controller.abort(); }, TIMEOUT);

  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Origin and path only: no query string or #fragment.
    body: JSON.stringify({ url: location.origin + location.pathname, isNewUv: isNew }),
    signal: controller ? controller.signal : undefined
  }).then(function (response) {
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  }).then(function (reply) {
    var n = parse(reply);
    if (!n) return;
    show(n);
    // Mark this browser as counted only once the count went through.
    if (isNew) document.cookie = SEEN_COOKIE + '=1; path=/; max-age=31536000; samesite=lax';
    try { localStorage.setItem(CACHE_KEY, String(n)); } catch (e) {}
  }).catch(function () {
    // Service unreachable: keep the cached count, or nothing.
  }).then(function () {
    clearTimeout(timer);
  });
})();
