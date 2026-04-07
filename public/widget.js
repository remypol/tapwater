(function() {
  var API = 'https://www.tapwater.uk/api/widget/';
  var elements = document.querySelectorAll('[data-tapwater-postcode]');

  elements.forEach(function(el) {
    var postcode = el.getAttribute('data-tapwater-postcode');
    if (!postcode) return;

    fetch(API + encodeURIComponent(postcode))
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.error) { el.innerHTML = '<p style="font-family:system-ui;font-size:14px;color:#666;">Water quality data not available.</p>'; return; }

        var color = d.score >= 7 ? '#16a34a' : d.score >= 4 ? '#d97706' : '#dc2626';
        var grade = d.score >= 9 ? 'Excellent' : d.score >= 7 ? 'Good' : d.score >= 5 ? 'Fair' : d.score >= 3 ? 'Poor' : 'Very Poor';

        el.innerHTML = '<div style="font-family:system-ui,-apple-system,sans-serif;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;max-width:320px;background:#fff;">'
          + '<div style="display:flex;align-items:center;gap:12px;">'
          + '<div style="width:48px;height:48px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;">' + d.score.toFixed(1) + '</div>'
          + '<div>'
          + '<div style="font-weight:600;font-size:15px;color:#0c0f17;">' + d.district + ' — ' + d.areaName + '</div>'
          + '<div style="font-size:13px;color:#6b7280;">' + grade + ' · ' + d.contaminantsTested + ' contaminants tested</div>'
          + '</div>'
          + '</div>'
          + '<div style="margin-top:10px;padding-top:10px;border-top:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:center;">'
          + '<span style="font-size:11px;color:#9ca3af;">Data: ' + d.lastUpdated + '</span>'
          + '<a href="' + d.url + '" target="_blank" rel="noopener" style="font-size:11px;color:#0891b2;text-decoration:none;font-weight:500;">Powered by TapWater.uk →</a>'
          + '</div>'
          + '</div>';
      })
      .catch(function() {
        el.innerHTML = '';
      });
  });
})();
