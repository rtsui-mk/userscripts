// ==UserScript==
// @name        openbox.ca available online filter
// @namespace   Violentmonkey Scripts
// @version     1.0.0
// @icon        https://www.google.com/s2/favicons?sz=64&domain=openbox.ca
//
// @match       https://openbox.ca/*
// @match       https://www.openbox.ca/*
// @grant       none
// @run-at      document-idle
// @author      ICHx, Claude Sonnet 5.5
// @description Adds a floating toggle that hides products not "Available online" on openbox.ca listings.
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'openbox-online-only';
    const HIDE_CLASS = 'tm-not-online';
    const BTN_ID = 'tm-online-filter-btn';

    let enabled = localStorage.getItem(STORAGE_KEY) === '1';

    const style = document.createElement('style');
    style.textContent = `
        body.tm-online-only .${HIDE_CLASS} { display: none !important; }
        #${BTN_ID} {
            position: fixed; right: 16px; bottom: 16px; z-index: 99999;
            padding: 8px 14px; border: 0; border-radius: 20px; cursor: pointer;
            font: 600 13px sans-serif; color: #fff; background: #777;
            box-shadow: 0 2px 6px rgba(0,0,0,.3);
        }
        #${BTN_ID}.on { background: #1a7f37; }
    `;
    document.head.appendChild(style);

    function isOnline(item) {
        const inv = item.querySelector('.product-item__inventory');
        return !!inv && /available online/i.test(inv.textContent);
    }

    function apply() {
        document.body.classList.toggle('tm-online-only', enabled);
        document.querySelectorAll('.product-item').forEach(item => {
            item.classList.toggle(HIDE_CLASS, !isOnline(item));
        });
        const btn = document.getElementById(BTN_ID);
        if (btn) {
            btn.classList.toggle('on', enabled);
            const hidden = document.querySelectorAll('.' + HIDE_CLASS).length;
            const label = enabled
                ? `Online only: ON (${hidden} hidden)`
                : 'Online only: OFF';
            // Skip no-op writes so the MutationObserver doesn't retrigger itself.
            if (btn.textContent !== label) btn.textContent = label;
        }
    }

    function addButton() {
        if (document.getElementById(BTN_ID)) return;
        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.type = 'button';
        btn.addEventListener('click', () => {
            enabled = !enabled;
            localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
            apply();
        });
        document.body.appendChild(btn);
    }

    addButton();
    apply();

    // Re-apply when the listing is replaced (ajax filter/sort/pagination).
    let timer;
    new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(apply, 100);
    }).observe(document.body, { childList: true, subtree: true });
})();
