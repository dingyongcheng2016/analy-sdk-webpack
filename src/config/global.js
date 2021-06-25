
// 默认参数
export let GlobalVal = {
  pageStartAt: Date.now(), // 页面首次开始加载的时间点,浏览环境下卸载前一个文档结束之时的 Unix毫秒时间戳
  page: '', // 当前页面
}

// 设置全局页面路径
export function setGlobalPage(page) {
  GlobalVal.page = page
}


// 设置pageStartAt
export function setGlobalPageStartAt(pageStartAt) {
  GlobalVal.pageStartAt = pageStartAt
}
