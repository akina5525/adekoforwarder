// ==UserScript==
// @name         Parasut Page Load Alert
// @namespace    https://github.com/akina5525/adekoforwarder
// @version      1.3.0
// @description  Alerts whenever the Parasut SPA finishes loading a new page
// @match        https://uygulama.parasut.com/*
// @updateURL    https://raw.githubusercontent.com/akina5525/adekoforwarder/main/parasut-transition.user.js
// @downloadURL  https://raw.githubusercontent.com/akina5525/adekoforwarder/main/parasut-transition.user.js
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';

  function showAlert(msg) {
    console.log(msg);
    handlePage();
  }

  function handlePage() {
    if (
      document.title.trim() ===
      'Paraşüt ▸ Satış Faturaları ▸ Satış Faturası ▸ Yeni'
    ) {
      const section = document.querySelector('fieldset[data-tns="invoice-header"]');
      if (!section) return;
      const label = Array.from(section.querySelectorAll('label')).find(el =>
        el.textContent.trim().toUpperCase() === 'FATURA İSMİ'
      );
      let input = label?.parentElement.querySelector('input[type="text"]');
      if (!input) {
        input = section.querySelector('input[type="text"]');
      }
      if (input) {
        input.click();
        input.style.backgroundColor = 'red';
      }
    }
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
