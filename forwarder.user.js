// ==UserScript==
// @name         Adekosiparis → Vertigram Forwarder
// @namespace    https://github.com/akina5525/adekoforwarder
// @version      1.0.41
// @description  Forwards Adekosiparis projects to Vertigram every 30 min
// @match        https://adekosiparis.vanucci.com/*
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
   *  INITIALISATION PER SITE                          *
   *───────────────────────────────────────────────────*/
  if (isAdekos) {
    maybeForward();                           // immediate
    setInterval(maybeForward, 5 * 60 * 1000); // check every 5 min
    attachLogoutHandler();
  }
})();
