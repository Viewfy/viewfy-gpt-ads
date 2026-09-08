(function () {
  "use strict";
  if (window.__astra_init) return;
  window.__astra_init = true;

  var ENDPOINT = "/api/t";
  var COOKIE = "_astra";
  var COOKIE_DAYS = 365;
  var script = document.currentScript;
  var pid = script && script.getAttribute("data-id");
  if (!pid) return;

  var src = script.src || "";
  var origin = "";
  try { origin = new URL(src).origin; } catch (e) {}
  var url = origin + ENDPOINT;

  function getCookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function setCookie(name, val, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 864e5);
    document.cookie = name + "=" + encodeURIComponent(val) +
      ";path=/;expires=" + d.toUTCString() + ";SameSite=Lax";
  }

  function genId() {
    var a = new Uint8Array(24);
    crypto.getRandomValues(a);
    return Array.from(a, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  var params = new URLSearchParams(window.location.search);
  var sid = getCookie(COOKIE) || genId();
  setCookie(COOKIE, sid, COOKIE_DAYS);

  function eventId() {
    var a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return Array.from(a, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  function send(event, extra) {
    var data = {
      event: event,
      pid: pid,
      sid: sid,
      eid: eventId(),
      url: window.location.href,
      source: "gpt6-astra",
    };
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "fbclid", "gclid", "msclkid"].forEach(function (k) {
      var v = params.get(k);
      if (v) data[k] = v;
    });
    if (extra) {
      if (extra.value !== undefined) data.value = extra.value;
      if (extra.currency) data.currency = extra.currency;
    }
    try {
      fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        mode: "no-cors",
        keepalive: true,
        headers: { "Content-Type": "text/plain" },
      });
    } catch (e) {}
  }

  function astra(action, eventName, extra) {
    if (action === "track") return send(eventName, extra);
    if (action === "sid") return sid;
  }

  send("PageView");
  window.astra = astra;
  window.viewfy = window.viewfy || astra;
})();
