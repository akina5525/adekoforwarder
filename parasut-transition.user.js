// ==UserScript==
// @name         Parasut Trinity Transition Popup
// @namespace    https://github.com/akina5525/adekoforwarder
// @version      1.0.0
// @description  Shows a popup whenever the SPA triggers trinityDidTransition
// @match        https://uygulama.parasut.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';

  function showPopup(msg, ms = 3000) {
    const popup = Object.assign(document.createElement('div'), { textContent: msg });
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
    setTimeout(() => popup.remove(), ms);
  }

  function onTransition() {
    showPopup('trinityDidTransition event fired');
  }

  function init() {
    document.addEventListener('trinityDidTransition', onTransition);
  }

  if (document.body) {
    init();
  } else {
    new MutationObserver((_, obs) => {
      if (document.body) {
        obs.disconnect();
        init();
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();

