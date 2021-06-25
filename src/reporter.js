
import { Config, } from './config'
import { serialize, warn } from './utils/tools'
import { setCache, getCache } from './utils/customizeStorage'
import { getInitPageInfos, getInitPages, updatePageInfos } from './utils/index'
// 上报
export function report(type="behavior") {
  // 上报数据
  const tempPages = getCache('pages') || getInitPages()
  // 发送条件、数据截取、发送方式
  if(tempPages.length > Config.maxLength || "health" === type){
    const tempPageInfos = getCache('pageInfos') || getInitPageInfos()
    const sendAt = Date.now()
    const currentPages = tempPages.splice(-1, 1)
    tempPageInfos.pages = tempPages
    tempPageInfos.sendAt = sendAt
    updatePageInfos('sendAt', sendAt)
    const cb = function(){
      // 保存当前页面信息的数据，下次发送
      setCache('pages', currentPages)  
    }
    "behavior" === type ? post(tempPageInfos, cb) 
      : window && window.navigator && "function" == typeof window.navigator.sendBeacon ? sendBeacon(tempPageInfos, cb) 
      : get(tempPageInfos, cb);

    
  }
    
}

// post上报
export function post(body, cb) {
  const XMLHttpRequest = window.__oXMLHttpRequest_ || window.XMLHttpRequest;
  if (typeof XMLHttpRequest === 'function') {
    try {
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange=function()
      {
          if (xhr.readyState==4 && xhr.status==200){
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
    ? window.navigator.sendBeacon(Config.reportUrl, JSON.stringify(data)) && "function" == typeof cb && cb()
    : warn("[arms] navigator.sendBeacon not surported") 
}

