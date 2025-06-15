// ==UserScript==
// @name         Adekosiparis → Vertigram Forwarder
// @namespace    https://github.com/akina5525/adekoforwarder
// @version      1.0.10
// @description  Automatically forwards projects to Vertigram API every 30 minutes
// @match        https://adekosiparis.vanucci.com/*
// @updateURL    https://raw.githubusercontent.com/akina5525/adekoforwarder/main/forwarder.user.js
// @downloadURL  https://raw.githubusercontent.com/akina5525/adekoforwarder/main/forwarder.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Exit early on the login page
    if (location.href.toLowerCase().includes('login')) {
        return;
    }

    // Utility to get a cookie by name
    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    // Utility to set a cookie with path=/
    function setCookie(name, value, maxAgeSeconds) {
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}`;
    }

    // Deletes a cookie
    function deleteCookie(name) {
        document.cookie = `${name}=; path=/; max-age=0`;
    }

    // Shows a small top bar with the given message
    function showBar(msg) {
        let bar = document.getElementById('forwarder-status-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'forwarder-status-bar';
            Object.assign(bar.style, {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                padding: '10px',
                backgroundColor: '#ffb700',
                color: '#000',
                textAlign: 'center',
                zIndex: 10000,
                fontSize: '14px'
            });
            document.body.appendChild(bar);
        }
        bar.textContent = msg;
    }

    // Hide the bar after 3 seconds
    function hideBar() {
        const bar = document.getElementById('forwarder-status-bar');
        if (bar) {
            setTimeout(() => bar.remove(), 3000);
        }
    }

    async function forward() {
        showBar('Forwarding projects…');
        try {
            const res1 = await fetch('https://adekosiparis.vanucci.com/Project/GetProjects?page=1&limit=50&customerTitle=&sortBy=crmOrderNo&direction=desc&status=S');
            if (!res1.ok) throw new Error(`Fetch projects failed: ${res1.status}`);
            const data = await res1.json();
            const res2 = await fetch('https://montaj.sistemart.com/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res2.ok) throw new Error(`POST failed: ${res2.status}`);
            showBar('✅ Projects forwarded successfully');
            setCookie('last_forward', Date.now().toString(), 60 * 60 * 24 * 30);
        } catch (err) {
            console.error(err);
            showBar('❌ Error: ' + err.message);
        } finally {
            hideBar();
        }
    }

    function maybeForward() {
        const last = parseInt(getCookie('last_forward') || '0', 10);
        if (Date.now() - last > 30 * 60 * 1000) {
            forward();
        }
    }

    function attachLogoutHandler() {
        const logoutBtn = Array.from(document.querySelectorAll('a, button'))
            .find(el => el.textContent.trim() === 'Çıkış Yap');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => deleteCookie('last_forward'));
        }
    }

    // Run on page load
    maybeForward();
    attachLogoutHandler();
})();

