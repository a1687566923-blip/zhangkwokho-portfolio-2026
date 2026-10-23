/* CIS222 portfolio: small interactions using plain JavaScript.
   Page links work normally, including when JavaScript is switched off. */
(function () {
  'use strict';

  // Old WebViews can query nodes but do not implement NodeList.forEach.
  function findAll(root, selector) {
    return Array.prototype.slice.call(root.querySelectorAll(selector));
  }

  function startPortfolio() {
    document.body.classList.add('js-enabled');
    // Touch and programmatic focus stay quiet; keyboard focus remains visible.
    document.addEventListener('keydown', function () { document.body.classList.add('keyboard-input'); });
    document.addEventListener('pointerdown', function () { document.body.classList.remove('keyboard-input'); }, { passive: true });

    // 1. Open and close the mobile navigation.
    var menuButton = document.querySelector('.menu-toggle');
    var navigation = document.getElementById('site-nav');

    function setMenuOpen(open) {
      navigation.classList.toggle('is-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    }

    if (menuButton && navigation) {
      menuButton.hidden = false;
      setMenuOpen(false);
      menuButton.addEventListener('click', function () {
        setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
      });
      findAll(navigation, 'a').forEach(function (link) {
        link.addEventListener('click', function () { setMenuOpen(false); });
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
          setMenuOpen(false);
          menuButton.focus();
        }
      });
    }

    // 2. Switch the room between day and night.
    var themeButton = document.querySelector('.theme-toggle');
    var night = true;
    try { night = localStorage.getItem('cis222-room-v1-theme') !== 'day'; }
    catch (error) { /* The theme still works if local storage is unavailable. */ }

    function updateTheme() {
      document.body.classList.toggle('night', night);
      if (themeButton) {
        themeButton.setAttribute('aria-pressed', String(night));
        themeButton.setAttribute('title', night ? 'Switch to day mode' : 'Switch to night mode');
        var label = themeButton.querySelector('.theme-label');
        if (label) { label.textContent = night ? 'Night' : 'Day'; }
      }
    }

    updateTheme();
    if (themeButton) {
      themeButton.hidden = false;
      themeButton.addEventListener('click', function () {
        night = !night;
        updateTheme();
        try { localStorage.setItem('cis222-room-v1-theme', night ? 'night' : 'day'); }
        catch (error) { /* Saving is optional. */ }
      });
    }

    // 3. Respect reduced motion and let visitors pause movement.
    var motionButton = document.querySelector('.motion-toggle');
    var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var motionPaused = motionPreference.matches;
    var room = document.getElementById('room-scene');
    var roomTour = document.getElementById('room-tour');
    var reveals = findAll(document, '[data-reveal]');
    var revealObserver;
    var frameQueued = false;

    function showAllSections() {
      reveals.forEach(function (section) { section.classList.add('is-visible'); });
      if (revealObserver) { revealObserver.disconnect(); }
    }

    function positionRoom() {
      frameQueued = false;
      if (!room) { return; }
      // The scrolling homepage has its own camera in room-tour.js.
      if (roomTour) { return; }
      if (motionPaused) { room.style.transform = ''; return; }
      var scroll = Math.max(0, window.scrollY || window.pageYOffset || 0);
      var shift = Math.min(scroll * 0.035, 16);
      var scale = 1 - Math.min(scroll * 0.00004, 0.016);
      // The image and its links move together inside the same container.
      room.style.transform = 'translateY(' + shift + 'px) scale(' + scale + ')';
    }

    function updateMotion() {
      document.body.classList.toggle('motion-paused', motionPaused);
      if (motionButton) {
        motionButton.setAttribute('aria-pressed', String(motionPaused));
        motionButton.disabled = motionPreference.matches;
        motionButton.title = motionPreference.matches ? 'Your device requests reduced motion.' : 'Pause or resume room movement; screen playback and scrolling remain available';
        var label = motionButton.querySelector('.motion-label');
        if (label) { label.textContent = motionPaused ? 'Motion off' : 'Motion on'; }
      }
      if (motionPaused) { showAllSections(); }
      positionRoom();
    }

    updateMotion();
    if (motionButton) {
      motionButton.hidden = false;
      motionButton.addEventListener('click', function () {
        motionPaused = !motionPaused;
        updateMotion();
      });
    }
    function onMotionChange() {
      motionPaused = motionPreference.matches;
      updateMotion();
    }
    if (motionPreference.addEventListener) { motionPreference.addEventListener('change', onMotionChange); }
    else if (motionPreference.addListener) { motionPreference.addListener(onMotionChange); }
    if (room && !roomTour) {
      window.addEventListener('scroll', function () {
        if (!frameQueued) {
          frameQueued = true;
          window.requestAnimationFrame(positionRoom);
        }
      }, { passive: true });
    }

    // 4. Show room labels and describe each ordinary page link.
    var hintButton = document.querySelector('.hint-toggle');
    var labelsShown = !document.body.classList.contains('room-home');
    document.body.classList.toggle('show-hints', labelsShown);
    if (hintButton) {
      hintButton.hidden = false;
      hintButton.setAttribute('aria-pressed', String(labelsShown));
      hintButton.textContent = labelsShown ? 'Hide labels' : 'Show labels';
      hintButton.addEventListener('click', function () {
        var shown = document.body.classList.toggle('show-hints');
        hintButton.setAttribute('aria-pressed', String(shown));
        hintButton.textContent = shown ? 'Hide labels' : 'Show labels';
      });
    }

    var roomMessage = document.getElementById('room-message');
    if (roomMessage) {
      var defaultMessage = roomMessage.textContent;
      findAll(document, '.room-hotspot').forEach(function (link) {
        function describeLink() {
          roomMessage.textContent = link.getAttribute('data-caption') || defaultMessage;
        }
        link.addEventListener('focus', describeLink);
        link.addEventListener('mouseenter', describeLink);
        link.addEventListener('touchstart', describeLink, { passive: true });
        link.addEventListener('blur', function () { roomMessage.textContent = defaultMessage; });
        link.addEventListener('mouseleave', function () {
          if (document.activeElement !== link) { roomMessage.textContent = defaultMessage; }
        });
      });
    }

    // 5. Expand details. Without JavaScript, their content stays visible.
    findAll(document, '[data-disclosure]').forEach(function (button) {
      var panel = document.getElementById(button.getAttribute('aria-controls'));
      if (!panel) { return; }
      function setExpanded(open) {
        panel.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
        var marker = button.querySelector('[data-marker]');
        if (marker) { marker.textContent = open ? '−' : '+'; }
      }
      button.hidden = false;
      setExpanded(false);
      button.addEventListener('click', function () {
        setExpanded(button.getAttribute('aria-expanded') !== 'true');
      });
    });

    // 6. Filter coursework by category; all projects start visible in HTML.
    var projects = findAll(document, '.project-entry');
    var collections = findAll(document, '[data-project-collection]');
    var filterButtons = findAll(document, '[data-filter]');
    var projectCount = document.getElementById('project-count');
    function filterProjects(category) {
      var visible = 0;
      projects.forEach(function (project) {
        var categories = ' ' + (project.getAttribute('data-category') || '').replace(/\s+/g, ' ') + ' ';
        var matches = category === 'all' || categories.indexOf(' ' + category + ' ') !== -1;
        project.hidden = !matches;
        if (matches) { visible += 1; }
      });
      collections.forEach(function (collection) {
        collection.hidden = !findAll(collection, '.project-entry').some(function (project) { return !project.hidden; });
      });
      filterButtons.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-filter') === category));
      });
      if (projectCount) { projectCount.textContent = 'Showing ' + visible + ' of ' + projects.length + ' projects'; }
    }
    filterButtons.forEach(function (button) {
      button.hidden = false;
      button.addEventListener('click', function () { filterProjects(button.getAttribute('data-filter')); });
    });
    function revealProjectAnchor(hash, scrollIfHidden) {
      var id;
      try { id = decodeURIComponent((hash || '').slice(1)); }
      catch (error) { return; }
      if (!id) { return; }
      var target = document.getElementById(id);
      var project = target;
      while (project && (!project.classList || !project.classList.contains('project-entry'))) { project = project.parentNode; }
      if (!project) { return; }
      var wasHidden = project.hidden;
      if (project.hidden) { filterProjects('all'); }
      if (target.classList.contains('detail-panel') && target.hidden) {
        wasHidden = true;
        findAll(project, '[data-disclosure]').forEach(function (button) {
          if (button.getAttribute('aria-controls') === id) { button.click(); }
        });
      }
      // A filtered-out fragment could not receive native anchor positioning.
      if (wasHidden && scrollIfHidden && typeof target.scrollIntoView === 'function') {
        try { target.scrollIntoView({ behavior: 'instant', block: 'start' }); }
        catch (error) {
          try { target.scrollIntoView({ behavior: 'auto', block: 'start' }); }
          catch (legacyError) { target.scrollIntoView(); }
        }
      }
    }
    if (filterButtons.length) {
      filterProjects('all');
      revealProjectAnchor(window.location.hash, false);
      findAll(document, 'a').forEach(function (link) {
        link.addEventListener('click', function (event) {
          var href = link.getAttribute('href') || '';
          if (href.charAt(0) !== '#' || event.defaultPrevented ||
              (event.button !== undefined && event.button !== 0) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) { return; }
          // Reveal before the browser follows the ordinary anchor link.
          revealProjectAnchor(href, false);
        });
      });
      window.addEventListener('hashchange', function () { revealProjectAnchor(window.location.hash, true); });
    }

    // 7. Gently reveal sections once. Unsupported browsers show everything.
    if (!motionPaused && 'IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      reveals.forEach(function (section) { revealObserver.observe(section); });
    } else { showAllSections(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPortfolio);
  } else { startPortfolio(); }
}());
