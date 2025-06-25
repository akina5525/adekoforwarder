// ==UserScript==
// @name         Adekosiparis → Vertigram Forwarder + Parasut helpers
// @namespace    https://github.com/akina5525/adekoforwarder
// @version      1.0.37
// @description  • Forwards Adekosiparis projects to Vertigram every 30 min  • Adds CRM helpers inside uygulama.parasut.com
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

  const isAdekos  = location.hostname.includes('adekosiparis.vanucci.com');
  const isParasut = location.hostname.includes('uygulama.parasut.com');

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
   *  STATUS BAR (both sites)                          *
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
    if (Date.now() - last > 30 * 60 * 1000) forwardProjects(); // ≥30 min
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

  /*───────────────────────────────────────────────────*
   *  PARASUT HELPERS                                  *
   *───────────────────────────────────────────────────*/
  if (isParasut) {
    /*— tiny logger —*/ const log = (...a) => console.debug('[Parasut]', ...a);

    /* Detect SPA route changes (pushState/replaceState/popstate) */
    function onSpaNavigation(cb) {
      let last = location.pathname + location.search;
      const fire = () => {
        const cur = location.pathname + location.search;
        if (cur !== last) {
          last = cur;
          cb();
        }
      };
      ['pushState', 'replaceState'].forEach(fn => {
        const orig = history[fn];
        history[fn] = function () {
          orig.apply(this, arguments);
          fire();
        };
      });
      addEventListener('popstate', fire, true);
      fire(); // initial
    }

    /* Promise-style DOM waiter */
    function waitFor(testFn, { poll = 100, timeout = 5000 } = {}) {
      return new Promise((res, rej) => {
        const t0 = performance.now();
        (function look() {
          const el = testFn();
          if (el) return res(el);
          if (performance.now() - t0 > timeout) return rej('timeout');
          setTimeout(look, poll);
        })();
      });
    }

    /* Auto-expand “Sipariş Bilgisi Ekle” */
    async function clickOrderInfo() {
      try {
        const btn = await waitFor(() =>
          Array.from(document.querySelectorAll('button, a, [role="button"]')).find(el =>
            /sipariş bilgisi ekle/i.test(el.textContent)
          )
        );
        btn.click();
      } catch (_) {
        log('Order-info button not found (timeout)');
      }
    }

    /* CRM Order-No validator */
    async function installOrderNoValidator() {
      try {
        const [saveBtn, input] = await Promise.all([
          waitFor(() => document.querySelector('[data-tid="save"]')),
          waitFor(() => {
            const span = Array.from(document.querySelectorAll('span.prepend')).find(sp => sp.textContent.trim() === 'NO');
            return span && span.parentElement.querySelector('input');
          }),
        ]);

        input.style.background = '#ffe5e5';
        saveBtn.addEventListener(
          'click',
          evt => {
            if (!input.value.trim()) {
              evt.stopImmediatePropagation();
              evt.preventDefault();
              alert('CRM Order No has to be entered');
            }
          },
          true
        );
      } catch (_) {
        log('Order-No validator setup timed out');
      }
    }
    /* ───── watch “FATURA İSMİ” and warn if it changes ───── */
async function watchInvoiceNameChange() {
  try {
    // 1.  Find the fieldset by its data-tns attribute, then the <input>
    const input = await waitFor(() =>
      document
        .querySelector('fieldset[data-tns="invoice-header"] input[type="text"]')
    );

    let original = input.value;          // remember the value loaded from DB
    if (original === undefined) original = '';   // safety

    // 2.  Listen for edits
    input.addEventListener('input', () => {
      if (input.value !== original) {
        alert('⚠️  “FATURA İSMİ” alanı değiştirildi!');
        original = input.value; // optional: update so the alert fires only once
      }
    });

  } catch (e) {
    console.debug('[Parasut] watchInvoiceNameChange →', e);
  }
}


    /* Run Parasut enhancements on invoice pages */
    function runParasutEnhancements() {
      if (/\/satislar\/(?:yeni|\d+)\/fatura/.test(location.pathname)) {
        clickOrderInfo();
        installOrderNoValidator();
        watchInvoiceNameChange();
      }
    }

    onSpaNavigation(runParasutEnhancements);
  }

  /*───────────────────────────────────────────────────*
   *  INITIALISATION PER SITE                          *
   *───────────────────────────────────────────────────*/
  if (isAdekos) {
    maybeForward();                           // immediate
    setInterval(maybeForward, 5 * 60 * 1000); // check every 5 min
    attachLogoutHandler();
  }
})();
