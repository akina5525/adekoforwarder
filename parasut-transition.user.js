// ==UserScript==
// @name         Parasut Page Load Alert
// @namespace    https://github.com/akina5525/adekoforwarder
// @version      1.15.0
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
      /Paraşüt ▸ Satış Faturaları ▸ [^▸]+ ▸ (Yeni|Düzenle)/.test(
        document.title.trim()
      )
    ) {
      const section = document.querySelector('fieldset[data-tns="invoice-header"]');
      if (!section) return;
      const label = Array.from(section.querySelectorAll('label')).find(el =>
        el.textContent.trim().toLocaleUpperCase('tr') === 'FATURA İSMİ'
      );
      let input = label?.parentElement.querySelector('input[type="text"]');
      if (!input) {
        input = section.querySelector('input[type="text"]');
      }
      if (input) {
        const updateBg = () => {
          const span = Array.from(document.querySelectorAll('span.prepend')).find(
            s => s.textContent.trim() === 'NO'
          );
          const orderInput = span?.parentElement.querySelector('input[type="text"]');
          if (orderInput && !orderInput.dataset.forwarderAttached) {
            orderInput.dataset.forwarderAttached = 'true';
            orderInput.addEventListener('input', updateBg);
            orderInput.addEventListener('change', updateBg);
          }

          if (/MUTFAK|BANYO/i.test(input.value) && orderInput && !orderInput.value.trim()) {
            orderInput.style.backgroundColor = 'red';
          } else if (orderInput) {
            orderInput.style.backgroundColor = '';
          }
        };

        const onTitleChange = () => {
          if (/MUTFAK|BANYO/i.test(input.value)) {
            const span = Array.from(document.querySelectorAll('span.prepend')).find(
              s => s.textContent.trim() === 'NO'
            );
            const orderInput = span?.parentElement.querySelector('input[type="text"]');
            if (!orderInput || orderInput.offsetParent === null) {
              const btn = Array.from(document.querySelectorAll('button')).find(
                b =>
                  b.textContent.trim().toLocaleUpperCase('tr') === 'SİPARİŞ BİLGİSİ EKLE'
              );
              if (btn) btn.click();
            }
          }
          updateBg();
        };
        if (!input.dataset.forwarderAttached) {
          input.dataset.forwarderAttached = 'true';
          input.addEventListener('input', onTitleChange);
          input.addEventListener('change', onTitleChange);
        }
        onTitleChange();

        const save = document.querySelector('button[data-tid="save"]');
        if (save && !save.dataset.forwarderAttached) {
          save.dataset.forwarderAttached = 'true';
          save.addEventListener(
            'click',
            ev => {
              if (/MUTFAK|BANYO/i.test(input.value)) {
                const span = Array.from(document.querySelectorAll('span.prepend')).find(
                  s => s.textContent.trim() === 'NO'
                );
                const orderInput = span?.parentElement.querySelector('input[type="text"]');
                if (!orderInput || !orderInput.value.trim()) {
                  ev.stopImmediatePropagation();
                  ev.preventDefault();
                  alert('CRM Sipariş NO boş olamaz');
                }
              }
            },
            true
          );
        }
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
