// 默认参数
export let Config = {
  // 所属项目信息
  code: {
    codeProject: '爱家校', // 项目, 如老系统,爱家校
    codeSubproject: '爱家校管理后台', // 子项目,爱家校小程序, 一般按照git项目区分
    codeVersion: 'v1.6.6', // 代码版本号
    codeGitCommitId: '1212dasdasd'
  },
  // 上报地址
  reportUrl: 'http://localhost:10000',
  // 脚本延迟上报时间
  outtime: 300,
  // 开启单页面？
  enableSPA: true,
  // 是否上报行为
  isBehavior: true,
  // 行为类型
  behavior: {
    console: ['log', 'error'], // 取值可以是"debug", "info", "warn", "log", "error"
    click: true,
  },
  // 最长上报数据长度
  maxLength: 50,
  method: 'ajax'
}

// 设置参数
export function setConfig(options) {
  Config = {
    ...Config,
      ...options
  }
}

export function getConfig(e) {
  return e ? Config[e] ? Config[e] : {} : {}
}