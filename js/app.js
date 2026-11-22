/* Hihi Digitizing - app experience: service worker, bottom nav, install banner */
(function () {
  "use strict";
  var isMobile = function () { return window.matchMedia("(max-width: 991.98px)").matches; };
  var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  /* 1. Service worker (needs https or localhost) */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function () {});
    });
  }

  /* 2. Bottom navigation bar */
  function buildNav() {
    var page = decodeURIComponent((location.pathname.split("/").pop() || "index.html")).toLowerCase();
    var items = [
      { href: "index.html", icon: "fa-home", label: "Home", match: ["index.html", "", "about.html"] },
      { href: "service.html", icon: "fa-cogs", label: "Services", match: ["service.html"] },
      { href: "blog.html", icon: "fa-images", label: "Portfolio", match: ["blog.html"] },
      { href: "contact.html", icon: "fa-envelope", label: "Contact", match: ["contact.html"] }
    ];
    var nav = document.createElement("nav");
    nav.className = "app-nav"; nav.setAttribute("aria-label", "App navigation");
    nav.innerHTML = items.map(function (i) {
      return '<a href="' + i.href + '" class="' + (i.match.indexOf(page) > -1 ? "active" : "") + '"><i class="fas ' + i.icon + '"></i><span>' + i.label + "</span></a>";
    }).join("") +
      '<a class="app-wa" href="https://wa.me/923452669812?text=' + encodeURIComponent("Hi Hihi Digitizing, I need a free quote.") +
      '" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i><span>Get Quote</span></a>';
    document.body.appendChild(nav);
  }

  /* 3. Install banner (Android/Chrome prompt + iPhone instructions) */
  var deferred = null, banner = null;
  var KEY = "hihi_install_dismissed";
  function dismissedRecently() {
    try { var t = +localStorage.getItem(KEY); return t && Date.now() - t < 7 * 864e5; } catch (e) { return false; }
  }
  function hide() { if (banner) banner.classList.remove("show"); document.body.classList.remove("app-banner-on"); try { localStorage.setItem(KEY, Date.now()); } catch (e) {} }
  function showBanner(ios) {
    if (standalone || !isMobile() || dismissedRecently() || banner) return;
    banner = document.createElement("div"); banner.className = "app-install"; banner.setAttribute("role", "dialog");
    banner.innerHTML = '<img src="icons/icon-192.png" alt="">' +
      '<div class="ai-t"><b>Install Hihi Digitizing App</b><small>' +
      (ios ? "Tap <b style='display:inline'>Share</b> <i class='fas fa-share-square'></i> then &quot;Add to Home Screen&quot;" : "Fast access, works offline. Free.") +
      "</small></div>" + (ios ? "" : '<button class="ai-go">Install</button>') + '<button class="ai-x" aria-label="Close">&times;</button>';
    document.body.appendChild(banner);
    document.body.classList.add("app-banner-on");
    requestAnimationFrame(function () { banner.classList.add("show"); });
    banner.querySelector(".ai-x").onclick = hide;
    var go = banner.querySelector(".ai-go");
    if (go) go.onclick = function () {
      if (!deferred) return hide();
      deferred.prompt();
      deferred.userChoice.finally(function () { deferred = null; hide(); });
    };
  }
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferred = e; setTimeout(function () { showBanner(false); }, 4000);
  });
  window.addEventListener("appinstalled", function () { if (banner) banner.remove(); banner = null; document.body.classList.remove("app-banner-on"); });
  var ua = navigator.userAgent;
  var iosSafari = /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  if (iosSafari) setTimeout(function () { showBanner(true); }, 5000);

  /* 4. Online / offline toast */
  function toast(msg) {
    var t = document.createElement("div"); t.className = "app-toast show"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  window.addEventListener("offline", function () { toast("You are offline"); });
  window.addEventListener("online", function () { toast("Back online"); });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildNav); else buildNav();
})();
