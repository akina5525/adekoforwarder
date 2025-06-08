// ==UserScript==
// @name         Adekosiparis → Vertigram Forwarder
// @namespace    https://github.com/akina5525/adekoforwarder
// @version      1.0.1
// @description  Adds a button to forward projects to Vertigram API
// @match        https://adekosiparis.vanucci.com/*
// @updateURL    https://raw.githubusercontent.com/akina5525/adekoforwarder/main/forwarder.user.js
// @downloadURL  https://raw.githubusercontent.com/akina5525/adekoforwarder/main/forwarder.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create the button
    const btn = document.createElement('button');
    btn.textContent = 'Forward Projects';
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 15px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        zIndex: 9999
    });

    // Click handler
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Sending…';
        try {
            const res1 = await fetch('https://adekosiparis.vanucci.com/Project/GetProjects?page=1&limit=50');
            if (!res1.ok) throw new Error(`Fetch projects failed: ${res1.status}`);
            const data = await res1.json();
            const res2 = await fetch('https://portal.vertigram.com/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res2.ok) throw new Error(`POST failed: ${res2.status}`);
            alert('✅ Projects forwarded successfully!');
        } catch (err) {
            console.error(err);
            alert('❌ Error: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Forward Projects';
        }
    });

    // Insert into page
    document.body.appendChild(btn);
})();

