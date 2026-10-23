/* Optional portfolio tools: ordinary links still work without this script. */
(function () {
  'use strict';
  function all(root, selector) { return Array.prototype.slice.call(root.querySelectorAll(selector)); }
  function startTools() {
    // Do not attach duplicate handlers if the optional script is loaded twice.
    if (document.body.hasAttribute('data-portfolio-tools-ready')) { return; }
    document.body.setAttribute('data-portfolio-tools-ready', '');
    var status = document.getElementById('site-tool-status');
    function announce(message) { if (status) { status.textContent = message; } }
    function focusQuietly(node) {
      if (!node || typeof node.focus !== 'function') { return; }
      try { node.focus({ preventScroll: true }); } catch (error) { node.focus(); }
    }
    function returnScroll(x, y) {
      var previous = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      try { window.scrollTo({ left: x, top: y, behavior: 'instant' }); }
      catch (error) { window.scrollTo(x, y); }
      document.documentElement.style.scrollBehavior = previous;
    }
    function manualCopy(text, button) {
      if (button._manualCopy && button._manualCopy.parentNode) { button._manualCopy.parentNode.removeChild(button._manualCopy); }
      var label = document.createElement('label');
      label.className = 'copy-manual';
      label.textContent = 'Select and copy this text:';
      var input = document.createElement('input');
      input.type = 'text'; input.readOnly = true; input.value = text;
      input.setAttribute('aria-label', 'Text to copy');
      label.appendChild(input);
      var done = document.createElement('button');
      done.type = 'button'; done.className = 'tool-button'; done.textContent = 'Done';
      done.addEventListener('click', function () { if (label.parentNode) { label.parentNode.removeChild(label); } button._manualCopy = null; focusQuietly(button); });
      label.appendChild(done); button.parentNode.appendChild(label); button._manualCopy = label;
      focusQuietly(input); input.select();
      announce('Automatic copying is unavailable. Select and copy the text shown beside the button.');
    }
    function copyText(text, button, message) {
      if (button.disabled) { return; }
      var original = button.getAttribute('data-copy-label') || button.textContent;
      button.setAttribute('data-copy-label', original);
      if (button._copyTimer) { window.clearTimeout(button._copyTimer); }
      var settled = false, pendingTimer = null;
      function settle() {
        if (settled) { return false; }
        settled = true; window.clearTimeout(pendingTimer); return true;
      }
      function copied() {
        if (!settle()) { return; }
        button.disabled = false; button.textContent = 'Copied'; announce(message);
        if (button._manualCopy && button._manualCopy.parentNode) { button._manualCopy.parentNode.removeChild(button._manualCopy); button._manualCopy = null; }
        if (button._copyTimer) { window.clearTimeout(button._copyTimer); }
        button._copyTimer = window.setTimeout(function () { button.textContent = original; }, 2200);
      }
      function failed() {
        if (!settle()) { return; }
        button.disabled = false; button.textContent = original;
        if (button._copyTimer) { window.clearTimeout(button._copyTimer); }
        manualCopy(text, button);
      }
      var clipboard = window.navigator && window.navigator.clipboard;
      if (clipboard && typeof clipboard.writeText === 'function') {
        button.disabled = true; button.textContent = 'Copying…';
        // Some embedded browsers leave clipboard permission requests unresolved.
        pendingTimer = window.setTimeout(failed, 8000);
        try { clipboard.writeText(text).then(copied, failed); } catch (error) { failed(); }
        return;
      }
      // A user-initiated local-file click may support the older copy API.
      var field = document.createElement('textarea');
      field.className = 'copy-buffer'; field.value = text; field.readOnly = true; field.setAttribute('aria-label', 'Copy buffer');
      var x = window.scrollX || window.pageXOffset || 0, y = window.scrollY || window.pageYOffset || 0;
      document.body.appendChild(field);
      var ok = false;
      try { focusQuietly(field); field.select(); ok = typeof document.execCommand === 'function' && document.execCommand('copy'); }
      catch (error) { ok = false; }
      document.body.removeChild(field); focusQuietly(button); returnScroll(x, y);
      if (ok) { copied(); } else { failed(); }
    }
    all(document, '[data-copy-email]').forEach(function (button) {
      button.hidden = false;
      button.addEventListener('click', function () { copyText(button.getAttribute('data-copy-email'), button, 'Email address copied.'); });
    });
    // Resolve the printed portfolio URL from its actual deployment, regardless of repository name.
    var resumeURL = document.getElementById('resume-portfolio-url');
    if (resumeURL && /^https?:\/\//i.test(String(window.location.href))) {
      var homeURL = String(window.location.href).split('#')[0].split('?')[0].replace(/[^/]*$/, '');
      resumeURL.setAttribute('href', homeURL);
      resumeURL.textContent = homeURL.replace(/^https?:\/\//i, '');
    }
    var shareNote = document.getElementById('project-share-note');
    if (shareNote && !/^https?:\/\//i.test(String(window.location.href))) {
      shareNote.hidden = false;
      shareNote.textContent = 'Upload this website first, then open the published Projects page to copy a project link.';
    }
    all(document, '[data-share-project]').forEach(function (button) {
      var id = button.getAttribute('data-share-project');
      if (!/^[a-z0-9][a-z0-9-]*$/.test(id || '')) { return; }
      button.hidden = false;
      button.addEventListener('click', function () {
        var base = String(window.location.href).split('#')[0].split('?')[0];
        var local = !/^https?:\/\//i.test(base);
        if (local) {
          var setting = document.querySelector('meta[name="portfolio-public-url"]');
          var publicRoot = setting && setting.getAttribute('content');
          if (!/^https:\/\//i.test(publicRoot || '')) { announce('Publish this portfolio before sharing a project link.'); return; }
          base = publicRoot.replace(/\/?$/, '/') + 'projects.html';
        }
        copyText(base + '#' + encodeURIComponent(id), button, local ? 'Public project link copied. Upload the latest website files before sharing the updated version.' : 'Project link copied.');
      });
    });
    all(document, '[data-print-resume]').forEach(function (button) {
      button.hidden = false;
      button.addEventListener('click', function () {
        try { window.print(); } catch (error) { announce('Use your browser menu to print this resume or save it as a PDF.'); }
      });
    });

    var dialog = document.getElementById('project-viewer');
    if (!dialog) { return; }
    var shade = document.getElementById('project-viewer-shade');
    var title = document.getElementById('viewer-title');
    var subtitle = document.getElementById('viewer-subtitle');
    var closeButton = document.getElementById('viewer-close');
    var controls = document.getElementById('viewer-controls');
    var tabs = all(dialog, '[data-viewer-tab]');
    var pageSelect = document.getElementById('viewer-page');
    var previewPanel = document.getElementById('viewer-preview');
    var codePanel = document.getElementById('viewer-code-panel');
    var codeText = document.getElementById('viewer-code');
    var codeNote = document.getElementById('viewer-code-note');
    var frame = document.getElementById('viewer-frame');
    var imageStage = document.getElementById('viewer-image-stage');
    var image = document.getElementById('viewer-image');
    var zoomButton = document.getElementById('viewer-zoom');
    var fullLink = document.getElementById('viewer-full-link');
    var viewerStatus = document.getElementById('viewer-status');
    var active = false, kind = '', activePage = null, activeTab = 'preview', trigger = null;
    var scrollX = 0, scrollY = 0, oldBody = null, hiddenSiblings = [];
    var viewerSize = '';
    var previewTimer = null, previewState = 'idle';
    function previewMessage() {
      if (!active || kind !== 'work' || activeTab !== 'preview') { return; }
      viewerStatus.textContent = previewState === 'loading' ? 'Loading exercise…' : previewState === 'slow' ? 'Preview is taking longer than expected. Use Open full page to continue.' : 'Interactive exercise · form submissions stay local.';
    }
    function readyPreview() {
      window.clearTimeout(previewTimer); previewTimer = null; previewState = 'ready';
      previewPanel.setAttribute('aria-busy', 'false'); previewMessage();
    }
    var codeLoading = false, codeWaiters = [], codeTicket = 0;
    var pageOptions = all(pageSelect, 'option').map(function (option) {
      return { key: option.getAttribute('value'), project: option.getAttribute('data-project'), label: option.textContent,
        url: option.getAttribute('data-url'), title: option.getAttribute('data-title') };
    });
    function pageByKey(key) { return pageOptions.filter(function (page) { return page.key === key; })[0]; }
    function stopPreview() {
      window.clearTimeout(previewTimer); previewTimer = null; previewState = 'idle';
      previewPanel.setAttribute('aria-busy', 'false'); frame.removeAttribute('src');
    }
    function sizeViewer() {
      if (!active) { return; }
      var viewport = window.visualViewport;
      if (viewport && viewport.scale && Math.abs(viewport.scale - 1) > .05) { return; }
      var height = Math.round(viewport && viewport.height || window.innerHeight);
      var inset = window.innerWidth <= 600 ? 12 : 32;
      var size = Math.max(120, Math.min(860, height - inset));
      var top = Math.round((viewport && viewport.offsetTop || 0) + Math.max(inset / 2, (height - size) / 2));
      var key = size + ':' + top;
      if (key === viewerSize) { return; }
      viewerSize = key; dialog.style.height = size + 'px'; dialog.style.top = top + 'px';
      dialog.style.bottom = 'auto'; dialog.style.margin = '0 auto';
      dialog.classList.toggle('viewer-short', height < 520);
    }
    window.addEventListener('resize', sizeViewer);
    if (window.visualViewport && window.visualViewport.addEventListener) {
      window.visualViewport.addEventListener('resize', sizeViewer);
      window.visualViewport.addEventListener('scroll', sizeViewer);
    }
    function hideBackground() {
      hiddenSiblings = [];
      Array.prototype.forEach.call(document.body.children, function (node) {
        if (node === dialog || node === shade || /^(SCRIPT|LINK)$/.test(node.tagName)) { return; }
        hiddenSiblings.push({ node: node, aria: node.getAttribute('aria-hidden'), inert: node.inert });
        node.setAttribute('aria-hidden', 'true');
        if ('inert' in node) { node.inert = true; }
      });
    }
    function restoreBackground() {
      hiddenSiblings.forEach(function (saved) {
        if (saved.aria === null) { saved.node.removeAttribute('aria-hidden'); } else { saved.node.setAttribute('aria-hidden', saved.aria); }
        if ('inert' in saved.node) { saved.node.inert = saved.inert; }
      });
      hiddenSiblings = [];
    }
    function openViewer(button) {
      if (active) { return; }
      trigger = button; scrollX = window.scrollX || window.pageXOffset || 0; scrollY = window.scrollY || window.pageYOffset || 0;
      oldBody = { position: document.body.style.position, top: document.body.style.top, left: document.body.style.left,
        width: document.body.style.width, overflow: document.body.style.overflow };
      active = true; dialog.hidden = false;
      var nativeModal = false;
      if (typeof dialog.showModal === 'function') { try { dialog.showModal(); nativeModal = true; } catch (error) { /* Use the fixed dialog below. */ } }
      if (!nativeModal) { dialog.setAttribute('open', ''); shade.hidden = false; }
      viewerSize = ''; sizeViewer();
      focusQuietly(closeButton); hideBackground();
      document.body.style.position = 'fixed'; document.body.style.top = '-' + scrollY + 'px'; document.body.style.left = '-' + scrollX + 'px';
      document.body.style.width = '100%'; document.body.style.overflow = 'hidden';
    }
    function closeViewer() {
      if (!active) { return; }
      active = false; codeTicket += 1; stopPreview(); image.removeAttribute('src');
      if (typeof dialog.close === 'function' && dialog.hasAttribute('open')) { try { dialog.close(); } catch (error) { /* Remove open below. */ } }
      dialog.removeAttribute('open'); dialog.hidden = true; shade.hidden = true; restoreBackground();
      Object.keys(oldBody).forEach(function (key) { document.body.style[key] = oldBody[key]; });
      returnScroll(scrollX, scrollY); focusQuietly(trigger); returnScroll(scrollX, scrollY);
    }
    closeButton.addEventListener('click', closeViewer);
    shade.addEventListener('click', closeViewer);
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); closeViewer(); });
    dialog.addEventListener('close', closeViewer);
    dialog.addEventListener('click', function (event) { if (event.target === dialog) { closeViewer(); } });
    document.addEventListener('keydown', function (event) {
      if (!active) { return; }
      if (event.key === 'Escape') { event.preventDefault(); closeViewer(); return; }
      if (event.key !== 'Tab') { return; }
      var focusable = all(dialog, 'button, a[href], select, input, iframe, [tabindex]').filter(function (node) {
        return !node.disabled && !node.hidden && node.tabIndex >= 0 && node.getClientRects().length;
      });
      if (!focusable.length) { event.preventDefault(); focusQuietly(closeButton); return; }
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); focusQuietly(last); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); focusQuietly(first); }
    });
    window.addEventListener('pagehide', closeViewer);

    function loadCode(callback) {
      if (window.portfolioCodeSamples) { callback(window.portfolioCodeSamples); return; }
      codeWaiters.push(callback);
      if (codeLoading) { return; }
      codeLoading = true;
      var script = document.createElement('script'), finished = false, timeout;
      function finish(data) {
        if (finished) { return; }
        finished = true; codeLoading = false; window.clearTimeout(timeout);
        var waiting = codeWaiters; codeWaiters = [];
        if (!data && script.parentNode) { script.parentNode.removeChild(script); }
        waiting.forEach(function (listener) { listener(data); });
      }
      script.src = 'project-code.js?v=20261018-features1';
      script.onload = function () { finish(window.portfolioCodeSamples || null); };
      script.onerror = function () { finish(null); };
      timeout = window.setTimeout(function () { finish(null); }, 10000);
      document.head.appendChild(script);
    }
    function selectTab(tab, moveFocus) {
      activeTab = tab; codeTicket += 1;
      var ticket = codeTicket;
      tabs.forEach(function (button) {
        var selected = button.getAttribute('data-viewer-tab') === tab;
        button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
        if (selected && moveFocus) { focusQuietly(button); }
      });
      previewPanel.hidden = tab !== 'preview'; codePanel.hidden = tab === 'preview';
      codePanel.setAttribute('aria-labelledby', 'viewer-tab-' + (tab === 'css' ? 'css' : 'html'));
      if (tab === 'preview') {
        if (!frame.getAttribute('src')) {
          previewState = 'loading'; previewPanel.setAttribute('aria-busy', 'true');
          previewTimer = window.setTimeout(function () {
            previewState = 'slow'; previewPanel.setAttribute('aria-busy', 'false'); previewMessage();
          }, 12000);
          frame.setAttribute('title', activePage.title + ' — ' + activePage.label);
          frame.setAttribute('src', activePage.url + '?portfolio-preview=1');
        }
        previewMessage();
        return;
      }
      try { if (frame.contentWindow) { frame.contentWindow.postMessage({ type: 'portfolio-preview-pause' }, '*'); } } catch (error) { /* No media needs to be paused. */ }
      codeText.parentNode.scrollTop = 0; codeText.parentNode.scrollLeft = 0;
      codeText.textContent = 'Loading code…'; codeNote.textContent = 'Selected source from this exercise';
      viewerStatus.textContent = '';
      loadCode(function (data) {
        if (!active || kind !== 'work' || ticket !== codeTicket) { return; }
        var page = data && data.pages && data.pages[activePage.key];
        var sheet = page && data.styles && data.styles[page.cssKey];
        if (!page || !sheet) {
          codeText.textContent = 'The code could not be loaded. Choose HTML or CSS again to retry, or use Open full page.';
          return;
        }
        codeText.textContent = tab === 'html' ? page.html : sheet.content;
        codeNote.textContent = tab === 'html' ? page.file + ' · published exercise source' : sheet.file + ' · ' + sheet.note;
      });
    }
    function setPage(page, fromFrame) {
      activePage = page;
      all(pageSelect, 'option').forEach(function (option) {
        var available = option.getAttribute('data-project') === page.project;
        option.hidden = !available; option.disabled = !available;
      });
      pageSelect.value = page.key; title.textContent = page.title;
      frame.setAttribute('title', page.title + ' — ' + page.label);
      fullLink.setAttribute('href', page.url);
      if (!fromFrame) { stopPreview(); }
      selectTab(activeTab, false);
    }
    pageSelect.addEventListener('change', function () { var page = pageByKey(pageSelect.value); if (page) { setPage(page, false); } });
    tabs.forEach(function (button, index) {
      button.addEventListener('click', function () { selectTab(button.getAttribute('data-viewer-tab'), false); });
      button.addEventListener('keydown', function (event) {
        var next = index;
        if (event.key === 'ArrowRight') { next = (index + 1) % tabs.length; }
        else if (event.key === 'ArrowLeft') { next = (index + tabs.length - 1) % tabs.length; }
        else if (event.key === 'Home') { next = 0; }
        else if (event.key === 'End') { next = tabs.length - 1; }
        else { return; }
        event.preventDefault(); selectTab(tabs[next].getAttribute('data-viewer-tab'), true);
      });
    });
    window.addEventListener('message', function (event) {
      if (!active || kind !== 'work' || event.source !== frame.contentWindow || !event.data) { return; }
      if (event.data.type === 'portfolio-preview-close') { closeViewer(); }
      else if (event.data.type === 'portfolio-preview-ready') {
        var page = pageOptions.filter(function (item) { return item.project === activePage.project && item.url === event.data.page; })[0];
        if (page) {
          readyPreview();
          if (page.key !== activePage.key) { setPage(page, true); }
        }
      }
    });
    all(document, '[data-workbench]').forEach(function (button) {
      var page = pageByKey(button.getAttribute('data-workbench'));
      if (!page) { return; }
      button.hidden = false;
      button.addEventListener('click', function () {
        if (active) { return; }
        kind = 'work'; activeTab = 'preview';
        controls.hidden = false; imageStage.hidden = true; zoomButton.hidden = true;
        subtitle.textContent = 'CIS222 · Year 2 · Semester 1 · 2026';
        fullLink.textContent = 'Open full page ↗';
        openViewer(button); setPage(page, false);
      });
    });
    zoomButton.addEventListener('click', function () {
      var zoomed = imageStage.classList.toggle('is-zoomed');
      zoomButton.textContent = zoomed ? 'Fit image' : 'Zoom in'; zoomButton.setAttribute('aria-pressed', String(zoomed));
    });
    all(document, '[data-view-image]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (event.defaultPrevented || (event.button !== undefined && event.button !== 0) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) { return; }
        event.preventDefault();
        if (active) { return; }
        kind = 'image'; codeTicket += 1;
        controls.hidden = true; previewPanel.hidden = true; codePanel.hidden = true; imageStage.hidden = false; zoomButton.hidden = false;
        imageStage.classList.remove('is-zoomed'); zoomButton.textContent = 'Zoom in'; zoomButton.setAttribute('aria-pressed', 'false');
        imageStage.scrollTop = 0; imageStage.scrollLeft = 0;
        var file = link.getAttribute('href');
        title.textContent = link.getAttribute('data-view-title') || 'Game screenshot';
        subtitle.textContent = 'Actual gameplay screenshot · CIS243 · Year 1 · Semester 2';
        image.setAttribute('alt', link.getAttribute('data-view-alt') || title.textContent);
        image.setAttribute('src', file); fullLink.setAttribute('href', file); fullLink.textContent = 'Open original image ↗';
        viewerStatus.textContent = 'Zoom to inspect the image; close to continue where you left off.';
        openViewer(link);
      });
    });
    image.addEventListener('error', function () { if (active && kind === 'image') { viewerStatus.textContent = 'The image could not be loaded. Try Open original image.'; } });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', startTools); }
  else { startTools(); }
}());
