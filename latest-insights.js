/**
 * Sharpline Digital — Latest Insights
 * Fills the "From our Insights" section on the city pages with the newest
 * articles from /articles.json. Publish a new article (add it to
 * articles.json) and every city page picks it up automatically.
 *
 * HOW MANY: the 3 newest, by "date".
 *
 * TO CONNECT THIS SCRIPT ON A PAGE:
 * <div id="latest-insights"></div>
 * <script src="/latest-insights.js" defer></script>
 *
 * The "Browse all Insights" link sits in the page's own HTML, so the page
 * still links to /insights.html if this script fails to load.
 */
(function () {
  var COUNT = 3;

  var css =
    '.li-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2rem;margin-top:2rem;}' +
    '.li-card{display:flex;flex-direction:column;background:#fff;border:1px solid var(--border,#dde8f0);' +
      'border-radius:10px;padding:1.5rem;text-decoration:none;transition:border-color .2s,transform .2s;}' +
    '.li-card:hover{border-color:var(--teal,#2ec4a9);transform:translateY(-2px);}' +
    '.li-date{font-size:.75rem;color:var(--text-mid,#5a7a8a);margin-bottom:.6rem;}' +
    '.li-title{font-family:"Outfit",sans-serif;font-weight:700;font-size:1.05rem;line-height:1.3;' +
      'color:var(--navy,#0a1628);margin-bottom:.6rem;}' +
    '.li-desc{font-size:.88rem;line-height:1.55;color:#2a3a4a;font-weight:300;flex:1;}' +
    '.li-more{margin-top:1rem;font-size:.85rem;font-weight:500;color:var(--navy,#0a1628);}' +
    '@media (max-width:820px){.li-grid{grid-template-columns:1fr;}}';

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

  function render(articles) {
    var box = document.getElementById('latest-insights');
    if (!box || !articles.length) return;

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var html = '<div class="li-grid">';
    articles.forEach(function (a) {
      html +=
        '<a class="li-card" href="' + esc(a.url) + '">' +
          '<div class="li-date">' + esc(fmtDate(a.date)) + '</div>' +
          '<div class="li-title">' + esc(a.title) + '</div>' +
          '<div class="li-desc">' + esc(a.desc) + '</div>' +
          '<div class="li-more">Read the article &rarr;</div>' +
        '</a>';
    });
    html += '</div>';
    box.innerHTML = html;
  }

  function init() {
    fetch('/articles.json')
      .then(function (res) {
        if (!res.ok) throw new Error('articles.json request failed: ' + res.status);
        return res.json();
      })
      .then(function (all) {
        var newest = all.slice().sort(function (a, b) {
          return new Date(b.date) - new Date(a.date);
        }).slice(0, COUNT);
        render(newest);
      })
      .catch(function (err) {
        console.error('Latest insights failed to load:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
