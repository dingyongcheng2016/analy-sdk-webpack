import {Config} from '../config'
import { GlobalVal, setGlobalPageStartAt } from '../config/global'
import {randomString, parseHash} from './tools'
import { setCache, getCache, getStringCache, removeCache, setSessionStorage, getSessionStorage, removeSessionStorage} from './customizeStorage'
import Cookies from 'js-cookie'
import Timing from  './timing.min'




export function getcommonData() {
 
  let data = {
   
  }
  return data
}


export function getInitPageInfos() {
  // 初始整个预置数据信息
  const initPageInfos = {
      env: {
          envPixelRatio: window.devicePixelRatio,
          envScreenWidth: window.screen.width || document.documentElement.clientWidth || document.body.clientWidth, // 屏幕宽度，单位px
          envScreenHeight: window.screen.height || document.documentElement.clientHeight || document.body.clientHeight, // 屏幕高度，单位px
          envUserAgent: '' // 浏览器ua
      },
      session: {
          session_id: '', // 一次会话id sessionStorage/cookie 存储
          long_session_id: '', // 长期会话id  localStorage 存储
          token: '',
          userId: '',
          identity: '',
      },
      code: {
          code_project: '', // 项目
          code_subproject: '', // 子项目
          code_version: '', // 代码版本号
          code_git_commit_id: '' // 代码git commit id
      },
      sendAt: Date.now(), // 上报时间 timestamp
      pages: []
  }

  return initPageInfos
}

// 初始页面访问信息、用户行为
export function getInitPages() {
  return []
}



// code信息/代码信息
export function getCodeInfo(){
  return {
    code: Config.code
  }
}

// 获取环境、设备访问信息，初始化获取
export function getEnvInfo(){
  // (113.615405, 34.777552) 默认经纬度
  return {
      env: {
          envPixelRatio: window.devicePixelRatio,
          envScreenWidth: window.screen.width || document.documentElement.clientWidth || document.body.clientWidth, // 屏幕宽度，单位px
          envScreenHeight: window.screen.height || document.documentElement.clientHeight || document.body.clientHeight, // 屏幕高度，单位px
          envUserAgent: ''
      }   
  }
  
}


// 获取会话信息，每次获取防止失效，可以优化
export function getSessionInfo(){
  const sessionId = getSessionStorage('tkSessionId') || Cookies.get('tkSessionId')
  const longSessionId = getStringCache('longSessionId') || Cookies.get('longSessionId')
  const token = getStringCache('accessToken') || getStringCache('token') || Cookies.get('accessToken') || Cookies.get('token') || ''
  const userInfo = getCache('userInfo') || Cookies.get('userInfo') || {}
  const userId = getStringCache('userId') || Cookies.get('userId') || userInfo.userId || userInfo.id
  const identity = getStringCache('identity') || Cookies.get('identity') || userInfo.identity || ''
  return {
      session: {
          ip: '',
          sessionId, // 访问ID, 
          longSessionId,
          token,
          userId,
          identity,
      }
  }
}

// 获取performance 
// 在单页应用中改变了url但不刷新页面的情况下是不会更新的。
// 因此如果仅仅通过该api是无法获得每一个子路由所对应的页面渲染的时间。
export function getPerformanceInfo(){
  const { 
      loadTime, 
      domReadyTime, 
      readyStart, 
      redirectTime, 
      appcacheTime, 
      unloadEventTime, 
      lookupDomainTime, 
      connectTime, 
      requestTime, 
      initDomTreeTime, 
      loadEventTime   } = Timing.getTimes()
  return {
      loadTime, // Total time from start to load
      domReadyTime, // Time spent constructing the DOM tree
      readyStart, // Time consumed preparing the new page
      redirectTime, // Time spent during redirection
      appcacheTime, // AppCache
      unloadEventTime, // Time spent unloading documents
      lookupDomainTime, // DNS query time
      connectTime, // TCP connection time
      requestTime, // Time spent during the request
      initDomTreeTime, // Request to completion of the DOM loading
      loadEventTime,  // Load event time
  }

}

