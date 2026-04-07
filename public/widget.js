(function() {
  // Prevent double execution
  if (window.__tapwater_widget_loaded) return;
  window.__tapwater_widget_loaded = true;

  var API = 'https://www.tapwater.uk/api/widget/';

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
})();
