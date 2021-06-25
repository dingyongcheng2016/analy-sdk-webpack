import { v4 } from 'uuid';
import { Config, getConfig, } from './config'
import { queryString, serialize, each, parseHash, warn, splitGroup,on,off, isInIframe, findIndex, checkEdge, isTypeOf } from './utils/tools'
import { getcommonData, tracker} from './utils/index'
import { report } from './reporter'
import { setGlobalPage,  GlobalVal,} from './config/global'
import { setCache, getCache, getStringCache, removeCache, setSessionStorage, getSessionStorage, removeSessionStorage} from './utils/customizeStorage'
import Cookies from 'js-cookie'


// 处理html node
const normalTarget = function (e) {
  var t, n, r, a, i, o = [];
  if (!e || !e.tagName) return "";
  if (o.push(e.tagName.toLowerCase()), e.id && o.push("#".concat(e.id)), (t = e.className) && "[object String]" === Object.prototype.toString.call(t)) {
    for (n = t.split(/\s+/), i = 0; i < n.length; i++) {
      // className包含active的不加入路径
      if (n[i].indexOf('active') < 0) o.push(".".concat(n[i]));
    }
  }
  var s = ["type", "name", "title", "alt"];
  for (i = 0; i < s.length; i++) r = s[i], (a = e.getAttribute(r)) && o.push("[".concat(
      r, '="').concat(a, '"]'));
  return o.join("")
}

// 获取元素路径，最多保留5层
const getElmPath = function (e) {
  if (!e || 1 !== e.nodeType) return "";
  var ret = [],
      deepLength = 0, // 层数，最多5层
      elm = '' // 元素
  ret.push(`(${e.innerText.substr(0, 50)})`)
  for (var t = e || null; t && deepLength++ < 5 &&!("html" === (elm = normalTarget(t)));) {
    ret.push(elm), t = t.parentNode;
  }
  return ret.reverse().join(" > ")
}

export function handleClick(event) {
  tracker(event)

  var target;
  try {
    target = event.target
  } catch (u) {
    target = "<unknown>"
  }
  if (target.nodeName === 'INPUT' || target.nodeName === 'TEXTAREA') return

  if (0 !== target.length) {
    var behavior = {
      type: 'ui.click',
      data: {
        path: getElmPath(target),
        message: '',
      }
    }
    // 空信息不上报
    if (!behavior.data.path) return
    let commonData = getcommonData()
    let msg = {
      ...commonData,
      ...{
        t: 'behavior',
        behavior,
      }
    }
    report(msg)
  }
}

export function handleHealth(){

}


export function handleBehavior(behavior) {
  let commonData = getcommonData()
  let msg = {
    ...commonData,
    ...{
      t: 'behavior',
      behavior,
    }
  }
  report(msg)
}

const TIMING_KEYS = ["", "fetchStart", "domainLookupStart", "domainLookupEnd", "connectStart",
  "connectEnd", "requestStart", "responseStart", "responseEnd", "", "domInteractive", "",
  "domContentLoadedEventEnd", "", "loadEventStart", "", "msFirstPaint",
  "secureConnectionStart"]

