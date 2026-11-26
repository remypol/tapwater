(function() {
  // Prevent double execution
  if (window.__tapwater_widget_loaded) return;
  window.__tapwater_widget_loaded = true;

  // Same origin as this script, so a copy served from a preview or local build talks to itself.
  var ORIGIN = (function() {
    try { return new URL(document.currentScript.src).origin; } catch (e) { return 'https://www.tapwater.uk'; }
  })();
  var API = ORIGIN + '/api/widget/';

  function esc(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function scoreColor(score) {
    if (score >= 7) return '#16a34a';
    if (score >= 4) return '#d97706';
    return '#dc2626';
  }

  function gradeLabel(score) {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Fair';
    if (score >= 3) return 'Poor';
    return 'Very Poor';
  }

  function isDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function render(el, d) {
    var dark = el.getAttribute('data-tapwater-theme') === 'dark' ||
      (el.getAttribute('data-tapwater-theme') !== 'light' && isDark());

    var bg = dark ? '#1e293b' : '#ffffff';
    var text = dark ? '#f1f5f9' : '#0c0f17';
    var sub = dark ? '#94a3b8' : '#6b7280';
    var faint = dark ? '#64748b' : '#9ca3af';
    var border = dark ? '#334155' : '#e5e7eb';
    var divider = dark ? '#1e293b' : '#f3f4f6';

    var color = scoreColor(d.score);
    var grade = gradeLabel(d.score);
    var scoreText = d.score >= 0 ? d.score.toFixed(1) : '—';

    el.innerHTML = '<div style="font-family:system-ui,-apple-system,sans-serif;border:1px solid ' + border + ';border-radius:12px;padding:16px 20px;max-width:320px;background:' + bg + ';">'
      + '<div style="display:flex;align-items:center;gap:12px;">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:' + (d.score >= 0 ? color : '#6b7280') + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:' + (d.score >= 0 ? '18' : '24') + 'px;flex-shrink:0;">' + scoreText + '</div>'
      + '<div style="min-width:0;">'
      + '<div style="font-weight:600;font-size:15px;color:' + text + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(d.district) + ' \u2014 ' + esc(d.areaName) + '</div>'
      + '<div style="font-size:13px;color:' + sub + ';">' + (d.score >= 0 ? grade + ' \u00b7 ' : '') + d.contaminantsTested + ' contaminants tested</div>'
      + '</div>'
      + '</div>'
      + '<div style="margin-top:10px;padding-top:10px;border-top:1px solid ' + divider + ';display:flex;justify-content:space-between;align-items:center;">'
      + '<span style="font-size:11px;color:' + faint + ';">Data: ' + esc(d.lastUpdated) + '</span>'
      + '<a href="' + esc(d.url) + '" target="_blank" rel="noopener" style="font-size:11px;color:#0891b2;text-decoration:none;font-weight:500;">Powered by TapWater.uk \u2192</a>'
      + '</div>'
      + '</div>';
  }

  function loading(el) {
    el.innerHTML = '<div style="font-family:system-ui;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;max-width:320px;display:flex;align-items:center;gap:12px;">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:#f3f4f6;animation:tapwater-pulse 1.5s ease-in-out infinite;flex-shrink:0;"></div>'
      + '<div><div style="width:140px;height:14px;background:#f3f4f6;border-radius:4px;animation:tapwater-pulse 1.5s ease-in-out infinite;"></div>'
      + '<div style="width:100px;height:12px;background:#f3f4f6;border-radius:4px;margin-top:6px;animation:tapwater-pulse 1.5s ease-in-out infinite;"></div></div>'
      + '</div>';
  }

  // Inject pulse animation
  var style = document.createElement('style');
  style.textContent = '@keyframes tapwater-pulse{0%,100%{opacity:1}50%{opacity:.4}}';
  document.head.appendChild(style);

  var elements = document.querySelectorAll('[data-tapwater-postcode]');

  elements.forEach(function(el) {
    var postcode = el.getAttribute('data-tapwater-postcode');
    if (!postcode || el.getAttribute('data-tapwater-rendered')) return;
    el.setAttribute('data-tapwater-rendered', 'true');

    loading(el);

    fetch(API + encodeURIComponent(postcode))
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.error) {
          el.innerHTML = '<p style="font-family:system-ui;font-size:13px;color:#9ca3af;">Water quality data not available for this postcode.</p>';
          return;
        }
        render(el, d);
      })
      .catch(function() {
        el.innerHTML = '<p style="font-family:system-ui;font-size:13px;color:#9ca3af;">Unable to load water quality data.</p>';
      });
  });

  /* ── Hardness checker ──────────────────────────────────────────────────────
   * <div data-tapwater-checker
   *      data-tapwater-hard-text="At {mgl} mg/L your water is {label}. This filter is made for it."
   *      data-tapwater-hard-link="https://shop.example/filter" data-tapwater-hard-cta="Shop the filter"
   *      data-tapwater-soft-text="At {mgl} mg/L your water is {label}." data-tapwater-threshold="200"
   *      data-tapwater-accent="#0e7490" data-tapwater-key="tw_live_…"></div>
   * Placeholders: {mgl} {label} {district} {area}. Fires a bubbling "tapwater:result"
   * event with the response, for the host site's analytics.
   */
  var BANDS = [
    { to: 60, name: 'Soft' }, { to: 120, name: 'Moderately soft' }, { to: 180, name: 'Moderately hard' },
    { to: 250, name: 'Hard' }, { to: 9999, name: 'Very hard' }
  ];
  var BAND_COLOURS = ['#38bdf8', '#2dd4bf', '#facc15', '#fb923c', '#ef4444'];

  function fill(tpl, d) {
    return esc(tpl)
      .replace(/\{mgl\}/g, String(d.hardness.mgPerLitre))
      .replace(/\{label\}/g, esc(d.hardness.label))
      .replace(/\{district\}/g, esc(d.district))
      .replace(/\{area\}/g, esc(d.areaName || d.district));
  }

  function safeLink(href) {
    try { var u = new URL(href, location.href); return /^https?:$/.test(u.protocol) ? u.href : null; } catch (e) { return null; }
  }

  function checkerCss(accent, dark) {
    var ink = dark ? '#f1f5f9' : '#0f172a', sub = dark ? '#94a3b8' : '#475569', line = dark ? '#334155' : '#e2e8f0';
    var bg = dark ? '#0f172a' : '#ffffff', field = dark ? '#1e293b' : '#f8fafc';
    return ':host{all:initial;display:block;font-family:inherit}'
      + '*{box-sizing:border-box;font-family:inherit}'
      + '.box{max-width:460px;border:1px solid ' + line + ';border-radius:16px;background:' + bg + ';color:' + ink + ';padding:20px 20px 16px;line-height:1.45}'
      + 'h3{margin:0 0 12px;font-size:17px;font-weight:650;letter-spacing:-0.01em}'
      + 'form{display:flex;gap:8px}'
      + 'input{flex:1;min-width:0;font-size:16px;padding:11px 14px;border-radius:10px;border:1px solid ' + line + ';background:' + field + ';color:' + ink + ';text-transform:uppercase}'
      + 'input::placeholder{text-transform:none;color:' + sub + '}'
      + 'input:focus,button:focus-visible,a:focus-visible{outline:2px solid ' + accent + ';outline-offset:2px}'
      + 'button{font-size:15px;font-weight:600;padding:11px 18px;border-radius:10px;border:0;background:' + accent + ';color:#fff;cursor:pointer;white-space:nowrap}'
      + 'button[disabled]{opacity:.6;cursor:progress}'
      + '.out{margin-top:16px}'
      + '.num{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}'
      + '.mgl{font-size:40px;font-weight:700;letter-spacing:-0.03em;line-height:1;font-variant-numeric:tabular-nums}'
      + '.mgl small{font-size:15px;font-weight:600;color:' + sub + ';letter-spacing:0;margin-left:4px}'
      + '.pill{font-size:13px;font-weight:650;padding:3px 10px;border-radius:999px;color:#0f172a}'
      + '.scale{position:relative;display:flex;gap:3px;margin:14px 0 6px;height:8px}'
      + '.scale span{flex:1;border-radius:4px;opacity:.35}.scale span.on{opacity:1}'
      + '.mark{position:absolute;top:-5px;width:4px;height:18px;border-radius:2px;background:' + ink + ';transform:translateX(-2px)}'
      + '.ends{display:flex;justify-content:space-between;font-size:12px;color:' + sub + '}'
      + '.where{font-size:13px;color:' + sub + ';margin-top:10px}'
      + '.msg{font-size:15px;margin:12px 0 0}'
      + '.cta{display:inline-block;margin-top:12px;font-size:15px;font-weight:600;padding:10px 16px;border-radius:10px;background:' + accent + ';color:#fff;text-decoration:none}'
      + '.err{font-size:14px;color:' + sub + ';margin-top:12px}'
      + '.by{margin-top:14px;padding-top:10px;border-top:1px solid ' + line + ';font-size:12px;color:' + sub + '}'
      + '.by a{color:' + sub + '}';
  }

  function initChecker(el) {
    if (el.getAttribute('data-tapwater-rendered')) return;
    el.setAttribute('data-tapwater-rendered', 'true');
    var attr = function(n) { return el.getAttribute('data-tapwater-' + n); };
    var dark = attr('theme') === 'dark' || (attr('theme') !== 'light' && isDark());
    var accent = /^#[0-9a-f]{3,8}$/i.test(attr('accent') || '') ? attr('accent') : '#0e7490';
    var threshold = Number(attr('threshold')) || 200;
    var root = el.attachShadow ? el.attachShadow({ mode: 'open' }) : el;
    var uid = 'tw' + Math.random().toString(36).slice(2, 8);
    root.innerHTML = '<style>' + checkerCss(accent, dark) + '</style>'
      + '<div class="box"><h3>' + esc(attr('heading') || 'How hard is your water?') + '</h3>'
      + '<form novalidate><label for="' + uid + '" style="position:absolute;left:-9999px">Postcode</label>'
      + '<input id="' + uid + '" name="postcode" autocomplete="postal-code" placeholder="Your postcode, e.g. RG1 2AB" maxlength="9">'
      + '<button type="submit">Check</button></form>'
      + '<div class="out" aria-live="polite"></div></div>';
    var form = root.querySelector('form'), input = root.querySelector('input'), btn = root.querySelector('button'), out = root.querySelector('.out');

    function by(show) {
      return show ? '<div class="by">Hardness data: <a href="https://www.tapwater.uk/hardness" target="_blank" rel="noopener">TapWater.uk</a>, from water company tests</div>' : '';
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var pc = input.value.trim();
      if (!pc) { input.focus(); return; }
      btn.disabled = true;
      var q = ORIGIN + '/api/checker?postcode=' + encodeURIComponent(pc) + (attr('key') ? '&key=' + encodeURIComponent(attr('key')) : '');
      fetch(q).then(function(r) { return r.json(); }).then(function(d) {
        btn.disabled = false;
        if (d.error) { out.innerHTML = '<p class="err">' + esc(d.error) + '</p>' + by(true); return; }
        var v = d.hardness.mgPerLitre, bi = 0;
        while (bi < BANDS.length - 1 && v >= BANDS[bi].to) bi++;
        var pos = Math.min(100, Math.max(0, v / 400 * 100));
        var hard = v >= threshold;
        var text = attr(hard ? 'hard-text' : 'soft-text');
        var link = safeLink(attr(hard ? 'hard-link' : 'soft-link') || '');
        var cta = attr(hard ? 'hard-cta' : 'soft-cta');
        var segs = '';
        for (var i = 0; i < BANDS.length; i++) segs += '<span class="' + (i === bi ? 'on' : '') + '" style="background:' + BAND_COLOURS[i] + '"></span>';
        out.innerHTML = '<div class="num"><span class="mgl">' + v + '<small>mg/L</small></span>'
          + '<span class="pill" style="background:' + BAND_COLOURS[bi] + '">' + esc(BANDS[bi].name) + '</span></div>'
          + '<div class="scale" aria-hidden="true">' + segs + '<i class="mark" style="left:' + pos + '%"></i></div>'
          + '<div class="ends"><span>Soft</span><span>Very hard</span></div>'
          + '<div class="where">' + esc(d.district) + (d.areaName ? ', ' + esc(d.areaName) : '') + (d.supplier ? '. Supplied by ' + esc(d.supplier) : '')
          + (d.hardness.estimated ? '. No reading for ' + esc(d.district) + ' itself; this is the figure for ' + esc(d.hardness.estimatedFromArea || 'the area') : '') + '.</div>'
          + (text ? '<p class="msg">' + fill(text, d) + '</p>' : '')
          + (link && cta ? '<a class="cta" href="' + esc(link) + '">' + esc(cta) + '</a>' : '')
          + by(d.attribution !== false);
        el.dispatchEvent(new CustomEvent('tapwater:result', { bubbles: true, detail: { district: d.district, mgPerLitre: v, label: d.hardness.label, overThreshold: hard } }));
      }).catch(function() {
        btn.disabled = false;
        out.innerHTML = '<p class="err">Could not reach the hardness service. Try again in a moment.</p>';
      });
    });
  }

  document.querySelectorAll('[data-tapwater-checker]').forEach(initChecker);
})();
