/* Google reviews — reads /reviews.json and fills:
   - every [data-review-badge] (rating badge under the hero)
   - #google-reviews (review cards above the bottom CTA)
   To add a review, edit reviews.json only. */
(function () {
  var css =
    '.reviews-section{padding:5rem 0;background:#fff;scroll-margin-top:72px}' +
    '.reviews-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-top:2rem}' +
    '.review-card{background:#fff;border:1px solid var(--border,#dde8f0);border-radius:10px;padding:1.6rem 1.7rem;display:flex;flex-direction:column;gap:1rem;box-shadow:0 1px 2px rgba(10,22,40,.04)}' +
    '.review-stars{color:#e8a317;font-size:1.05rem;letter-spacing:2px;line-height:1}' +
    '.review-text{color:var(--text-dark,#0a1628);font-size:.98rem;line-height:1.7;margin:0;flex:1}' +
    '.review-who{display:flex;align-items:center;gap:.8rem}' +
    '.review-avatar{width:40px;height:40px;border-radius:50%;background:var(--navy,#0a1628);color:var(--teal,#2ec4a9);display:flex;align-items:center;justify-content:center;font-family:Outfit,sans-serif;font-weight:700;font-size:1rem;flex-shrink:0}' +
    '.review-name{font-family:Outfit,sans-serif;font-weight:700;font-size:.95rem;color:var(--navy,#0a1628);line-height:1.3}' +
    '.review-meta{font-size:.8rem;color:var(--text-mid,#496675)}' +
    '.reviews-more{margin-top:2rem}' +
    '.reviews-more a{color:var(--navy,#0a1628);font-weight:500;text-underline-offset:3px;text-decoration-color:var(--teal,#2ec4a9)}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function stars(n) {
    n = Math.round(Number(n) || 0);
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  }
  function monthYear(d) {
    var dt = new Date(d + 'T12:00:00');
    if (isNaN(dt)) return '';
    return dt.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
  }

  fetch('/reviews.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d) return;
      var count = d.count + (d.count === 1 ? ' review' : ' reviews');
      var rating = Number(d.rating).toFixed(1);

      document.querySelectorAll('[data-review-badge]').forEach(function (b) {
        var r = b.querySelector('[data-rb-rating]');
        var c = b.querySelector('[data-rb-count]');
        if (r) r.textContent = rating;
        if (c) c.textContent = count;
        b.setAttribute('aria-label', rating + ' out of 5 stars on Google from ' + count);
      });

      var grid = document.getElementById('google-reviews');
      if (grid && d.reviews && d.reviews.length) {
        grid.innerHTML = d.reviews.slice(0, 6).map(function (rv) {
          var meta = [rv.business, monthYear(rv.date)].filter(Boolean).join(' · ');
          return '<figure class="review-card">' +
            '<div class="review-stars" aria-label="' + rv.rating + ' out of 5 stars">' + stars(rv.rating) + '</div>' +
            '<blockquote class="review-text">“' + esc(rv.text) + '”</blockquote>' +
            '<figcaption class="review-who"><span class="review-avatar" aria-hidden="true">' + esc((rv.author || '?').charAt(0)) + '</span>' +
            '<span><span class="review-name">' + esc(rv.author) + '</span><br><span class="review-meta">' + esc(meta) + '</span></span></figcaption>' +
            '</figure>';
        }).join('');
      }
      document.querySelectorAll('[data-google-reviews-link]').forEach(function (a) {
        if (d.googleUrl) a.href = d.googleUrl;
        a.textContent = 'Read all ' + d.count + ' reviews on Google →';
      });
    })
    .catch(function () {});
})();