// 处理性能 兼容性考虑 先保留
export function handlePerf() {
  const performance = window.performance
  if (!performance || 'object' !== typeof performance) return
  let data = {
    dns: 0, // DNS查询 domainLookupEnd - domainLookupStart
    tcp: 0, // TCP链接
    ssl: 0, // SSL建连
    ttfb: 0, // 请求响应
    trans: 0,
    dom: 0,
    res: 0,
    firstbyte: 0,
    fpt: 0,
    tti: 0,
    ready: 0,
    load: 0 // domready时间 
  },
  timing = performance.timing || {},
  now = Date.now(),
  type = 1;
  let stateCheck = setInterval(() => {
    if (timing.loadEventEnd) {
      clearInterval(stateCheck)
    
      // 根据PerformanceNavigationTiming计算更准确
      if ("function" == typeof window.PerformanceNavigationTiming) {
          var c = performance.getEntriesByType("navigation")[0];
          c && (timing = c, type = 2)
      }
    
      // 计算data
      each({
        dns: [3, 2],
        tcp: [5, 4],
        ssl: [5, 17],
        ttfb: [7, 6],
        trans: [8, 7],
        dom: [10, 8],
        res: [14, 12],
        firstbyte: [7, 2],
        fpt: [8, 1],
        tti: [10, 1],
        ready: [12, 1],
        load: [14, 1]
      }, function (e, t) {
          var r = timing[TIMING_KEYS[e[1]]],
              o = timing[TIMING_KEYS[e[0]]];
              var c = Math.round(o - r);
          if (2 === type || r !== undefined && o !== undefined) {
              if(t === 'dom') {
                var c = Math.round(o - r);
              }
              c >= 0 && c < 36e5 && (data[t] = c)
          }
      });
    
      var u = window.navigator.connection || (window.navigator).mozConnection || (window.navigator).webkitConnection,
          f = performance.navigation || { type: undefined };
      data.ct = u ? u.effectiveType || u.type : "";
      var l = u ? u.downlink || u.downlinkMax || u.bandwidth || null : null;
      if ((l = l > 999 ? 999 : l) && (data.bandwidth = l), data.navtype = 1 === f.type ? "Reload" :"Other", 1 === type && timing[TIMING_KEYS[16]] > 0 && timing[TIMING_KEYS[1]] > 0) {
          var h = timing[TIMING_KEYS[16]] - timing[TIMING_KEYS[1]];
          h >= 0 && h < 36e5 && (data.fpt = h)
      }
      1 === type && timing[TIMING_KEYS[1]] > 0 
            ? data.begin = timing[TIMING_KEYS[1]] 
            : 2 === type && data.load > 0 ? data.begin = now -
            data.load : data.begin = now
      let commonData = getcommonData()
      let msg = {
        ...commonData,
        t: 'perf',
        ...data,
      }
      report(msg)
    }
  }, 50)
}

// 处理hash变化
// 注意在路由栈的路由不会触发
export function handleHashchange(event) {
  tracker(event)
  let page = Config.enableSPA ? parseHash(location.hash.toLowerCase()) : location.pathname.toLowerCase()
  page && setPage(page, false)
}

// 处理hash变化
export function handleHistorystatechange(e) {
  tracker(event)
  let page = Config.enableSPA ? parseHash(e.detail.toLowerCase()) : e.detail.toLowerCase()
  page && setPage(page, false)
}

// 处理pv
export function handleNavigation(page) {
  let commonData = getcommonData()
  let msg = {
    ...commonData,
    ...{
      t: 'behavior',
      behavior: {
        type: 'navigation',
        data: {
        },
      }
    }
  }
  report(msg)
}

// 更新当前页面
export function setPage(page, isFirst) {
  handleNavigation(page)
  if (isInIframe) {
    window.parent.postMessage({
      t: 'setPage',
      href: location.href,
      page,
    }, '*')
  }
  setGlobalPage(page)
}

// onload事件
export function handleListenLoad(event){
  const performance = window.performance
  if (!performance || 'object' !== typeof performance){
      tracker(event, GlobalVal.pageStartAt)
      return
  }
  let stateCheck = setInterval(() => {
      if (performance.timing.loadEventEnd) {
        clearInterval(stateCheck)
        tracker(event, GlobalVal.pageStartAt)
      }
  }, 50)
}

export function listenMessageListener() {
  on('message', handleMessage);
}

/**
 *
 * @param {*} event {t: '', v: ''}
 *  t: type
 *  v: value
 */
function handleMessage(event) {
  // 防止其他message的干扰
  if (!event.data || !event.data.t) return
  if (event.data.t === 'back') {
    window.history.back()
  } else if (event.data.t === 'forward') {
    window.history.forward()
  }
}

// 初始化一个访问id
export function initSessionId() {
  // 初始化一个访问id
  let sessionId = getSessionStorage('tkSessionId') || Cookies.get('tkSessionId')
  if(!sessionId){
      sessionId = v4()
      setSessionStorage('tkSessionId', sessionId)
      Cookies.set('tkSessionId', sessionId)
  }
}

// 初始化一个客户端唯一永久id
export function initLongSessionId() {
  // 初始化一个客户端唯一永久id
  let longSessionId = getStringCache('longSessionId') || Cookies.get('longSessionId')
  if(!longSessionId){
      longSessionId = v4()
      setCache('longSessionId', longSessionId)
      Cookies.set('longSessionId', longSessionId, { expires: 10000, path: '/' })
  }
}


