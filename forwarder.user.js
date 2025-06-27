// ==UserScript==
// @name         Adekosiparis → Vertigram Forwarder
// @namespace    https://github.com/akina5525/adekoforwarder
// @version      1.4.0
// @description  Forwards Adekosiparis projects to Vertigram every 30 min; enhances Parasut invoices
// @match        https://adekosiparis.vanucci.com/*
// @match        https://uygulama.parasut.com/*
// @updateURL    https://raw.githubusercontent.com/akina5525/adekoforwarder/main/forwarder.user.js
// @downloadURL  https://raw.githubusercontent.com/akina5525/adekoforwarder/main/forwarder.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  /*───────────────────────────────────────────────────*
   *  EARLY EXIT ON LOGIN PAGES                        *
   *───────────────────────────────────────────────────*/
  if (/login/i.test(location.href)) return;

  const isAdekos = location.hostname.includes('adekosiparis.vanucci.com');
  const isParasut = location.hostname.includes('uygulama.parasut.com');

  if (isAdekos) {
    /*───────────────────────────────────────────────────*
     *  COOKIE HELPERS                                   *
     *───────────────────────────────────────────────────*/
    const getCookie = k => {
      const m = document.cookie.match(new RegExp('(?:^|; )' + k + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : null;
    };
    const setCookie = (k, v, sec) => (document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=${sec}`);
    const delCookie = k => (document.cookie = `${k}=; path=/; max-age=0`);

    /*───────────────────────────────────────────────────*
     *  STATUS BAR (Adekos only)                          *
     *───────────────────────────────────────────────────*/
    function showBar(msg, ms = 3000) {
      let bar = document.getElementById('forwarder-status-bar');
      if (!bar) {
        bar = Object.assign(document.createElement('div'), { id: 'forwarder-status-bar' });
        Object.assign(bar.style, {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '10px',
          fontSize: '14px',
          background: '#ffb700',
          color: '#000',
          textAlign: 'center',
          zIndex: 10000,
        });
        document.body.appendChild(bar);
      }
      bar.textContent = msg;
      clearTimeout(bar.hideTimer);
      bar.hideTimer = setTimeout(() => bar.remove(), ms);
    }

    /*───────────────────────────────────────────────────*
     *  ADEKOS → VERTIGRAM FORWARDER                     *
     *───────────────────────────────────────────────────*/
    async function forwardProjects() {
      showBar('Forwarding projects…');
      try {
        const list = await fetch(
          'https://adekosiparis.vanucci.com/Project/GetProjects?page=1&limit=50&customerTitle=&sortBy=crmOrderNo&direction=desc&status=S'
        ).then(r => (r.ok ? r.json() : Promise.reject(new Error(`Fetch projects failed (${r.status})`))));

        await fetch('https://montaj.sistemart.com/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(list),
        }).then(r => (r.ok ? r : Promise.reject(new Error(`POST to Vertigram failed (${r.status})`))));

        setCookie('last_forward', Date.now(), 60 * 60 * 24 * 30); // 30 days
        showBar('✅ Projects forwarded successfully');
      } catch (e) {
        console.error(e);
        showBar('❌ ' + e.message);
      }
    }

    function maybeForward() {
      const last = +getCookie('last_forward') || 0;
      if (Date.now() - last > 10 * 60 * 1000) forwardProjects(); // ≥10 min
    }

    function attachLogoutHandler() {
      let tries = 0;
      const timer = setInterval(() => {
        tries++;
        const el = Array.from(document.querySelectorAll('a, button')).find(e => /çıkış/i.test(e.textContent));
        if (el) {
          el.addEventListener('click', () => delCookie('last_forward'));
          clearInterval(timer);
        }
        if (tries > 20) clearInterval(timer); // ~6 s
      }, 300);
    }

    maybeForward(); // immediate
    //setInterval(maybeForward, 5 * 60 * 1000); // check every 5 min
    attachLogoutHandler();
  }

  /*───────────────────────────────────────────────────*
   *  PARASUT ENHANCEMENTS                             *
   *───────────────────────────────────────────────────*/
  function initParasut() {
    function handlePage() {
      if (
        /Paraşüt ▸ Satış Faturaları ▸ Satış Faturası ▸ (Yeni|Düzenle)/.test(
          document.title.trim()
        )
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

          const updateBg = () => {
            const span = Array.from(document.querySelectorAll('span.prepend')).find(
              s => s.textContent.trim() === 'NO'
            );
            const orderInput = span?.parentElement.querySelector('input[type="text"]');
            if (orderInput && !orderInput.dataset.forwarderAttached) {
              orderInput.dataset.forwarderAttached = 'true';
              orderInput.addEventListener('input', updateBg);
            }

            if (/MUTFAK|BANYO/i.test(input.value) && orderInput && !orderInput.value.trim()) {
              orderInput.style.backgroundColor = 'red';
            } else if (orderInput) {
              orderInput.style.backgroundColor = '';
            }
          };

          if (!input.dataset.forwarderAttached) {
            input.dataset.forwarderAttached = 'true';
            input.addEventListener('input', () => {
              if (/MUTFAK|BANYO/i.test(input.value)) {
                const btn = Array.from(document.querySelectorAll('button')).find(
                  b => b.textContent.trim().toUpperCase() === 'SİPARİŞ BİLGİSİ EKLE'
                );
                if (btn) btn.click();
              }
              updateBg();
            });
          }
          updateBg();

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

    function showAlert(msg) {
      console.log(msg);
      handlePage();
    }

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
  }

  /*───────────────────────────────────────────────────*
   *  INITIALISATION PER SITE                          *
   *───────────────────────────────────────────────────*/
  if (isParasut) {
    initParasut();
  }
})();
