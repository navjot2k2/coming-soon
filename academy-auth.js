/* ==========================================================================
   SunRE Academy — shared password gate.
   Include this on every page under the Academy hub via:
     <script src="academy-auth.js"></script>

   TO CHANGE THE PASSWORD: edit ACADEMY_PASSWORD below and re-upload this
   file. Changing it automatically re-locks everyone who was previously
   let in — you don't need to touch any other file.

   NOTE: this is a client-side deterrent, not real security. The password
   lives in this file and is visible to anyone who views page source. It
   keeps the page from showing up to casual visitors / search engines, but
   should not be relied on to protect sensitive data.
   ========================================================================== */
(function () {
  var ACADEMY_PASSWORD = "Sunre2026";
  var STORAGE_KEY = "sunre_academy_unlocked";

  function encode(pw) {
    try { return btoa(pw); } catch (e) { return pw; }
  }

  // Already unlocked with the CURRENT password? Let the page through.
  if (localStorage.getItem(STORAGE_KEY) === encode(ACADEMY_PASSWORD)) {
    addLockControlWhenReady();
    return;
  }

  // Hide the page immediately so protected content never flashes on screen.
  document.documentElement.style.visibility = "hidden";

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showGate);
  } else {
    showGate();
  }

  function showGate() {
    var overlay = document.createElement("div");
    overlay.id = "academyGateOverlay";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:999999;background:#0f1f2e;" +
      "display:flex;align-items:center;justify-content:center;" +
      "font-family:'DM Sans',sans-serif;padding:24px;";

    overlay.innerHTML =
      '<div style="max-width:380px;width:100%;background:#ffffff;border-radius:10px;padding:2.5rem;text-align:center;">' +
        '<div style="font-family:\'DM Serif Display\',serif;font-size:1.5rem;color:#0f1f2e;margin-bottom:0.5rem;">SunRE Academy</div>' +
        '<p style="font-size:0.88rem;color:#4a5a6a;margin-bottom:1.5rem;line-height:1.6;">This area is password-protected. Enter the access password to continue.</p>' +
        '<input type="password" id="academyGatePw" placeholder="Password" autocomplete="off" ' +
          'style="width:100%;padding:12px 14px;border:1px solid #e2e4e1;border-radius:4px;font-size:0.95rem;margin-bottom:0.75rem;outline:none;box-sizing:border-box;font-family:\'DM Sans\',sans-serif;" />' +
        '<div id="academyGateError" style="color:#b5433a;font-size:0.82rem;margin-bottom:1rem;display:none;">Incorrect password — try again.</div>' +
        '<button id="academyGateBtn" style="width:100%;background:#0f1f2e;color:#fff;border:none;padding:14px;border-radius:4px;font-size:0.9rem;cursor:pointer;font-family:\'DM Sans\',sans-serif;">Unlock →</button>' +
      "</div>";

    document.body.appendChild(overlay);
    document.documentElement.style.visibility = "visible";

    var input = document.getElementById("academyGatePw");
    var btn = document.getElementById("academyGateBtn");
    var err = document.getElementById("academyGateError");

    function attempt() {
      if (input.value === ACADEMY_PASSWORD) {
        localStorage.setItem(STORAGE_KEY, encode(ACADEMY_PASSWORD));
        overlay.remove();
        addLockControlWhenReady();
      } else {
        err.style.display = "block";
        input.value = "";
        input.focus();
      }
    }

    btn.addEventListener("click", attempt);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") attempt();
    });
    setTimeout(function () { input.focus(); }, 50);
  }

  // Adds a small "Lock" link next to the "← Back to Academy" nav link (if
  // present) so a teacher on a shared device can re-lock it manually.
  function addLockControlWhenReady() {
    function add() {
      if (document.getElementById("academyLockLink")) return;
      var anchor = document.querySelector(".nav-back") || document.querySelector("nav");
      if (!anchor) return;
      var lockLink = document.createElement("a");
      lockLink.id = "academyLockLink";
      lockLink.href = "#";
      lockLink.textContent = "🔒 Lock";
      lockLink.style.cssText = "font-size:0.85rem;color:#4a5a6a;text-decoration:none;margin-left:1rem;";
      lockLink.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      });
      anchor.parentNode.insertBefore(lockLink, anchor.nextSibling);
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", add);
    } else {
      add();
    }
  }
})();