// 获取页面信息
export function getPageInfo(event, visitAt, pageFromLoadIntervalSecond ){
    
  const dataset = Object.keys(event.target.dataset || {})
  console.log('dataset', dataset)
  //navigation ：网页导航相关
  // performance.navigation.type
  //0 : TYPE_NAVIGATE (用户通过常规导航方式访问页面，比如点一个链接，或者一般的get方式)
  //1 : TYPE_RELOAD (用户通过刷新，包括JS调用刷新接口等方式访问页面)
  //2 : TYPE_BACK_FORWARD (用户通过后退按钮访问本页面)
  const isRefresh = performance.navigation.type == 1
  const { type, target, pageX=0, pageY=0 } = event
  const { id='', className='', nodeName='', nodeType='' } = target
  // console.log('event', event, 'target', event.target)
  let customizeType = ''
  switch (type) {
      case 'load':
          // 判断刷新、首次进入
          customizeType = isRefresh ? 'refresh' : 'pageLoad'
          break;
      case 'hashchange':
          // 判断刷新、首次进入
          customizeType = 'pageLoad'
          break;
      case 'replacestate':
          // 判断刷新、首次进入
          customizeType = 'pageLoad'
          break;

      case 'pushstate':
          // 判断刷新、首次进入
          customizeType = 'pageLoad'
          break;
          
      case 'click':
          if(nodeName == "BUTTON"){
              customizeType = 'buttonClick'
          }
          if(nodeName == "A"){
              customizeType = 'herfClick'
          }
          if(dataset.indexOf('tab') > -1 || id.indexOf('tab') > -1 || String(className).indexOf('tab') > -1){
              customizeType = 'tabChange'
          }
          // 判断click的虚拟事件类型
          customizeType =  dataset.indexOf('trackerTab') > -1 ? 'tabChange' : 
              dataset.indexOf('buttonClick') > -1 ? 'buttonClick' :  
              dataset.indexOf('herfClick') > -1 ? 'herfClick' : type;
          break;
  
      default:
          customizeType = type
          break;
  }  

  const domain = document.domain
  // 需要代码埋点
  const submodule = document.pageSubmodule
  const hashurl = document.location.hash
  const hashIndex = hashurl.indexOf('?')
  const pagePath = document.location.pathname + (hashIndex > -1 ? hashurl.slice(0, hashIndex) : hashurl)
  const hashParameters = hashIndex > -1 ?  hashurl.slice(hashIndex+1).replace(/&/g,',') : ''
  const searchParameters = document.location.search && document.location.search.slice(1).replace(/&/g,',')
  const queryParameters= !!searchParameters ? `${searchParameters},${hashParameters}` : hashParameters
  const title = document.title
  const referrer = document.referrer
  
  return {
      pageDomain: domain, // 域名,www.967111.net 访问的域名，当为 iOS / Android 时，为 app 包名。
      pageSubmodule: submodule, // 代码子模块,请假 功能模块
      pagePath, // 页面, pages/index, 页面路径
      pageQueryParameters: queryParameters, // 参数,cid=1234567
      pageTitle: title, // 标题,
      pageReferrer: referrer, // 来源页面URL, 当前页面浏览的上一个页面的完整url。
      pageVisitAt: visitAt, // 访问时间
      pageEventType: customizeType, // 事件类型, navigateTo,初始化sessionid,点击按钮,点击链接,刷新
      pageEventId: id, // 点击按钮/链接/select的id, 点击按钮/链接/select的id
      pageEventMouseTop: pageX, // 位置坐标Y
      pageEventMouseLeft: pageY, // 位置坐标X
      pageTag1: getElmPath(event.target) || '', // 自定义埋点参数1
      pageVisitCostSecond: 0, // 页面访问花费时长(秒)
      pageEventIntervalSecond: 0, // 动作访问间隔时长(秒)
      pageFromLoadIntervalSecond, // 页面初次加载到事件发生的间隔事件
  }

}

// 封装数据
export function deal(pageInfo){
  const pageInfos = getCache('pageInfos') || getInitPageInfos()
  const pages = getCache('pages') || getInitPages()
  const sessionInfo = getSessionInfo()
  const performanceInfo = getPerformanceInfo()
  // 更新pages
  const tempPageInfos = {
      ...getInitPageInfos(),
      ...pageInfos,
      ...getCodeInfo,
      ...getEnvInfo,
      ...sessionInfo
  }
  // 更新pageInfos
  const pageObj = {
      ...pageInfo,
      ...performanceInfo
  }
  pages.push(pageObj)
  // 本地存储数据
  setCache('pageInfos', tempPageInfos)
  setCache('pages', pages)
}


// 获取当前记录
export function getCurrentPage(){
  const tempPages = getCache('pages') || getInitPages()
  const length = tempPages.length
  return tempPages[length - 1]
}

// 更新当前数据Pages
export function updatePages(key, value){
  const tempPages = getCache('pages') || getInitPages()
  const length = tempPages.length
  tempPages[length-1][key] = value
  setCache('pages', tempPages)
  return tempPages
}

// 更新当前数据pageInfos
export function updatePageInfos(key, value){
  const tempPageInfos = getCache('pageInfos') || getInitPageInfos()
  const arr = key.split('.')
  const length = arr.length
  switch (length) {
      case 1:
          tempPageInfos[arr[length-1]] = value
          break;

      case 2:
      (tempPageInfos[arr[length-2]])[arr[length-1]] = value
      break;
  
      default:
          break;
  }
  setCache('pageInfos', tempPageInfos)
  return tempPageInfos
}

// 处理html node
function normalTarget (e) {
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
export function getElmPath (e) {
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


// 获取页面
function getPage() {
  if (GlobalVal.page) return GlobalVal.page
  else {
    return location.pathname.toLowerCase()
  }
}