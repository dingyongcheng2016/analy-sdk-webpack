import { v4 } from 'uuid';
import { Config, getConfig, } from './config'
import { queryString, serialize, each, parseHash, warn, splitGroup,on,off, isInIframe, findIndex, checkEdge, isTypeOf } from './utils/tools'
import { getcommonData, getElmPath, deal, getCurrentPage, updatePages,  getPageInfo} from './utils/index'
import { report } from './reporter'
import { setGlobalPage,  GlobalVal, setGlobalPageStartAt} from './config/global'
import { setCache, getCache, getStringCache, setSessionStorage, getSessionStorage } from './utils/customizeStorage'
import Cookies from 'js-cookie'

// 页面首次点击标志
let isNewPage = false

// 页面初次加载到事件发生的间隔
let pageFromLoadIntervalSecond = 0


export function handleClick(event) {
  tracker(event)
}

export function handleHealth(){
  report("health")
}


// 处理hash变化
// 注意在路由栈的路由不会触发
export function handleHashchange(event) {
  tracker(event)
  let page = Config.enableSPA ? parseHash(location.hash.toLowerCase()) : location.pathname.toLowerCase()
  page && setPage(page, false)
}

// 处理hash变化
export function handleHistorystatechange(event) {
  tracker(event)
  let page = Config.enableSPA ? parseHash(e.detail.toLowerCase()) : e.detail.toLowerCase()
  page && setPage(page, false)
}


// 更新当前页面
export function setPage(page, isFirst) {
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

// 数据采集、发送
export function tracker(event, timeStamp=Date.now()){
    
  // 每次触发的时间、每次访问的时间
  const visitAt = timeStamp
  const currentPageObj = getCurrentPage() 
  // 当前页面
  const pagePath = location.pathname + location.hash 
  if(currentPageObj && currentPageObj.pagePath != pagePath ){
      // 页面首次加载
      isNewPage = true
      // 新页面重置为零
      pageFromLoadIntervalSecond = 0
      // 上次的页面停留时长
      const currentVisitCostSecond = visitAt - GlobalVal.pageStartAt
      // 更新页面开始时间
      setGlobalPageStartAt(visitAt)
      updatePages('pageVisitCostSecond', currentVisitCostSecond / 1000)
  }
  if(currentPageObj && currentPageObj.pageVisitAt){
      // 页面操作动作的时间间隔
      const currentEventIntervalSecond = visitAt - currentPageObj.pageVisitAt
      updatePages('pageEventIntervalSecond', currentEventIntervalSecond / 1000)
  }
  if(isNewPage && event.type === 'click'){
      isNewPage = false
      pageFromLoadIntervalSecond = visitAt - currentPageObj.pageVisitAt
      updatePages('pageFromLoadIntervalSecond', pageFromLoadIntervalSecond / 1000)
  }
  // 存储数据前进行判断发送
  report()
  const pageInfo = getPageInfo(event, visitAt, pageFromLoadIntervalSecond / 1000)
  // 封装数据 保存
  deal(pageInfo)
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


