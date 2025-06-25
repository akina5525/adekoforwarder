// ==UserScript==
// @name         Parasut Page Load Alert
// @namespace    https://github.com/akina5525/adekoforwarder
// @version      1.0.1
// @description  Alerts whenever the Parasut SPA finishes loading a new page
// @match        https://uygulama.parasut.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';

  function showAlert(msg, ms = 3000) {
    let popup = document.getElementById('parasut-alert-popup');
    if (!popup) {
      popup = Object.assign(document.createElement('div'), {
        id: 'parasut-alert-popup',
      });
      Object.assign(popup.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        background: '#333',
        color: '#fff',
        borderRadius: '4px',
        zIndex: 9999,
      });
      document.body.appendChild(popup);
    }
    popup.textContent = msg;
    clearTimeout(popup.hideTimer);
    popup.hideTimer = setTimeout(() => popup.remove(), ms);
  }

  // show alert after DOM settles
  let lastUrl = location.href;
  let timer;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
    }
    clearTimeout(timer);
    timer = setTimeout(() => showAlert(`Page loaded: ${document.title}`), 500);
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    showAlert(`Page loaded: ${document.title}`);
  }

  if (document.body) {
    start();
  } else {
    new MutationObserver((_, obs) => {
      if (document.body) {
        obs.disconnect();
        start();
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
