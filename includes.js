/**
 * Sharpline Digital — Nav & Footer Includes
 * Fetches /nav.html and /footer.html and injects them into
 * placeholder divs, then wires up mobile toggle + (on hero pages)
 * the scroll-to-solid nav behavior.
 *
 * TO USE ON A PAGE:
 *   <link rel="stylesheet" href="/nav-footer.css">
 *   ...
 *   <div id="nav-placeholder"></div>
 *   ... page content ...
 *   <div id="footer-placeholder"></div>
 *   <script src="/includes.js"></script>
 *
 * FOR PAGES WITH A TRANSPARENT HERO (homepage, city landing pages):
 *   Add class="has-hero" to <body>. The nav will float transparent
 *   over the hero and solidify on scroll. Every other page gets a
 *   solid, sticky nav by default — no extra markup needed.
 * FOR CONVERSION-FOCUSED PAGES (e.g. quote.html) THAT WANT THE MINIMAL
 * "logo + back to home" NAV INSTEAD OF THE FULL 7-LINK NAV:
 *   <div id="nav-placeholder" data-nav="minimal"></div>
 *
 * Active-page highlighting: the nav link matching the current path
 * automatically gets class="active" — no per-page markup needed.
 */
(function () {
  function loadPartial(url, placeholderId, callback) {
    var el = document.getElementById(placeholderId);
    if (!el) { if (callback) callback(); return; }
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error(url + ' failed: ' + res.status);
        return res.text();
      })
      .then(function (html) {
        el.outerHTML = html;
        if (callback) callback();
      })
      .catch(function (err) {
        console.error('Include failed:', err);
      });
  }

  function highlightActiveLink() {
    var path = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.nav-links a').forEach(function (link) {
      var linkPath = link.getAttribute('href');
      if (!linkPath) return;
      linkPath = linkPath.replace(/\/$/, '') || '/';
      if (linkPath === path) link.classList.add('active');
    });
  }

  function initNavBehavior() {
    highlightActiveLink();
    var nav = document.getElementById('mainNav');
    var toggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');

    // Mobile menu toggle — needed on every page
    if (toggle && navLinks) {
      toggle.addEventListener('click', function () {
        navLinks.classList.toggle('open');
      });
      navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          navLinks.classList.remove('open');
        });
      });
    }

    // Smooth scroll for in-page anchors, with nav-height offset
    document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var hash = this.getAttribute('href').split('#')[1];
        var target = hash && document.getElementById(hash);
        if (target) {
          e.preventDefault();
          var top = target.getBoundingClientRect().top + window.scrollY - 72;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });

    // Transparent-over-hero behavior — opt in via <body class="has-hero">
    if (nav && document.body.classList.contains('has-hero')) {
      window.addEventListener('scroll', function () {
        if (window.scrollY > 60) {
          nav.style.background = 'rgba(10,22,40,0.97)';
          nav.style.position = 'fixed';
          nav.style.backdropFilter = 'blur(8px)';
        } else {
          nav.style.background = 'transparent';
          nav.style.position = 'absolute';
          nav.style.backdropFilter = 'none';
        }
      }, { passive: true });
    }
  }

  function init() {
    var navPlaceholder = document.getElementById('nav-placeholder');
    var navFile = (navPlaceholder && navPlaceholder.dataset.nav === 'minimal')
      ? '/nav-minimal.html'
      : '/nav.html';
    loadPartial(navFile, 'nav-placeholder', initNavBehavior);
    loadPartial('/footer.html', 'footer-placeholder');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
