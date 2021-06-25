
import { Config, } from './config'
import { queryString, serialize, warn } from './utils/tools'

// 上报
export function report(e, type, cb) {
    "behavior" === type ? post(e, cb) 
      : "health" === type && window && window.navigator && "function" == typeof window.navigator.sendBeacon ? sendBeacon(e, cb) 
      : get(e, cb);
  return this
}

// post上报
export function post(body, cb) {
  var XMLHttpRequest = window.__oXMLHttpRequest_ || window.XMLHttpRequest;
  if (typeof XMLHttpRequest === 'function') {
    try {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange=function()
      {
          if (xmlhttp.readyState==4 && xmlhttp.status==200){
              "function" == typeof cb && cb()
              console.log('上报成功！timestamp', Date.now())
          }
      }
      xhr.open("POST", Config.reportUrl)
      // 设置header的默认值
      xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      xhr.send(JSON.stringify(body))
    } catch (e) {
      warn('[analysisjs] Failed to log, POST请求失败')
    }
  } else {
    warn('[analysisjs] Failed to log, 浏览器不支持XMLHttpRequest')
  }
}


// get上报
export function get(data, cb) {
  new Image().src = `${Config.reportUrl}?${serialize(data)}`
  "function" == typeof cb && cb()
}



// 健康检查上报
export function sendBeacon(data, cb) {
  
  window && window.navigator && "function" == typeof window.navigator.sendBeacon 
    ? window.navigator.sendBeacon(Config.reportUrl, data) && "function" == typeof cb && cb()
    : warn("[arms] navigator.sendBeacon not surported") 
}

