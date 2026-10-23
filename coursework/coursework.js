/* Static coursework demos: no request, account creation or stored form values. */
(function () {
  'use strict';
  if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
    document.body.classList.add('in-portfolio-preview');
    function tellParent(type) {
      var match = String(window.location.href).match(/(?:^|\/)(coursework\/tutorial-\d+\/[^/?#]+\.html)/);
      window.parent.postMessage({ type: type, page: match ? match[1] : '' }, '*');
    }
    var back = document.querySelector('.coursework-toolbar a');
    if (back) { back.textContent = '← Close preview'; }
    document.addEventListener('click', function (event) {
      if (event.defaultPrevented || (event.button !== undefined && event.button !== 0) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) { return; }
      var link = event.target;
      while (link && String(link.tagName).toLowerCase() !== 'a') { link = link.parentNode; }
      if (!link) { return; }
      var href = link.getAttribute('href') || '';
      if (link.getAttribute('data-room-back') !== null || /^(?:\.\.\/){2}(?:projects|index|sitemap|education|skills|experience|resume)\.html/.test(href)) {
        event.preventDefault(); tellParent('portfolio-preview-close');
      }
    });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') { event.preventDefault(); tellParent('portfolio-preview-close'); } });
    window.addEventListener('message', function (event) {
      if (event.source !== window.parent || !event.data || event.data.type !== 'portfolio-preview-pause') { return; }
      Array.prototype.forEach.call(document.querySelectorAll('audio, video'), function (media) { media.pause(); });
    });
    tellParent('portfolio-preview-ready');
  }
  var forms = document.querySelectorAll('form');
  Array.prototype.forEach.call(forms, function (form) {
    var result = document.getElementById('demo-result');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (result) { result.textContent = 'Demo complete. Your fields passed the browser checks. No information was sent and no account was created.'; }
    });
    form.addEventListener('reset', function () {
      if (result) { result.textContent = ''; }
    });
    form.addEventListener('input', function () {
      if (result) { result.textContent = ''; }
    });
  });
}());
