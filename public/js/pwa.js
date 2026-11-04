/* ============================================================
   vidhara.id — PWA Runtime
   - Registrasi Service Worker (semua halaman)
   - Tombol "Install App" (muncul hanya saat browser mengizinkan prompt)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Service Worker registration ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function (err) {
        console.warn('[PWA] Registrasi service worker gagal:', err);
      });
    });
  }

  /* ---------- Install prompt ---------- */
  var deferredPrompt = null;
  var installButtons = [];
  var DISMISS_KEY = 'bd_pwa_install_dismissed';
  var DISMISS_TTL = 7 * 24 * 60 * 60 * 1000; // seminggu

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage tidak tersedia (private mode) */
    }
  }

  function recentlyDismissed() {
    var ts = parseInt(storageGet(DISMISS_KEY), 10);
    return Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL;
  }

  function showInstallUI() {
    installButtons.forEach(function (btn) {
      btn.classList.add('is-visible');
      btn.removeAttribute('aria-hidden');
    });
  }

  function hideInstallUI() {
    installButtons.forEach(function (btn) {
      btn.classList.remove('is-visible');
      btn.setAttribute('aria-hidden', 'true');
    });
  }

  function collectButtons() {
    installButtons = Array.prototype.slice.call(document.querySelectorAll('[data-pwa-install]'));
    installButtons.forEach(function (btn) {
      btn.setAttribute('aria-hidden', 'true');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice
          .then(function (choice) {
            if (choice && choice.outcome === 'accepted') {
              hideInstallUI();
              deferredPrompt = null;
            }
          })
          .catch(function () {
            /* prompt dibatalkan */
          });
      });
    });

    // Tombol tutup kecil (opsional) di samping install pill
    var dismiss = document.querySelector('[data-pwa-install-dismiss]');
    if (dismiss) {
      dismiss.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        hideInstallUI();
        storageSet(DISMISS_KEY, String(Date.now()));
      });
    }
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    if (!recentlyDismissed()) {
      showInstallUI();
    }
  });

  window.addEventListener('appinstalled', function () {
    hideInstallUI();
    deferredPrompt = null;
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', collectButtons);
  } else {
    collectButtons();
  }
})();
