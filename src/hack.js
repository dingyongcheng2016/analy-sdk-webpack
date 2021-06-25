import { parseUrl, fnToString, warn, dispatchCustomEvent, on, parseHash } from './utils/tools'
import { handleBehavior, setPage, } from './handlers'
import { Config } from './config'

// hack console
// "debug", "info", "warn", "log", "error"
export function hackConsole() {
  if (window && window.console) {
    for (var e = Config.behavior.console, n = 0; e.length; n++) {
      var r = e[n];
      var action = window.console[r]
      if (!window.console[r]) return;
        (function (r, action) {
          window.console[r] = function() {
            var i = Array.prototype.slice.apply(arguments)
            var s = {
              type: "console",
              data: {
                level: r,
                message: JSON.stringify(i),
              }
            };
            handleBehavior(s)
            action && action.apply(null, i)
          }
        })(r, action)
    }
  }
}

/**
 * hack pushstate replaceState
 * 派送historystatechange historystatechange事件
 * @export
 * @param {('pushState' | 'replaceState')} e
 */
export function hackState(e) {
  var t = history[e]
  "function" == typeof t && (history[e] = function (n, i, s) {
    !window['__bb_onpopstate_'] && hackOnpopstate(); // 调用pushState或replaceState时hack Onpopstate
    var c = 1 === arguments.length ? [arguments[0]] : Array.apply(null, arguments),
        u = location.href,
        f = t.apply(history, c);
    if (!s || "string" != typeof s) return f;
    if (s === u) return f;
    try {
        var l = u.split("#"),
            h = s.split("#"),
            p = parseUrl(l[0]),
            d = parseUrl(h[0]),
            g = l[1] && l[1].replace(/^\/?(.*)/, "$1"),
            v = h[1] && h[1].replace(/^\/?(.*)/, "$1");
        p !== d ? dispatchCustomEvent("historystatechanged", d) : g !== v && dispatchCustomEvent("historystatechanged", v)
    } catch (m) {
      warn("[retcode] error in " + e + ": " + m)
    }
    return f
  }, history[e].toString = fnToString(e))
}


export function hackOnpopstate() {
  window['__bb_onpopstate_'] = window.onpopstate
  window.onpopstate = function () {
    for (var r = arguments.length, a = new Array(r), o = 0; o < r; o++) a[o] = arguments[o];
    let page = Config.enableSPA ? parseHash(location.hash.toLowerCase()) : location.pathname.toLowerCase()
    setPage(page, false)
    if (window.__bb_onpopstate_) return window.__bb_onpopstate_.apply(this, a)
  }
}