import { Config, setConfig, } from './config'
import { handleHealth, handleHashchange, handleHistorystatechange, 
  handleClick, setPage, listenMessageListener, handleListenLoad, initSessionId, initLongSessionId} from './handlers'
import {on,off, parseUrl} from './utils/tools'
import { hackState } from './hack'
import { setGlobalPage, GlobalVal, setGlobalPageStartAt} from './config/global'
import Timing from  './utils/timing.min'


export default class Analysis {

  constructor(options, fn) {
    this.init(options)
  }

  init(options) {
    console.log('options', options)
    // 初始化一些基本信息
    this.initData()

    // 更新配置
    setConfig(options)
    
    // 更新页面信息
    // 判断单页面
    const page = Config.enableSPA ? location.pathname.toLowerCase() + location.hash.toLowerCase() : location.pathname.toLowerCase()
    setPage(page, true)

    // 页面加载完毕
    this.addListenLoad()

    // 监听路由
    Config.enableSPA && this.addListenRouterChange();
    
    // 行为是一个页面内的操作
    Config.isBehavior && this.addListenBehavior()

    // 绑定全局变量
    // window.__bb = this

    // 监听unload事件
    this.addListenUnload()
    
    // 监听message
    listenMessageListener()
    
  }

  // 初始化一部分数据
  initData(){
    // Timing.getTimes().fetchStart
    // 页面首次开始加载的时间点,浏览环境下卸载前一个文档结束之时的 Unix毫秒时间戳
    // 更新pageStartAt
    setGlobalPageStartAt(Timing ? Timing.getTimes().fetchStart : Date.now())
    initSessionId()
    initLongSessionId()
  }

  // 监听load
  addListenLoad() {
    on('load', handleListenLoad);
  }

  // 监听行为
  addListenBehavior() {
  
    Config.isBehavior && this.addListenClick()
  }

  // 监听click
  addListenClick() {
    on('click', handleClick); // 非输入框点击，会过滤掉点击输入框
  }

  // 监听路由
  addListenRouterChange() {
    hackState('pushState')
    hackState('replaceState')
    on('hashchange', handleHashchange)
    on('historystatechanged', handleHistorystatechange)
  }

  // beforeunload
  addListenUnload() {
    on('beforeunload', handleHealth)
    this.destroy()
  }


  // 移除路由
  removeListenRouterChange() {
    off('hashchange', handleHashchange)
    off('historystatechanged', handleHistorystatechange)
  }


  removeListenLoad() {
    off('load', handleListenLoad);
  }


  destroy() {
    Config.enableSPA && this.removeListenRouterChange();
    this.removeListenLoad()
  }
  
}