/**
 * Sharpline Digital — Insights list
 * Builds the article list on /insights.html from /articles.json,
 * newest first. The newest article gets the dark "★ Latest" card.
 *
 * TO PUBLISH A NEW ARTICLE:
 * Add one entry to articles.json with slug, url, title, desc, date,
 * tags, readTime (e.g. "7 min read") and summary (the 1–2 sentence
 * text shown on the card). Nothing on insights.html needs touching.
 *
 * The cards typed into insights.html are a fallback: they show if this
 * script can't load, and are replaced as soon as it does.
 *
 * TO CONNECT THIS SCRIPT ON A PAGE:
 * <div class="list-wrap" id="insights-list"> ...fallback cards... </div>
 * <script src="/insights-list.js" defer></script>
 */
(function () {
  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function fmtDate(iso) {
    var d = new Date(iso + 'T12:00:00');
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long' });
  }

  function card(a, featured) {
    var label = featured
      ? '<span class="card-featured-flag">&#9733; Latest</span>'
      : '<span class="card-tag">Insight</span>';
    var meta = label +
      '<span class="card-dot"></span><span class="card-date">' + esc(fmtDate(a.date)) + '</span>';
    if (a.readTime) {
      meta += '<span class="card-dot"></span><span class="card-date">' + esc(a.readTime) + '</span>';
    }
    return '<a href="' + esc(a.url) + '" class="article-card' + (featured ? ' featured' : '') + '">' +
      '<div class="card-meta">' + meta + '</div>' +
      '<div class="card-title">' + esc(a.title) + '</div>' +
      '<p class="card-desc">' + esc(a.summary || a.desc) + '</p>' +
      '<span class="card-read-more">Read article &#8594;</span>' +
    '</a>';
  }

  function init() {
    var box = document.getElementById('insights-list');
    if (!box) return;
    fetch('/articles.json')
      .then(function (res) {
        if (!res.ok) throw new Error('articles.json request failed: ' + res.status);
        return res.json();
      })
      .then(function (all) {
        if (!all.length) return;
        var sorted = all.slice().sort(function (a, b) {
          return new Date(b.date) - new Date(a.date);
        });
        box.innerHTML = sorted.map(function (a, i) { return card(a, i === 0); }).join('');
      })
      .catch(function (err) {
        console.error('Insights list failed to load:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
