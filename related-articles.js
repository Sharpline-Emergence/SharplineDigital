/**
 * Sharpline Digital — Related Articles
 * Renders the "Also from Sharpline Digital" card at the bottom of each
 * Insights article, driven entirely by /articles.json.
 *
 * HOW IT PICKS THE RELATED ARTICLE:
 * 1. If the current article has a "pinnedRelated" slug set in articles.json,
 *    that article is always used — this is how manual pairing overrides work.
 * 2. Otherwise, it scores every other article by number of shared tags and
 *    picks the highest-scoring match (ties broken by most recent date).
 *
 * TO ADD A NEW ARTICLE:
 * Just add one entry to articles.json with a slug, title, desc, date, and
 * tags array. Every existing article becomes eligible to link to it
 * automatically — nothing else needs to be touched.
 *
 * TO CONNECT THIS SCRIPT ON A PAGE:
 * <div id="also-read-placeholder"></div>
 * <script src="/related-articles.js"></script>
 */
(function () {
  function currentSlug() {
    var path = window.location.pathname;
    var file = path.substring(path.lastIndexOf('/') + 1);
    return file.replace(/\.html$/, '');
  }

  function scoreMatch(current, candidate) {
    var currentTags = current.tags || [];
    var candidateTags = candidate.tags || [];
    var shared = currentTags.filter(function (t) {
      return candidateTags.indexOf(t) !== -1;
    });
    return shared.length;
  }

  function pickRelated(current, all) {
    if (current.pinnedRelated) {
      var pinned = all.find(function (a) { return a.slug === current.pinnedRelated; });
      if (pinned) return pinned;
    }
    var candidates = all.filter(function (a) { return a.slug !== current.slug; });
    candidates.sort(function (a, b) {
      var scoreDiff = scoreMatch(current, b) - scoreMatch(current, a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.date) - new Date(a.date);
    });
    return candidates[0] || null;
  }

  function render(related) {
    var placeholder = document.getElementById('also-read-placeholder');
    if (!placeholder || !related) return;

    var link = document.createElement('a');
    link.href = related.url;
    link.style.textDecoration = 'none';
    link.innerHTML =
      '<div class="also-read">' +
        '<div style="flex:1;">' +
          '<div class="also-read-label">Also from Sharpline Digital</div>' +
          '<div class="also-read-title">' + related.title + '</div>' +
          '<div class="also-read-desc">' + related.desc + '</div>' +
        '</div>' +
        '<div class="also-read-arrow">&#8594;</div>' +
      '</div>';

    placeholder.replaceWith(link);
  }

  function init() {
    var slug = currentSlug();
    fetch('/articles.json')
      .then(function (res) {
        if (!res.ok) throw new Error('articles.json request failed: ' + res.status);
        return res.json();
      })
      .then(function (all) {
        var current = all.find(function (a) { return a.slug === slug; });
        if (!current) return;
        var related = pickRelated(current, all);
        render(related);
      })
      .catch(function (err) {
        console.error('Related articles failed to load:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
